import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(clients, null, 2));
}
main().finally(() => prisma.$disconnect());
