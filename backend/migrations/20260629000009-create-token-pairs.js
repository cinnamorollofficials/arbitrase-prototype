export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('token_pairs', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    exchange_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'exchanges',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    base_token_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'tokens',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    quote_token_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'tokens',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    symbol: {
      type: Sequelize.STRING(50),
      allowNull: false
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
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

  await queryInterface.addIndex('token_pairs', ['exchange_id', 'base_token_id', 'quote_token_id'], {
    unique: true,
    name: 'uq_exchange_token_pair'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('token_pairs');
}
