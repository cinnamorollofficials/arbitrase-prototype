export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('fees', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    fee_type: {
      type: Sequelize.ENUM('CEX_TRADE', 'DEX_POOL', 'WITHDRAWAL', 'DEPOSIT', 'NETWORK_GAS'),
      allowNull: false
    },
    exchange_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'exchanges',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    token_pair_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'token_pairs',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    token_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
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
    fee_percentage: {
      type: Sequelize.DECIMAL(5, 4),
      allowNull: true
    },
    fee_flat: {
      type: Sequelize.DECIMAL(18, 8),
      allowNull: true
    },
    fee_flat_token_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'tokens',
        key: 'id'
      },
      onDelete: 'SET NULL'
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('fees');
}
