'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Drop redundant columns from service_partners
    await queryInterface.removeColumn('service_partners', 'mobile_number');
    await queryInterface.removeColumn('service_partners', 'profile_image');
    await queryInterface.removeColumn('service_partners', 'cloudinary_id');

    // 2. Drop admins table
    await queryInterface.dropTable('admins');

    // 3. Drop obsolete role ENUM from users
    await queryInterface.removeColumn('users', 'role');
  },

  down: async (queryInterface, Sequelize) => {
    // Re-add role column to users
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'customer'
    });

    // Re-create admins table
    await queryInterface.createTable('admins', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      name: { type: Sequelize.STRING(150), allowNull: false },
      profile_image: { type: Sequelize.STRING(255), allowNull: true },
      email: { type: Sequelize.STRING(150), allowNull: false, unique: true },
      country_code: { type: Sequelize.STRING(10), allowNull: true },
      mobile: { type: Sequelize.STRING(20), allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      password: { type: Sequelize.STRING, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      is_super_admin: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });

    // Re-add redundant columns to service_partners
    await queryInterface.addColumn('service_partners', 'mobile_number', {
      type: Sequelize.STRING(20),
      allowNull: true // changed to true for reverse safety
    });
    await queryInterface.addColumn('service_partners', 'profile_image', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('service_partners', 'cloudinary_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
