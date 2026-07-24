import prisma from '../src/config/db.js';

async function checkRolesTable() {
  try {
    const roles = await prisma.role.findMany();
    console.log('ROLES TABLE IN DB:');
    console.log(JSON.stringify(roles, null, 2));

    const superAdminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: { contains: 'admin', mode: 'insensitive' }
        }
      },
      include: { role: true }
    });

    console.log('ADMIN USERS IN DB:');
    console.log(JSON.stringify(superAdminUsers.map(u => ({
      id: u.id,
      email: u.email,
      roleId: u.roleId,
      roleName: u.role?.name,
      tenantId: u.tenantId
    })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkRolesTable();
