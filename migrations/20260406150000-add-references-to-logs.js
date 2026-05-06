'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Alter userId to match users.id type (INTEGER) and add foreign key
      await queryInterface.changeColumn(
        'logs',
        'user_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );

      // 2. Alter serviceId to match services.id type (INTEGER) and add foreign key
      await queryInterface.changeColumn(
        'logs',
        'service_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'services',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );

      // 3. Alter bookingId to match bookings.id type (INTEGER) and add foreign key
      await queryInterface.changeColumn(
        'logs',
        'booking_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'bookings',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Revert column types back to BIGINT and remove references
      await queryInterface.changeColumn(
        'logs',
        'user_id',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'logs',
        'service_id',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'logs',
        'booking_id',
        {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        { transaction }
      );
    });
  },
};
