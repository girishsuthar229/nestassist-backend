"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      const tableInfo = await queryInterface.describeTable("bookings");
      if (!tableInfo.expires_at) {
        await queryInterface.addColumn("bookings", "expires_at", {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction: t });
      }

      await queryInterface.addIndex("bookings", ["status"], {
        name: "bookings_status_idx",
        transaction: t
      });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.removeIndex("bookings", "bookings_status_idx", { transaction: t });
      await queryInterface.removeColumn("bookings", "expires_at", { transaction: t });
    });
  },
};
