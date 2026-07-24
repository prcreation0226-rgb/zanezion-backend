import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function execute() {
  try {
    // 1. Create full backup of existing departments
    const existingDepartments = await prisma.department.findMany();
    fs.writeFileSync('DEPARTMENT_BACKUP.json', JSON.stringify(existingDepartments, null, 2));
    console.log('Created DEPARTMENT_BACKUP.json');

    // 2. Generate Restore Script
    const restoreScriptContent = `
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
`;
    fs.writeFileSync('DEPARTMENT_RESTORE_SCRIPT.js', restoreScriptContent);
    console.log('Created DEPARTMENT_RESTORE_SCRIPT.js');

    // 3. Execute Seeding
    // Assume default tenant is 1 (or we can find it)
    const tenant = await prisma.tenant.findFirst({ orderBy: { id: 'asc' } });
    if (!tenant) {
      throw new Error("No tenant found. Ensure tenant is seeded.");
    }
    const tenantId = tenant.id;

    const departmentsToSeed = [
      { name: 'Operations', code: 'OPS', description: 'Core business operations and mission control.' },
      { name: 'Procurement', code: 'PROC', description: 'Purchasing, vendor management, and sourcing.' },
      { name: 'Logistics', code: 'LOG', description: 'Fleet management, deliveries, and supply chain.' },
      { name: 'Finance', code: 'FIN', description: 'Accounts payable/receivable, invoicing, and treasury.' },
      { name: 'Human Resources', code: 'HR', description: 'Personnel management, payroll, and recruiting.' },
      { name: 'Information Technology', code: 'IT', description: 'Systems, infrastructure, and technical support.' },
      { name: 'Sales', code: 'SALES', description: 'Client acquisition and CRM management.' },
      { name: 'Administration', code: 'ADMIN', description: 'General management and executive functions.' }
    ];

    console.log(`Seeding departments for tenant ID: ${tenantId}`);

    await prisma.$transaction(async (tx) => {
      for (const dept of departmentsToSeed) {
        // Because upsert requires a unique identifier, and we don't have @@unique([tenantId, code]) 
        // strictly defined as a Prisma unique constraint, we need to find first.
        // Let's check schema: @@index([tenantId]), @@index([code])
        // It's not a unique constraint! We must manually check and create/update to emulate UPSERT safely.
        
        const existing = await tx.department.findFirst({
          where: { tenantId: tenantId, code: dept.code }
        });

        if (existing) {
          await tx.department.update({
            where: { id: existing.id },
            data: { 
              name: dept.name, 
              description: dept.description,
              status: 'active'
            }
          });
        } else {
          await tx.department.create({
            data: {
              tenantId: tenantId,
              name: dept.name,
              code: dept.code,
              description: dept.description,
              status: 'active'
            }
          });
        }
      }
    });

    console.log('Seeding transaction completed successfully.');
    
  } catch (error) {
    console.error('Execution Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

execute();
