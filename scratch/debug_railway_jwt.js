import axios from 'axios';
import jwt from 'jsonwebtoken';
import prisma from '../src/config/db.js';

async function debugRailwayJwt() {
  try {
    const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
      email: 'superadmin@zanezion.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token;
    const decoded = jwt.decode(token);
    console.log('Decoded Token Payload:', decoded);

    const userInDb = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      include: { role: true }
    });

    console.log('User fetched by auth.middleware:', {
      id: userInDb?.id,
      email: userInDb?.email,
      tenantId: userInDb?.tenantId,
      role: userInDb?.role
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

debugRailwayJwt();
