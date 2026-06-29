export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('exchange_attributes', {
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  });

  await queryInterface.addIndex('exchange_attributes', ['exchange_id', 'attribute_key'], {
    unique: true,
    name: 'uq_exchange_attribute_key'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('exchange_attributes');
}
