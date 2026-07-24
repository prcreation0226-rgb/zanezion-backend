import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: {
      name: 'CUSTOMER',
      description: 'Personal Customer Role'
    }
  });

  const saasClientRole = await prisma.role.upsert({
    where: { name: 'SAAS_CLIENT' },
    update: {},
    create: {
      name: 'SAAS_CLIENT',
      description: 'SaaS Client Role'
    }
  });

  console.log('Roles created/verified:', customerRole, saasClientRole);
}

main().catch(console.error).finally(() => prisma.$disconnect());
