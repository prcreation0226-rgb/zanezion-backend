import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.event.findMany();
  console.log("All events:", events);
}

main().catch(console.error).finally(() => prisma.$disconnect());
