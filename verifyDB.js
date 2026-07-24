import prisma from './src/config/db.js';

async function checkHealth() {
  const tenants = await prisma.tenant.count();
  const users = await prisma.user.findMany({
    include: { role: true, tenant: true }
  });
  const roles = await prisma.role.findMany({
    include: { roleMenus: { include: { menu: true } }, rolePermissions: { include: { permission: true } } }
  });
  const menus = await prisma.menu.findMany();
  
  console.log(`Tenants: ${tenants}`);
  console.log(`Users: ${users.length}`);
  console.log(`Roles: ${roles.length}`);
  console.log(`Menus: ${menus.length}`);
  
  for (const r of roles) {
    console.log(`\nRole: ${r.name}`);
    console.log(` - Menus: ${r.roleMenus.map(rm => rm.menu.name).join(', ')}`);
    console.log(` - Users assigned: ${users.filter(u => u.roleId === r.id).map(u => u.email).join(', ')}`);
  }
}

checkHealth().catch(console.error).finally(() => prisma.$disconnect());
