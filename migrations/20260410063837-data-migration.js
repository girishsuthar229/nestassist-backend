'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * 🔥 IMPORTANT ASSUMPTION:
     * roles table MUST already be seeded before running this migration
     */

    /**
     * 1. MAP EXISTING USER ROLES → role_id (SAFE JOIN VERSION)
     */

    // USER / CUSTOMER
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET role_id = r.id
      FROM roles r
      WHERE r.name = 'CUSTOMER'
        AND u.role IN ('User', 'customer');
    `);

    // SERVICE_PARTNER
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET role_id = r.id
      FROM roles r
      WHERE r.name = 'SERVICE_PARTNER'
        AND u.role IN ('ServicePartner', 'servicePartner');
    `);

    // ADMIN
    // await queryInterface.sequelize.query(`
    //   UPDATE users u
    //   SET role_id = r.id
    //   FROM roles r
    //   WHERE r.name = 'ADMIN'
    //     AND u.role = 'Admin';
    // `);

    /**
     * 2. MIGRATE ADMINS → USERS (NO DUPLICATES + SAFE ROLE JOIN)
     */
    await queryInterface.sequelize.query(`
      INSERT INTO users (
        name,
        email,
        password,
        profile_image,
        country_code,
        mobile_number,
        is_active,
        last_login_at,
        role_id,
        created_at,
        updated_at
      )
      SELECT 
        a.name,
        a.email,
        a.password,
        a.profile_image,
        a.country_code,
        a.mobile,
        a.is_active,
        a.last_login_at,
        r.id,
        a.created_at,
        a.updated_at
      FROM admins a
      LEFT JOIN roles r 
        ON r.name = CASE 
          WHEN a.is_super_admin THEN 'SUPER_ADMIN'
          ELSE 'ADMIN'
        END
      WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.email = a.email
      );
    `);

    /**
     * 3. SYNC SERVICE PARTNER DATA INTO USERS
     */
    await queryInterface.sequelize.query(`
      UPDATE users u
      SET
        profile_image = sp.profile_image,
        cloudinary_id = sp.cloudinary_id,
        mobile_number = sp.mobile_number
      FROM service_partners sp
      WHERE u.id = sp.user_id;
    `);

    /**
     * 4. SAFETY CHECK (OPTIONAL DEBUG STEP)
     * You can remove this in production
     */
    // await queryInterface.sequelize.query(`
    //   SELECT COUNT(*) FROM users WHERE role_id IS NULL;
    // `);
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * ⚠️ SAFE PARTIAL ROLLBACK ONLY
     * Full rollback of data migrations is NOT safe in real systems
     */

    // Remove only migrated admin users
    await queryInterface.sequelize.query(`
      DELETE FROM users
      WHERE email IN (SELECT email FROM admins);
    `);

    // DO NOT reset role_id globally (was causing your NULL issue earlier)
  }
};