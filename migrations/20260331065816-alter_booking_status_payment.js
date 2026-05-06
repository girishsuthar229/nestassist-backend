'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Add the "COMPLETED" value to the ENUM name used in the "payments" table
      // We use raw SQL because Sequelize doesn't handle adding values to existing ENUM types well in Postgres
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_payments_booking_status" ADD VALUE IF NOT EXISTS 'COMPLETED';`,
        { transaction }
      );

      // 2. Ensuring the column definition matches the model including the new value
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
      // Reverting an ENUM value in Postgres is complex (requires renaming existing type, creating new one, and updating table)
      await queryInterface.sequelize.query(
        `
        ALTER TYPE "enum_payments_booking_status" RENAME TO "enum_payments_booking_status_old";
        CREATE TYPE "enum_payments_booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
        ALTER TABLE "payments"
          ALTER COLUMN "booking_status" DROP DEFAULT,
          ALTER COLUMN "booking_status" TYPE "enum_payments_booking_status" 
            USING (
              CASE 
                WHEN "booking_status"::text = 'COMPLETED' THEN 'CONFIRMED'::"enum_payments_booking_status"
                ELSE "booking_status"::text::"enum_payments_booking_status"
              END
            ),
          ALTER COLUMN "booking_status" SET DEFAULT 'PENDING';
        DROP TYPE "enum_payments_booking_status_old";
        `,
        { transaction }
      );
    });
  },
};
