import prisma from '../src/config/db.js';

async function checkUserRoles() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    });
    console.log('Total Users:', users.length);
    console.log(JSON.stringify(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleName: u.role?.name,
      tenantId: u.tenantId
    })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();
