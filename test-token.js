import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findUnique({ where: { id: 7 } });
  const token = jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId },
    process.env.JWT_SECRET || 'ZANEZION_SECURE_TOKEN_SECRET_9921',
    { expiresIn: '24h' }
  );

  const res1 = await fetch('http://localhost:8000/api/v1/logistics/urgent', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('URGENT:', res1.status, await res1.text());

  const res2 = await fetch('http://localhost:8000/api/v1/logistics/tracking', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('TRACKING:', res2.status, await res2.text());

  const res3 = await fetch('http://localhost:8000/api/v1/logistics/routes', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('ROUTES:', res3.status, await res3.text());

  process.exit(0);
})();
