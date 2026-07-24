const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({ where: { role: { name: 'LOGISTICS' } } });
    if (!user) {
      console.log('No logistics user found');
      return;
    }
    console.log('Found user:', user);

    let defaultDept = await prisma.department.findFirst({ where: { tenantId: user.tenantId } });
    if (!defaultDept) {
      defaultDept = await prisma.department.create({
        data: { tenantId: user.tenantId, name: 'Operations', code: 'OPS-01' }
      });
      console.log('Created department:', defaultDept);
    }
    
    let defaultDesig = await prisma.designation.findFirst({ where: { tenantId: user.tenantId } });
    if (!defaultDesig) {
      defaultDesig = await prisma.designation.create({
        data: { tenantId: user.tenantId, departmentId: defaultDept.id, name: 'Field Staff' }
      });
      console.log('Created designation:', defaultDesig);
    }

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        tenantId: user.tenantId,
        firstName: user.name?.split(' ')[0] || 'Unknown',
        lastName: user.name?.split(' ').slice(1).join(' ') || 'User',
        employeeCode: `EMP-${user.id}-${Date.now().toString().slice(-4)}`,
        departmentId: defaultDept.id,
        designationId: defaultDesig.id,
        joiningDate: new Date(),
        status: 'active'
      }
    });
    console.log('Created employee:', employee);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
