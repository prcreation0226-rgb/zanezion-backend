import fs from 'fs';
import prisma from './src/config/db.js';

async function restore() {
  console.log('Reading ROLE_MENU_BACKUP.json...');
  const backupData = JSON.parse(fs.readFileSync('ROLE_MENU_BACKUP.json', 'utf8'));
  
  console.log(`Found ${backupData.length} records. Starting restore via transaction...`);
  
  try {
    await prisma.$transaction(
      backupData.map(record => prisma.roleMenu.upsert({
        where: { id: record.id },
        update: {
          can_view: record.can_view,
          can_add: record.can_add,
          can_edit: record.can_edit,
          can_delete: record.can_delete
        },
        create: {
          id: record.id,
          roleId: record.roleId,
          menuId: record.menuId,
          can_view: record.can_view,
          can_add: record.can_add,
          can_edit: record.can_edit,
          can_delete: record.can_delete
        }
      }))
    );
    console.log('Restore completed successfully.');
  } catch (error) {
    console.error('Restore failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
