"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "bookings",
        "payment_id",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "payments",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "SET NULL",
        },
        { transaction }
      );

      await queryInterface.addIndex("bookings", ["payment_id"], { transaction });

      await queryInterface.addColumn(
        "payments",
        "stripe_session_id",
        {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_payments_payment_status" ADD VALUE IF NOT EXISTS 'REFUNDED';`,
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex("bookings", ["payment_id"], { transaction });
      await queryInterface.removeColumn("bookings", "payment_id", { transaction });
      await queryInterface.removeColumn("payments", "stripe_session_id", { transaction });

      await queryInterface.sequelize.query(
        `
        ALTER TYPE "enum_payments_payment_status" RENAME TO "enum_payments_payment_status_old";
        CREATE TYPE "enum_payments_payment_status" AS ENUM ('PENDING', 'PAID', 'FAILED');
        ALTER TABLE "payments"
        ALTER COLUMN "payment_status"
        TYPE "enum_payments_payment_status"
        USING (
          CASE
            WHEN "payment_status"::text = 'REFUNDED' THEN 'FAILED'
            ELSE "payment_status"::text
          END
        )::"enum_payments_payment_status";
        DROP TYPE "enum_payments_payment_status_old";
        `,
        { transaction }
      );
    });
  },
};
