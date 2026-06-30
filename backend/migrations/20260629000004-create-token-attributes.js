export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('token_attributes', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    token_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'tokens',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    chain_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'chains',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    attribute_key: {
      type: Sequelize.STRING(100),
      allowNull: false
    },
    attribute_value: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    data_type: {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'string'
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX uq_token_global_attribute_key
    ON token_attributes (token_id, attribute_key)
    WHERE chain_id IS NULL;
  `);

  await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX uq_token_chain_attribute_key
    ON token_attributes (token_id, chain_id, attribute_key)
    WHERE chain_id IS NOT NULL;
  `);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('token_attributes');
}
