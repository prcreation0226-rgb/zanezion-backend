import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import prisma from '../src/config/db.js';

async function test() {
  const user = await prisma.user.findUnique({
    where: { email: 'business00@gmail.com' },
    include: { role: true }
  });

  if (!user) {
    console.error("User business00@gmail.com not found!");
    return;
  }

  console.log("Found user:", user.name, "Role:", user.role.name, "TenantId:", user.tenantId);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.name, tenantId: user.tenantId },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  console.log("Signed JWT token.");

  // Query /warehouses
  console.log("Fetching /warehouses via local HTTP request...");
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/warehouses', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Warehouses Response status:", res.status);
    console.log("Warehouses list returned:", JSON.stringify(data.data || data, null, 2));
  } catch (err) {
    console.error("Error fetching /warehouses:", err.message);
  }

  // Query /items
  console.log("Fetching /items via local HTTP request...");
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/items', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Items Response status:", res.status);
    console.log("Items count returned:", data.data?.items?.length ?? data.data?.length ?? data.length);
  } catch (err) {
    console.error("Error fetching /items:", err.message);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
