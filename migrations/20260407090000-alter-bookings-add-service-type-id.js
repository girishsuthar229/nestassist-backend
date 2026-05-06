'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'bookings',
        'service_type_id',
        {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'service_types',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        { transaction },
      );

      await queryInterface.addIndex('bookings', ['service_type_id'], {
        transaction,
      });

      // Backfill existing bookings where possible:
      // bookings -> services -> sub_categories -> categories -> service_types
      await queryInterface.sequelize.query(
        `
        UPDATE bookings b
        SET service_type_id = st.id
        FROM services s
        JOIN sub_categories sc ON sc.id = s.sub_category_id
        JOIN categories c ON c.id = sc.category_id
        JOIN service_types st ON st.id = c.service_type_id
        WHERE b.service_id = s.id
          AND b.service_type_id IS NULL
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('bookings', ['service_type_id'], {
        transaction,
      });
      await queryInterface.removeColumn('bookings', 'service_type_id', {
        transaction,
      });
    });
  },
};

