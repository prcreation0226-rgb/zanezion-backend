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

  const res1 = await fetch('http://localhost:8000/api/v1/support/guest-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      client_id: 1,
      guest: "Test Guest",
      requested_by: "Test Requester",
      request_details: "Need extra towels",
      delivery_time: "2026-06-10 14:00:00",
      priority: "high",
      status: "pending"
    })
  });
  console.log('CREATE:', res1.status, await res1.text());

  const res2 = await fetch('http://localhost:8000/api/v1/support/guest-requests', {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('FETCH:', res2.status, await res2.text());

  process.exit(0);
})();
