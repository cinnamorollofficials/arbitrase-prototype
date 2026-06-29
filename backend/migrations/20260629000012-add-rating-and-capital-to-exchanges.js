export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('exchanges', 'rating', {
    type: Sequelize.DECIMAL(3, 1),
    allowNull: true
  });
  await queryInterface.addColumn('exchanges', 'capital', {
    type: Sequelize.DECIMAL(20, 2),
    allowNull: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn('exchanges', 'rating');
  await queryInterface.removeColumn('exchanges', 'capital');
}
