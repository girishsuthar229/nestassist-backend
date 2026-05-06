'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     */
    
    // 1. Remove unique constraint from coupon_code column
    // In PostgreSQL, removing unique: true from changeColumn works, but it's safer to use removeConstraint if we know the name,
    // or simply changeColumn with unique: false.
    await queryInterface.changeColumn('offers', 'coupon_code', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: false, // This should remove the unique constraint in many dialects
    });

    // 2. Add new columns
    await queryInterface.addColumn('offers', 'max_usage', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn('offers', 'used_count', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });

    await queryInterface.addColumn('offers', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 3. Change default value for discount_percentage
    await queryInterface.changeColumn('offers', 'discount_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    });

    // 4. Add indexes
    await queryInterface.addIndex('offers', ['coupon_code'], {
      name: 'offers_coupon_code_unique_active',
      unique: true,
      where: {
        deleted_at: null,
      },
    });

    await queryInterface.addIndex('offers', ['coupon_code', 'is_active'], {
      name: 'offers_coupon_code_is_active',
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     */
    
    // 1. Remove indexes
    await queryInterface.removeIndex('offers', 'offers_coupon_code_unique_active');
    await queryInterface.removeIndex('offers', 'offers_coupon_code_is_active');

    // 2. Remove columns
    await queryInterface.removeColumn('offers', 'max_usage');
    await queryInterface.removeColumn('offers', 'used_count');
    await queryInterface.removeColumn('offers', 'deleted_at');

    // 3. Revert discount_percentage
    await queryInterface.changeColumn('offers', 'discount_percentage', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
    });

    // 4. Revert coupon_code to unique: true
    await queryInterface.changeColumn('offers', 'coupon_code', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });
  }
};
