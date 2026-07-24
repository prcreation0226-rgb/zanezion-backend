import prisma from './src/config/db.js';

async function check() {
  const user = await prisma.user.findFirst({
    where: { email: 'superadmin@zanezion.com' },
    include: { role: true }
  });
  console.log('User RoleId:', user.roleId);
  console.log('User RoleName:', user.role.name);

  const roleMenus = await prisma.roleMenu.findMany({
    where: { roleId: user.roleId },
    include: { menu: true }
  });
  console.log('RoleMenus count for this roleId:', roleMenus.length);
}

check().finally(() => prisma.$disconnect());
