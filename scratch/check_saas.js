import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const clients = await prisma.client.findMany({
  where: { clientType: 'SaaS' },
  select: { id: true, companyName: true, email: true, tenantId: true, status: true, clientType: true }
});
console.log('SaaS clients in DB:', JSON.stringify(clients, null, 2));
console.log('Total:', clients.length);

await prisma.$disconnect();
