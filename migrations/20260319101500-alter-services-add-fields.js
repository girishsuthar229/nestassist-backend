'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('services', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    // Backfill categoryId for existing rows (if any) using subCategoryId -> sub_categories.categoryId
    await queryInterface.sequelize.query(
      `UPDATE services s
       SET "category_id" = sc."category_id"
       FROM sub_categories sc
       WHERE s."sub_category_id" = sc.id AND s."category_id" IS NULL;`
    );

    await queryInterface.changeColumn('services', 'category_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });

    await queryInterface.addColumn('services', 'images', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: Sequelize.literal('ARRAY[]::TEXT[]')
    });

    await queryInterface.addColumn('services', 'cloudinary_ids', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: Sequelize.literal('ARRAY[]::TEXT[]')
    });

    await queryInterface.addColumn('services', 'include_services', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: Sequelize.literal('ARRAY[]::TEXT[]')
    });

    await queryInterface.addColumn('services', 'exclude_services', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: Sequelize.literal('ARRAY[]::TEXT[]')
    });

    await queryInterface.addIndex('services', ['category_id']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('services', ['category_id']);
    await queryInterface.removeColumn('services', 'exclude_services');
    await queryInterface.removeColumn('services', 'include_services');
    await queryInterface.removeColumn('services', 'cloudinary_ids');
    await queryInterface.removeColumn('services', 'images');
    await queryInterface.removeColumn('services', 'category_id');
  }
};
