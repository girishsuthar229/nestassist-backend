"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("payments", "service_partner_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });

    await queryInterface.addIndex("payments", ["service_partner_id"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("payments", ["service_partner_id"]);
    await queryInterface.removeColumn("payments", "service_partner_id");
  },
};
