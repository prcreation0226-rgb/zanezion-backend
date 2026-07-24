import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: { name: 'BUSINESS_CLIENT' } },
    include: { role: true, client: true }
  });
  console.log('User Client:', user.client);
}
main().catch(console.error).finally(() => prisma.$disconnect());
