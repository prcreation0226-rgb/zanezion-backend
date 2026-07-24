import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      employee: null
    }
  });

  console.log(`Found ${users.length} users without employee profiles.`);

  for (const user of users) {
    const names = user.name ? user.name.split(' ') : ['Unknown'];
    const firstName = names[0];
    const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
    
    // We must pass departmentId and designationId. Let's find valid ones first.
    let dept = await prisma.department.findFirst({ where: { tenantId: user.tenantId || 1 } });
    if (!dept) dept = await prisma.department.create({ data: { tenantId: user.tenantId || 1, name: 'General', code: 'GEN' } });
    
    let desig = await prisma.designation.findFirst({ where: { tenantId: user.tenantId || 1 } });
    if (!desig) desig = await prisma.designation.create({ data: { tenantId: user.tenantId || 1, departmentId: dept.id, name: 'Staff' } });

    await prisma.employee.create({
      data: {
        tenantId: user.tenantId || 1,
        userId: user.id,
        employeeCode: `EMP-${user.id.toString().padStart(4, '0')}`,
        firstName,
        lastName,
        joiningDate: new Date(),
        departmentId: dept.id,
        designationId: desig.id,
        status: 'active'
      }
    });
    console.log(`Created employee profile for user ${user.id} (${user.name})`);
  }
}

main().then(() => prisma.$disconnect());
