'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('configurations', [
      {
        name: 'Taxes',
        configKey: 'taxes',
        value: '5',
        valueType: 'number',
        description: 'Taxes percentage',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('configurations', null, {});
  }
};
