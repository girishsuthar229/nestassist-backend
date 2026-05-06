'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('services', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Get the first Super Admin or Admin user ID
    const [adminUser] = await queryInterface.sequelize.query(`
      SELECT u.id 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('SUPER_ADMIN', 'ADMIN')
      ORDER BY r.name DESC, u.id ASC
      LIMIT 1;
    `);

    if (adminUser && adminUser.length > 0) {
      const adminId = adminUser[0].id;
      // Update existing services with this admin ID
      await queryInterface.sequelize.query(`
        UPDATE services SET created_by = ${adminId} WHERE created_by IS NULL;
      `);
    }

    // After setting defaults, we could make it NOT NULL if desired, 
    // but the requirement didn't specify that. 
    // Usually it's better to keep it nullable if we want SET NULL on delete.
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('services', 'created_by');
  }
};
