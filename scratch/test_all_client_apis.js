import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import prisma from '../src/config/db.js';

async function run() {
  console.log("=== SIMULATING BUSINESS CLIENT APIS ===");
  const email = 'business00@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true }
  });

  if (!user) {
    console.error(`User ${email} not found!`);
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.name, tenantId: user.tenantId },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const endpoints = [
    '/auth/profile',
    '/users?page=1&limit=100',
    '/orders?page=1&limit=10',
    '/purchase-requests?page=1&limit=10',
    '/clients?page=1&limit=10'
  ];

  for (const ep of endpoints) {
    try {
      const start = Date.now();
      const res = await fetch(`http://127.0.0.1:8000/api/v1${ep}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const duration = Date.now() - start;
      const data = await res.json();
      console.log(`Endpoint: ${ep} | Status: ${res.status} | Time: ${duration}ms | Data Success: ${data.success}`);
      if (!data.success) {
        console.error("Error data:", data);
      }
    } catch (err) {
      console.error(`Endpoint ${ep} failed:`, err.message);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
