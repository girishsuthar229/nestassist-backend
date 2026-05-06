'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async t => {
      // 1. Expand: Add a temporary column
      await queryInterface.addColumn('service_partners', 'service_type_ids_temp', {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true
      }, { transaction: t });

      // 2. Migrate Data: Copy from existing column to array column
      await queryInterface.sequelize.query(
        'UPDATE service_partners SET service_type_ids_temp = ARRAY[service_type_id]::INTEGER[];',
        { transaction: t }
      );

      // 3. Contract: Drop the old single ID column
      await queryInterface.removeColumn('service_partners', 'service_type_id', { transaction: t });

      // 4. Rename new column to original column name
      await queryInterface.renameColumn('service_partners', 'service_type_ids_temp', 'service_type_id', { transaction: t });

      // 5. Enforce Constraints: ensure NOT NULL
      await queryInterface.changeColumn('service_partners', 'service_type_id', {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false
      }, { transaction: t });
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async t => {
      // 1. Expand: Add a temporary integer column
      await queryInterface.addColumn('service_partners', 'service_type_id_temp', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction: t });

      // 2. Migrate Data: Take the first item from the array
      await queryInterface.sequelize.query(
        'UPDATE service_partners SET service_type_id_temp = service_type_id[1];',
        { transaction: t }
      );

      // 3. Contract: Drop the array column
      await queryInterface.removeColumn('service_partners', 'service_type_id', { transaction: t });

      // 4. Rename back to original name
      await queryInterface.renameColumn('service_partners', 'service_type_id_temp', 'service_type_id', { transaction: t });

      // 5. Enforce Constraints: ensure NOT NULL
      await queryInterface.changeColumn('service_partners', 'service_type_id', {
        type: Sequelize.INTEGER,
        allowNull: false
      }, { transaction: t });
    });
  }
};
