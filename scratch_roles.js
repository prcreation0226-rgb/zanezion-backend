import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const newRoles = ['Operations', 'Procurement', 'Logistics', 'Inventory', 'Concierge', 'Field Staff', 'Staff', 'Driver'];
  for (const roleName of newRoles) {
    const formattedName = roleName.toUpperCase().replace(' ', '_');
    await prisma.role.upsert({
      where: { name: formattedName },
      update: {},
      create: { name: formattedName, description: roleName }
    });
  }
  const roles = await prisma.role.findMany();
  console.log(roles);
}
main().catch(console.error).finally(() => prisma.$disconnect());
