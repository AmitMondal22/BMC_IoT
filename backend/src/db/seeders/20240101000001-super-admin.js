'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface) => {
    // 1. Check if Default Organization already exists
    const [existingOrgs] = await queryInterface.sequelize.query(
      `SELECT id FROM organizations WHERE code = 'DEFAULT' LIMIT 1;`
    );
    
    let orgId;
    const now = new Date();

    if (existingOrgs && existingOrgs.length > 0) {
      orgId = existingOrgs[0].id;
    } else {
      orgId = uuidv4();
      await queryInterface.bulkInsert('organizations', [{
        id: orgId,
        name: 'Default Organization',
        code: 'DEFAULT',
        address: 'Default Address',
        contact_email: 'admin@bmcplatform.com',
        contact_phone: '+919999999999',
        status: 'active',
        created_at: now,
        updated_at: now,
      }]);
    }

    // 2. Check if Super Admin already exists to prevent duplicate key violations
    const [existingUsers] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'admin@bmcplatform.com' LIMIT 1;`
    );

    if (!existingUsers || existingUsers.length === 0) {
      const hashedPassword = await bcrypt.hash('Admin@123456', 12);
      
      await queryInterface.bulkInsert('users', [
        {
          id: uuidv4(),
          name: 'Super Admin',
          email: 'admin@bmcplatform.com',
          password: hashedPassword,
          phone: '+919999999999',
          role: 'super_admin',
          organization_id: orgId,
          status: 'active',
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          name: 'Org Admin',
          email: 'orgadmin@bmcplatform.com',
          password: hashedPassword,
          phone: '+918888888888',
          role: 'admin',
          organization_id: orgId,
          status: 'active',
          created_at: now,
          updated_at: now,
        },
        {
          id: uuidv4(),
          name: 'Regular User',
          email: 'user@bmcplatform.com',
          password: hashedPassword,
          phone: '+917777777777',
          role: 'user',
          organization_id: orgId,
          status: 'active',
          created_at: now,
          updated_at: now,
        }
      ]);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('users', { email: 'admin@bmcplatform.com' });
    await queryInterface.bulkDelete('users', { email: 'orgadmin@bmcplatform.com' });
    await queryInterface.bulkDelete('users', { email: 'user@bmcplatform.com' });
    await queryInterface.bulkDelete('organizations', { code: 'DEFAULT' });
  },
};
