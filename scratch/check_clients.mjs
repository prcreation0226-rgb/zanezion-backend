import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Get all roles with their menu permissions
const roles = await p.role.findMany({
  where: { name: { notIn: ['SUPER_ADMIN'] } },
  select: { 
    id: true, 
    name: true,
    roleMenus: {
      select: {
        menu: { select: { id: true, name: true, path: true } },
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: true
      }
    }
  },
  orderBy: { name: 'asc' }
});

for (const role of roles) {
  console.log(`\n=== ${role.name} (ID: ${role.id}) ===`);
  if (role.roleMenus.length === 0) {
    console.log('  (no permissions set)');
  }
  for (const rm of role.roleMenus) {
    const flags = [];
    if (rm.can_view) flags.push('VIEW');
    if (rm.can_add) flags.push('ADD');
    if (rm.can_edit) flags.push('EDIT');
    if (rm.can_delete) flags.push('DELETE');
    if (flags.length > 0) {
      console.log(`  ${rm.menu?.name || '?'}: ${flags.join(', ')}`);
    }
  }
}

// Also get all menus
const menus = await p.menu.findMany({ orderBy: { id: 'asc' } });
console.log('\n=== ALL MENUS ===');
for (const m of menus) {
  console.log(`  ID:${m.id} | ${m.name} | ${m.path}`);
}

await p.$disconnect();
