import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const role = await prisma.role.findFirst({where:{name:'PROCUREMENT'}});
  if (!role) {
     console.log('Role PROCUREMENT not found');
     return;
  }
  const roleMenu = await prisma.roleMenu.findFirst({
     where:{roleId:role.id, menu:{name:'Projects'}}
  });
  console.log('RoleMenu for Projects (PROCUREMENT):', roleMenu);
  
  // also check ORDERS
  const roleMenuOrders = await prisma.roleMenu.findFirst({
     where:{roleId:role.id, menu:{name:'Orders'}}
  });
  console.log('RoleMenu for Orders (PROCUREMENT):', roleMenuOrders);
}
main().catch(console.error).finally(() => prisma.$disconnect());
