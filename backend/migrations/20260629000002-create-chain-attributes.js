export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('chain_attributes', {
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

  await queryInterface.addIndex('chain_attributes', ['chain_id', 'attribute_key'], {
    unique: true,
    name: 'uq_chain_attribute_key'
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('chain_attributes');
}
