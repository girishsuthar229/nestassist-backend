"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_payments_booking_status" ADD VALUE IF NOT EXISTS 'COMPLETED';`,
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "discount",
        {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "currency",
        {
          type: Sequelize.STRING(10),
          allowNull: false,
          defaultValue: "INR",
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "coupon_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "payment_status",
        {
          type: Sequelize.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"),
          allowNull: false,
          defaultValue: "PENDING",
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "booking_status",
        {
          type: Sequelize.ENUM("PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"),
          allowNull: false,
          defaultValue: "PENDING",
        },
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        "payments",
        "payment_status",
        {
          type: Sequelize.ENUM("PENDING", "PAID", "FAILED", "REFUNDED"),
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "discount",
        {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "currency",
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        "payments",
        "coupon_id",
        {
          type: Sequelize.BIGINT,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `
        ALTER TYPE "enum_payments_booking_status" RENAME TO "enum_payments_booking_status_old";
        CREATE TYPE "enum_payments_booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
        ALTER TABLE "payments"
        ALTER COLUMN "booking_status"
        DROP DEFAULT,
        ALTER COLUMN "booking_status"
        TYPE "enum_payments_booking_status"
        USING (
          CASE
            WHEN "booking_status"::text = 'COMPLETED' THEN 'CONFIRMED'
            ELSE "booking_status"::text
          END
        )::"enum_payments_booking_status";
        DROP TYPE "enum_payments_booking_status_old";
        `,
        { transaction }
      );
    });
  },
};
