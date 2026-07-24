import prisma from '../src/config/db.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

async function generateAdminToken() {
  try {
    const superAdmin = await prisma.user.findFirst({
      where: { role: { name: 'SUPER_ADMIN' } },
      include: { role: true }
    });

    if (!superAdmin) {
      console.log('No Super Admin found');
      return;
    }

    console.log('Super Admin User:', superAdmin.email, 'Role:', superAdmin.role.name);

    const token = jwt.sign(
      { id: superAdmin.id, email: superAdmin.email, roleId: superAdmin.roleId, tenantId: superAdmin.tenantId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    console.log('Generated JWT Token:', token);

    // Test API call using axios locally or to railway with this token
    import('axios').then(async ({ default: axios }) => {
      try {
        const res = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('API Response Status:', res.status);
        const data = res.data.data;
        const clients = data.clients || data;
        console.log('Total Returned:', data.total || clients.length);
        console.log(JSON.stringify(clients.map((c, i) => ({
          index: i + 1,
          name: c.companyName,
          email: c.email,
          clientType: c.clientType,
          source: c.source
        })), null, 2));
      } catch (e) {
        console.error('Axios Error:', e.response?.data || e.message);
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

generateAdminToken();
