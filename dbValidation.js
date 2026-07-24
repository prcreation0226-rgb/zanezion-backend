import prisma from './src/config/db.js';

async function run() {
  const menuCount = await prisma.menu.count();
  const roleMenuCount = await prisma.roleMenu.count();
  const roleCount = await prisma.role.count();
  const userCount = await prisma.user.count({ where: { deletedAt: null } });
  const tenantCount = await prisma.tenant.count();
  const orderCount = await prisma.order.count();
  const missionCount = await prisma.mission.count();

  console.log('=== DB TABLE COUNTS ===');
  console.log('Menus:', menuCount);
  console.log('RoleMenus:', roleMenuCount);
  console.log('Roles:', roleCount);
  console.log('Users (active):', userCount);
  console.log('Tenants:', tenantCount);
  console.log('Orders:', orderCount);
  console.log('Missions:', missionCount);

  const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } });
  console.log('\n=== ROLE → MENU GRANT COUNT ===');
  for (const r of roles) {
    const rmCount = await prisma.roleMenu.count({ where: { roleId: r.id } });
    const viewCount = await prisma.roleMenu.count({ where: { roleId: r.id, can_view: true } });
    console.log(`  ${r.name}: ${rmCount} total grants, ${viewCount} can_view`);
  }

  console.log('\n=== ALL MENUS (module | name | path) ===');
  const menus = await prisma.menu.findMany({ orderBy: { module: 'asc' } });
  menus.forEach(m => console.log(`  [${m.module}] ${m.name} => ${m.path}`));

  console.log('\n=== BUSINESS_CLIENT MENUS ===');
  const bcRole = await prisma.role.findFirst({ where: { name: 'BUSINESS_CLIENT' } });
  if (bcRole) {
    const bcMenus = await prisma.roleMenu.findMany({ where: { roleId: bcRole.id }, include: { menu: true } });
    bcMenus.forEach(rm => console.log(`  ${rm.menu.name} | view:${rm.can_view} add:${rm.can_add} edit:${rm.can_edit} del:${rm.can_delete}`));
  }

  console.log('\n=== FIELD_STAFF MENUS ===');
  const fsRole = await prisma.role.findFirst({ where: { name: 'FIELD_STAFF' } });
  if (fsRole) {
    const fsMenus = await prisma.roleMenu.findMany({ where: { roleId: fsRole.id }, include: { menu: true } });
    fsMenus.forEach(rm => console.log(`  ${rm.menu.name} | view:${rm.can_view} add:${rm.can_add} edit:${rm.can_edit} del:${rm.can_delete}`));
  }

  console.log('\n=== CONCIERGE MENUS ===');
  const cRole = await prisma.role.findFirst({ where: { name: 'CONCIERGE' } });
  if (cRole) {
    const cMenus = await prisma.roleMenu.findMany({ where: { roleId: cRole.id }, include: { menu: true } });
    cMenus.forEach(rm => console.log(`  ${rm.menu.name} | view:${rm.can_view} add:${rm.can_add} edit:${rm.can_edit} del:${rm.can_delete}`));
  }

  console.log('\n=== OPERATIONS MENUS ===');
  const opRole = await prisma.role.findFirst({ where: { name: 'OPERATIONS' } });
  if (opRole) {
    const opMenus = await prisma.roleMenu.findMany({ where: { roleId: opRole.id }, include: { menu: true } });
    opMenus.forEach(rm => console.log(`  ${rm.menu.name} | view:${rm.can_view} add:${rm.can_add} edit:${rm.can_edit} del:${rm.can_delete}`));
  }

  console.log('\n=== USERS ===');
  const users = await prisma.user.findMany({ where: { deletedAt: null }, include: { role: true }, orderBy: { id: 'asc' } });
  users.forEach(u => console.log(`  ${u.email} => ${u.role?.name} | status: ${u.status}`));
}

run().catch(console.error).finally(() => prisma.$disconnect());
