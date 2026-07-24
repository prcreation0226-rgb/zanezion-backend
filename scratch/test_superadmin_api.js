import prisma from '../src/config/db.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import axios from 'axios';

async function testSuperAdminApi() {
  try {
    const superAdmin = await prisma.user.findFirst({
      where: { id: 74 }
    });

    console.log('Using Super Admin:', superAdmin.email, 'ID:', superAdmin.id);

    const token = jwt.sign(
      { id: superAdmin.id, email: superAdmin.email, roleId: superAdmin.roleId, tenantId: superAdmin.tenantId },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const res = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Railway API Status:', res.status);
    const data = res.data.data;
    const clients = data.clients || data;
    console.log('Total Returned:', data.total || clients.length);
    console.log('Clients List on Railway:');
    console.log(JSON.stringify(clients.map((c, i) => ({
      index: i + 1,
      id: c.id,
      name: c.companyName,
      email: c.email,
      clientType: c.clientType,
      source: c.source,
      createdAt: c.createdAt
    })), null, 2));

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSuperAdminApi();
