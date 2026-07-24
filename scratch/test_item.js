import prisma from '../src/config/db.js';

async function checkItem() {
  try {
    const item = await prisma.item.findFirst({ where: { tenantId: 1 } });
    console.log("Tenant 1 items:", item);
    
    if (!item) {
        console.log("No items found. Default item creation would be triggered.");
        const category = await prisma.category.findUnique({ where: { id: 1 } });
        console.log("Category 1 exists:", category);
    }
  } catch (err) {
    console.log("ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}
checkItem();
