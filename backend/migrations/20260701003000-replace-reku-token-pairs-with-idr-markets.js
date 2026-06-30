import { readFileSync } from 'node:fs';

const rekuIdrPairs = JSON.parse(
  readFileSync(new URL('../data/reku-pairs.json', import.meta.url), 'utf8')
);

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const [exchangeRows] = await queryInterface.sequelize.query(
      'SELECT id FROM exchanges WHERE name = :name LIMIT 1',
      {
        replacements: { name: 'Reku' },
        transaction
      }
    );
    const reku = exchangeRows[0];
    if (!reku) {
      throw new Error('Reku exchange not found');
    }

    const [quoteRows] = await queryInterface.sequelize.query(
      'SELECT id FROM tokens WHERE symbol = :symbol LIMIT 1',
      {
        replacements: { symbol: 'IDR' },
        transaction
      }
    );
    const idr = quoteRows[0];
    if (!idr) {
      throw new Error('IDR token not found');
    }

    const baseSymbols = [...new Set(rekuIdrPairs.map((symbol) => symbol.split('_')[0]))];
    const [existingTokenRows] = await queryInterface.sequelize.query(
      'SELECT symbol FROM tokens WHERE symbol IN (:symbols)',
      {
        replacements: { symbols: baseSymbols },
        transaction
      }
    );
    const existingSymbols = new Set(existingTokenRows.map((token) => token.symbol));
    const [maxTokenRows] = await queryInterface.sequelize.query(
      'SELECT COALESCE(MAX(id), 0) AS max_id FROM tokens',
      { transaction }
    );
    let nextTokenId = Number(maxTokenRows[0]?.max_id || 0) + 1;
    const now = new Date();
    const missingTokens = baseSymbols
      .filter((symbol) => !existingSymbols.has(symbol))
      .map((symbol) => ({
        id: nextTokenId++,
        symbol,
        name: symbol,
        coingecko_id: null,
        is_active: true,
        created_at: now,
        updated_at: now
      }));

    if (missingTokens.length > 0) {
      await queryInterface.bulkInsert('tokens', missingTokens, { transaction });
    }

    const [baseTokenRows] = await queryInterface.sequelize.query(
      'SELECT id, symbol FROM tokens WHERE symbol IN (:symbols)',
      {
        replacements: { symbols: baseSymbols },
        transaction
      }
    );
    const baseTokenBySymbol = new Map(baseTokenRows.map((token) => [token.symbol, token]));

    await queryInterface.bulkDelete(
      'token_pairs',
      { exchange_id: reku.id },
      { transaction }
    );

    const [maxPairRows] = await queryInterface.sequelize.query(
      'SELECT COALESCE(MAX(id), 0) AS max_id FROM token_pairs',
      { transaction }
    );
    let nextPairId = Number(maxPairRows[0]?.max_id || 0) + 1;

    const tokenPairs = rekuIdrPairs.map((symbol) => {
      const [baseSymbol] = symbol.split('_');
      const baseToken = baseTokenBySymbol.get(baseSymbol);
      if (!baseToken) {
        throw new Error(`Missing token seed for Reku pair ${symbol}`);
      }

      return {
        id: nextPairId++,
        exchange_id: reku.id,
        base_token_id: baseToken.id,
        quote_token_id: idr.id,
        symbol,
        is_active: true,
        created_at: now,
        updated_at: now
      };
    });

    await queryInterface.bulkInsert('token_pairs', tokenPairs, { transaction });
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const [exchangeRows] = await queryInterface.sequelize.query(
      'SELECT id FROM exchanges WHERE name = :name LIMIT 1',
      {
        replacements: { name: 'Reku' },
        transaction
      }
    );
    const reku = exchangeRows[0];
    if (!reku) return;

    await queryInterface.bulkDelete(
      'token_pairs',
      { exchange_id: reku.id },
      { transaction }
    );
  });
}
