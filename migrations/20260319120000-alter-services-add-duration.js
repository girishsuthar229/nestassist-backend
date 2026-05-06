'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('services', 'duration', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addIndex('services', ['duration']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('services', ['duration']);
    await queryInterface.removeColumn('services', 'duration');
  }
};

