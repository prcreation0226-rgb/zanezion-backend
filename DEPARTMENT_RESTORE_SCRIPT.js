
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function restore() {
  const backupData = JSON.parse(fs.readFileSync('DEPARTMENT_BACKUP.json', 'utf8'));
  console.log('Restoring ' + backupData.length + ' departments...');
  
  await prisma.$transaction(async (tx) => {
    // Delete all current departments
    await tx.department.deleteMany({});
    
    // Insert backup
    if (backupData.length > 0) {
      await tx.department.createMany({
        data: backupData
      });
    }
  });
  console.log('Restore complete');
  await prisma.$disconnect();
}
restore().catch(console.error);
