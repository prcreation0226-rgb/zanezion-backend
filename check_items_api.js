import prisma from './src/config/db.js';

async function check() {
  console.log("=== CHECKING ITEMS IN DB ===");
  const items = await prisma.item.findMany({
    take: 10
  });
  console.log("DB Items:");
  items.forEach(it => {
    console.log(`- ID: ${it.id}, Name: ${it.name}, SKU: ${it.sku}`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
