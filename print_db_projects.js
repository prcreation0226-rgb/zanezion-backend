import prisma from './src/config/db.js';

async function check() {
  const projects = await prisma.order.findMany({
    where: { orderType: 'Project' }
  });
  console.log("=== ALL PROJECTS IN DB ===");
  projects.forEach(p => {
    console.log({
      id: p.id,
      orderNumber: p.orderNumber,
      status: p.status,
      metadata: typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata
    });
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
