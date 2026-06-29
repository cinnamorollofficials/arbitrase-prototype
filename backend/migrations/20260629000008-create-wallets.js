export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('wallets', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    chain_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'chains',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    address: {
      type: Sequelize.STRING(150),
      allowNull: false
    },
    private_key_encrypted: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: true
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

  await queryInterface.addIndex('wallets', ['chain_id', 'address'], {
    unique: true,
    name: 'uq_wallet_chain_address'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('wallets');
}
