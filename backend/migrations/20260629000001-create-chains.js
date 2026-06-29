export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('chains', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true
    },
    chain_identifier: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true
    },
    native_symbol: {
      type: Sequelize.STRING(20),
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
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
    }
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('chains');
}
