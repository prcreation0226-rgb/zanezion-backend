import prisma from '../src/config/db.js';

async function test() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  console.log("=== USERS IN SYSTEM ===");
  users.forEach(u => {
    console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | TenantId: ${u.tenantId} | Role: ${u.role?.name}`);
  });
}

test().catch(console.error).finally(() => prisma.$disconnect());
