import fs from 'fs';
import prisma from './src/config/db.js';

// Using the same logic from dry_run_seeder to guarantee identical output
function getProposed(roleName, menuName, menuModule) {
  let view = true, add = false, edit = false, del = false;

  if (roleName === 'SUPER_ADMIN' || roleName === 'ADMIN') { return { view: true, add: true, edit: true, del: true }; }
  
  if (roleName === 'BUSINESS_CLIENT') {
    if (menuName === 'Missions' || menuName === 'Deliveries') { return { view: false, add: false, edit: false, del: false }; }
    if (menuName === 'My Orders' || menuName === 'Marketplace' || menuName === 'Dashboard') {
      view = true;
      if (menuName === 'My Orders') add = true;
      return { view, add, edit, del };
    }
    return { view: false, add: false, edit: false, del: false };
  }

  if (roleName === 'FIELD_STAFF') {
    if (menuName === 'Assignments' || menuName === 'Field Map') { return { view: true, add: false, edit: true, del: false }; }
    if (menuName === 'Staff Terminal') { return { view: true, add: false, edit: false, del: false }; }
    return { view: false, add: false, edit: false, del: false };
  }

  if (roleName === 'OPERATIONS') {
    if (['Orders', 'Projects', 'Missions', 'Deliveries'].includes(menuName) || menuModule === 'Operations' || menuModule === 'Logistics') {
      return { view: true, add: true, edit: true, del: false };
    }
  }

  if (roleName === 'PROCUREMENT') {
    if (menuModule === 'Procurement') { return { view: true, add: true, edit: true, del: false }; }
  }

  if (roleName === 'INVENTORY') {
    if (menuModule === 'Inventory') { return { view: true, add: true, edit: true, del: true }; }
  }

  if (roleName === 'CONCIERGE') {
    if (menuModule === 'Concierge') { return { view: true, add: true, edit: true, del: true }; }
  }

  if (roleName === 'LOGISTICS') {
    if (menuModule === 'Logistics') { return { view: true, add: false, edit: true, del: false }; }
  }

  return { view, add, edit, del }; // default
}

async function runSeeder() {
  const backupData = JSON.parse(fs.readFileSync('ROLE_MENU_BACKUP.json', 'utf8'));
  let updatedRows = 0;
  let skippedRows = 0;
  
  const operations = [];

  for (const record of backupData) {
    const roleName = record.role.name;
    const menuName = record.menu.name;
    const menuModule = record.menu.module;
    
    // Only apply logic to defined roles to preserve system integrity
    const proposed = ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'PROCUREMENT', 'LOGISTICS', 'INVENTORY', 'CONCIERGE', 'BUSINESS_CLIENT', 'FIELD_STAFF'].includes(roleName)
      ? getProposed(roleName, menuName, menuModule)
      : { view: record.can_view, add: record.can_add, edit: record.can_edit, del: record.can_delete }; // fallback to existing

    const changed = proposed.view !== record.can_view || proposed.add !== record.can_add || proposed.edit !== record.can_edit || proposed.del !== record.can_delete;

    if (changed) { updatedRows++; } else { skippedRows++; }

    operations.push(prisma.roleMenu.upsert({
      where: { id: record.id },
      update: {
        can_view: proposed.view,
        can_add: proposed.add,
        can_edit: proposed.edit,
        can_delete: proposed.del
      },
      create: {
        roleId: record.roleId,
        menuId: record.menuId,
        can_view: proposed.view,
        can_add: proposed.add,
        can_edit: proposed.edit,
        can_delete: proposed.del
      }
    }));
  }

  try {
    console.log(`Executing Prisma Transaction for ${operations.length} rows...`);
    await prisma.$transaction(operations);
    console.log(`Transaction successful. Updated ${updatedRows} rows. Unchanged ${skippedRows} rows.`);
  } catch (error) {
    console.error(`Transaction failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeeder();
