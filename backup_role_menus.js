import fs from 'fs';
import prisma from './src/config/db.js';

async function run() {
  console.log('Fetching role_menus...');
  const roleMenus = await prisma.roleMenu.findMany({
    include: {
      role: { select: { name: true } },
      menu: { select: { name: true, module: true } }
    }
  });

  const backupPath = 'ROLE_MENU_BACKUP.json';
  fs.writeFileSync(backupPath, JSON.stringify(roleMenus, null, 2));
  
  console.log(`Backup saved to ${backupPath} with ${roleMenus.length} records.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
