import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const clients = await prisma.client.findMany({ take: 5 });
  console.log('Clients:', clients);
}
main().finally(() => prisma.$disconnect());
