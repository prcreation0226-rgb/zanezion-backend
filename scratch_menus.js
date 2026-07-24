import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const menus = await prisma.menu.findMany();
  console.log('Menus:', menus.map(m=>m.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
