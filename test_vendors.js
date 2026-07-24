import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const vendors = await prisma.vendor.findMany();
  console.log(vendors);
}
main().catch(console.error).finally(() => prisma.$disconnect());
