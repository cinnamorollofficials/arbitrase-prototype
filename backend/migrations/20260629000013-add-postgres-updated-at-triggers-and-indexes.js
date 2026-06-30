const timestampedTables = [
  'chains',
  'chain_attributes',
  'tokens',
  'token_attributes',
  'exchanges',
  'exchange_attributes',
  'wallets',
  'token_pairs',
  'fees'
];

const indexes = [
  ['idx_chain_attributes_chain_id', 'chain_attributes', 'chain_id'],
  ['idx_token_attributes_token_id', 'token_attributes', 'token_id'],
  ['idx_token_attributes_chain_id', 'token_attributes', 'chain_id'],
  ['idx_exchange_attributes_exchange_id', 'exchange_attributes', 'exchange_id'],
  ['idx_wallets_chain_id', 'wallets', 'chain_id'],
  ['idx_token_pairs_exchange_id', 'token_pairs', 'exchange_id'],
  ['idx_token_pairs_base_token_id', 'token_pairs', 'base_token_id'],
  ['idx_token_pairs_quote_token_id', 'token_pairs', 'quote_token_id'],
  ['idx_fees_exchange_id', 'fees', 'exchange_id'],
  ['idx_fees_token_pair_id', 'fees', 'token_pair_id'],
  ['idx_fees_token_id', 'fees', 'token_id'],
  ['idx_fees_chain_id', 'fees', 'chain_id'],
  ['idx_fees_fee_flat_token_id', 'fees', 'fee_flat_token_id']
];

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  for (const tableName of timestampedTables) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS set_${tableName}_updated_at ON ${tableName};
      CREATE TRIGGER set_${tableName}_updated_at
      BEFORE UPDATE ON ${tableName}
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
  }

  for (const [indexName, tableName, columnName] of indexes) {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS ${indexName}
      ON ${tableName} (${columnName});
    `);
  }
}

export async function down(queryInterface, Sequelize) {
  for (const [indexName] of indexes) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS ${indexName};`);
  }

  for (const tableName of timestampedTables) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS set_${tableName}_updated_at ON ${tableName};
    `);
  }

  await queryInterface.sequelize.query('DROP FUNCTION IF EXISTS set_updated_at();');
}
