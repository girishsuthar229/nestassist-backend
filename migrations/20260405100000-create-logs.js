'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('logs', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      event_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      category: {
        type: Sequelize.ENUM('PAYMENT', 'BOOKING', 'SERVICE', 'SERVICE_PROVIDER', 'CUSTOMER'),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      service_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      booking_id: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('INITIATED', 'SUCCESS', 'FAILED'),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Add indexes
    await queryInterface.addIndex('logs', ['event_type']);
    await queryInterface.addIndex('logs', ['category']);
    await queryInterface.addIndex('logs', ['user_id']);
    await queryInterface.addIndex('logs', ['created_at']);
    await queryInterface.addIndex('logs', ['booking_id']);
    await queryInterface.addIndex('logs', ['service_id']);
    await queryInterface.addIndex('logs', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('logs');
    // Drop the ENUM types if they are specifically created for this table
    // However, Sequelize doesn't automatically drop the enum types in some cases
    // So we might need to do it manually if necessary.
  },
};
