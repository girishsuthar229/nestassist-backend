'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.STRING(255)
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.bulkInsert('roles', [
      { name: 'SUPER_ADMIN', created_at: new Date(), updated_at: new Date() },
      { name: 'ADMIN', created_at: new Date(), updated_at: new Date() },
      { name: 'CUSTOMER', created_at: new Date(), updated_at: new Date() },
      { name: 'SERVICE_PARTNER', created_at: new Date(), updated_at: new Date() }
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('roles');
  }
};
