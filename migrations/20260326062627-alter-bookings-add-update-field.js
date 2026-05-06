'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('bookings', 'userId', 'user_id');
    await queryInterface.renameColumn('bookings', 'bookingDate', 'booking_date');
    await queryInterface.renameColumn('bookings', 'createdAt', 'created_at');
    await queryInterface.renameColumn('bookings', 'updatedAt', 'updated_at');

    await queryInterface.addColumn('bookings', 'service_duration', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('bookings', 'service_address', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('bookings', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('bookings', 'receipt_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('bookings', 'service_partner_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'service_partners',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('bookings', ['service_partner_id']);
  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeIndex('bookings', ['service_partner_id']);

    await queryInterface.removeColumn('bookings', 'service_partner_id');
    await queryInterface.removeColumn('bookings', 'service_duration');
    await queryInterface.removeColumn('bookings', 'service_address');
    await queryInterface.removeColumn('bookings', 'amount');
    await queryInterface.removeColumn('bookings', 'receipt_url');

    await queryInterface.renameColumn('bookings', 'user_id', 'userId');
    await queryInterface.renameColumn('bookings', 'booking_date', 'bookingDate');
    await queryInterface.renameColumn('bookings', 'created_at', 'createdAt');
    await queryInterface.renameColumn('bookings', 'updated_at', 'updatedAt');
  },
};