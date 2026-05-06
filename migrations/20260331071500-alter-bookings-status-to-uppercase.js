'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Rename the existing lowercase enum type
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_bookings_status" RENAME TO "enum_bookings_status_old"',
        { transaction }
      );

      // 2. Create the new uppercase enum type
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_bookings_status\" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')",
        { transaction }
      );

      // 3. Update the column to use the new type, converting existing values to uppercase
      await queryInterface.sequelize.query(
        `ALTER TABLE "bookings" 
         ALTER COLUMN "status" DROP DEFAULT,
         ALTER COLUMN "status" TYPE "enum_bookings_status" 
         USING (UPPER("status"::text))::"enum_bookings_status",
         ALTER COLUMN "status" SET DEFAULT 'PENDING'`,
        { transaction }
      );

      // 4. Drop the old enum type
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_bookings_status_old"',
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // 1. Rename the uppercase enum type
      await queryInterface.sequelize.query(
        'ALTER TYPE "enum_bookings_status" RENAME TO "enum_bookings_status_new"',
        { transaction }
      );

      // 2. Recreate the lowercase enum type
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_bookings_status\" AS ENUM ('pending', 'confirmed', 'cancelled', 'completed')",
        { transaction }
      );

      // 3. Update the column back to lowercase
      await queryInterface.sequelize.query(
        `ALTER TABLE "bookings" 
         ALTER COLUMN "status" DROP DEFAULT,
         ALTER COLUMN "status" TYPE "enum_bookings_status" 
         USING (LOWER("status"::text))::"enum_bookings_status",
         ALTER COLUMN "status" SET DEFAULT 'pending'`,
        { transaction }
      );

      // 4. Drop the new (uppercase) enum type
      await queryInterface.sequelize.query(
        'DROP TYPE "enum_bookings_status_new"',
        { transaction }
      );
    });
  }
};
