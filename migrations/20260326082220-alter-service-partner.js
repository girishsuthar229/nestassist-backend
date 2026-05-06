'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.addColumn('service_partners', 'verification_status', {
        type: Sequelize.ENUM('Pending', 'Verified', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
      }, { transaction: t });

      await queryInterface.addColumn('service_partners', 'status', {
        type: Sequelize.ENUM('Active', 'Inactive', 'Suspended'),
        allowNull: false,
        defaultValue: 'Inactive'
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async t => {
      await queryInterface.removeColumn('service_partners', 'verification_status', { transaction: t });
      await queryInterface.removeColumn('service_partners', 'status', { transaction: t });
    });
  }
};
