"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE payments
      ALTER COLUMN slot TYPE JSONB
      USING jsonb_build_object(
        'date',
        to_char(slot::timestamptz, 'YYYY-MM-DD'),
        'time',
        to_char(slot::timestamptz, 'HH12:MI AM')
      );
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE payments
      ALTER COLUMN slot TYPE TIMESTAMPTZ
      USING to_timestamp(
        (slot->>'date') || ' ' || COALESCE(NULLIF(slot->>'time', ''), '12:00 AM'),
        'YYYY-MM-DD HH12:MI AM'
      );
    `);
  },
};
