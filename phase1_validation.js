import prisma from './src/config/db.js';

async function run() {
  console.log('=== A. Personnel Menu Access ===');
  const personnelMenu = await prisma.menu.findFirst({ where: { name: 'Personnel' } });
  if (personnelMenu) {
    const rolesWithPersonnel = await prisma.roleMenu.findMany({
      where: { menuId: personnelMenu.id, can_view: true },
      include: { role: true }
    });
    rolesWithPersonnel.forEach(rm => console.log(`Role: ${rm.role.name}`));
  } else {
    console.log('Personnel menu not found.');
  }

  console.log('\n=== B. Security Menu Access ===');
  const securityMenu = await prisma.menu.findFirst({ where: { name: 'Security' } });
  if (securityMenu) {
    const rolesWithSecurity = await prisma.roleMenu.findMany({
      where: { menuId: securityMenu.id, can_view: true },
      include: { role: true }
    });
    rolesWithSecurity.forEach(rm => console.log(`Role: ${rm.role.name}`));
  } else {
    console.log('Security menu not found.');
  }

  console.log('\n=== C. Inventory Role Access ===');
  const inventoryRole = await prisma.role.findFirst({ where: { name: 'INVENTORY' } });
  if (inventoryRole) {
    const inventoryRoleMenus = await prisma.roleMenu.findMany({
      where: { roleId: inventoryRole.id },
      include: { menu: true }
    });
    inventoryRoleMenus.forEach(rm => {
      console.log(`Menu: ${rm.menu.name} | View: ${rm.can_view} | Add: ${rm.can_add} | Edit: ${rm.can_edit} | Delete: ${rm.can_delete}`);
    });
  } else {
    console.log('INVENTORY role not found.');
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
