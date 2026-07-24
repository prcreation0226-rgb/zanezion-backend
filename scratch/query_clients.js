import prisma from '../src/config/db.js';

async function query() {
  const clients = await prisma.client.findMany({
    include: {
      tenant: true
    }
  });
  console.log("Total clients found:", clients.length);
  clients.forEach(c => {
    console.log(`ID: ${c.id} | Code: ${c.clientCode} | Name: ${c.companyName} | Email: ${c.email} | TenantId: ${c.tenantId}`);
  });

  const users = await prisma.user.findMany({
     where: { email: 'business00@gmail.com' }
  });
  console.log("Users with business00@gmail.com:", users);
}

query().catch(console.error).finally(() => prisma.$disconnect());
