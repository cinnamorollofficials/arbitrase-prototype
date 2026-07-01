import { readFileSync } from 'node:fs';

const mobeeIdrPairs = JSON.parse(
  readFileSync(new URL('../data/mobee-pairs.json', import.meta.url), 'utf8')
);

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const now = new Date();

    const [existingExchangeRows] = await queryInterface.sequelize.query(
      'SELECT id FROM exchanges WHERE name = :name LIMIT 1',
      {
        replacements: { name: 'Mobee' },
        transaction
      }
    );

    let exchangeId = existingExchangeRows[0]?.id;
    if (!exchangeId) {
      const [maxExchangeRows] = await queryInterface.sequelize.query(
        'SELECT COALESCE(MAX(id), 0) AS max_id FROM exchanges',
        { transaction }
      );
      exchangeId = Math.max(Number(maxExchangeRows[0]?.max_id || 0) + 1, 16);

      await queryInterface.bulkInsert('exchanges', [
        {
          id: exchangeId,
          name: 'Mobee',
          type: 'CEX',
          is_active: true,
          website_url: 'https://mobee.io',
          logo_url: 'https://mobee.io/favicon.ico',
          is_registered_indonesia: true,
          rating: 7.5,
          capital: 100000000.00,
          created_at: now,
          updated_at: now
        }
      ], { transaction });
    }

    const [apiAttributeRows] = await queryInterface.sequelize.query(
      `SELECT exchange_id
       FROM exchange_attributes
       WHERE exchange_id = :exchangeId AND attribute_key = 'api_url'
       LIMIT 1`,
      {
        replacements: { exchangeId },
        transaction
      }
    );

    if (!apiAttributeRows[0]) {
      await queryInterface.bulkInsert('exchange_attributes', [
        {
          exchange_id: exchangeId,
          attribute_key: 'api_url',
          attribute_value: 'https://open-api.mobee.io',
          data_type: 'string',
          created_at: now,
          updated_at: now
        }
      ], { transaction });
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

    const baseSymbols = [...new Set(mobeeIdrPairs.map((symbol) => symbol.split('_')[0]))];
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
      { exchange_id: exchangeId },
      { transaction }
    );

    const [maxPairRows] = await queryInterface.sequelize.query(
      'SELECT COALESCE(MAX(id), 0) AS max_id FROM token_pairs',
      { transaction }
    );
    let nextPairId = Number(maxPairRows[0]?.max_id || 0) + 1;

    const tokenPairs = mobeeIdrPairs.map((symbol) => {
      const [baseSymbol] = symbol.split('_');
      const baseToken = baseTokenBySymbol.get(baseSymbol);
      if (!baseToken) {
        throw new Error(`Missing token seed for Mobee pair ${symbol}`);
      }

      return {
        id: nextPairId++,
        exchange_id: exchangeId,
        base_token_id: baseToken.id,
        quote_token_id: idr.id,
        symbol,
        is_active: true,
        created_at: now,
        updated_at: now
      };
    });

    await queryInterface.bulkInsert('token_pairs', tokenPairs, { transaction });

    const [feeRows] = await queryInterface.sequelize.query(
      `SELECT exchange_id
       FROM fees
       WHERE exchange_id = :exchangeId AND fee_type = 'CEX_TRADE'
       LIMIT 1`,
      {
        replacements: { exchangeId },
        transaction
      }
    );

    if (!feeRows[0]) {
      await queryInterface.bulkInsert('fees', [
        {
          fee_type: 'CEX_TRADE',
          exchange_id: exchangeId,
          token_pair_id: null,
          token_id: null,
          chain_id: null,
          fee_percentage: 0.0010,
          fee_flat: null,
          fee_flat_token_id: null,
          is_active: true,
          created_at: now,
          updated_at: now
        }
      ], { transaction });
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    const [exchangeRows] = await queryInterface.sequelize.query(
      'SELECT id FROM exchanges WHERE name = :name LIMIT 1',
      {
        replacements: { name: 'Mobee' },
        transaction
      }
    );
    const mobee = exchangeRows[0];
    if (!mobee) return;

    await queryInterface.bulkDelete('fees', { exchange_id: mobee.id }, { transaction });
    await queryInterface.bulkDelete('token_pairs', { exchange_id: mobee.id }, { transaction });
    await queryInterface.bulkDelete('exchange_attributes', { exchange_id: mobee.id }, { transaction });
    await queryInterface.bulkDelete('exchanges', { id: mobee.id }, { transaction });
  });
}
