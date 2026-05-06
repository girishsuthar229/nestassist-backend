'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'bookings',
        'address_id',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
          references: {
            model: 'addresses',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );

      await queryInterface.addIndex('bookings', ['address_id'], { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('bookings', ['address_id'], { transaction });
      await queryInterface.removeColumn('bookings', 'address_id', { transaction });
    });
  },
};
