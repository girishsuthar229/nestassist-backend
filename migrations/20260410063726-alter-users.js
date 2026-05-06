'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'role_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'profile_image', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'cloudinary_id', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'role_id');
    await queryInterface.removeColumn('users', 'profile_image');
    await queryInterface.removeColumn('users', 'cloudinary_id');
    await queryInterface.removeColumn('users', 'last_login_at');
  }
};
