import prisma from './src/config/db.js';

async function findIds() {
  const category = await prisma.itemCategory.findFirst();
  const unit = await prisma.itemUnit.findFirst();
  const tenant = await prisma.tenant.findFirst();
  
  console.log('Category:', category);
  console.log('Unit:', unit);
  console.log('Tenant:', tenant);
}

findIds().finally(() => {
  if (prisma && typeof prisma.$disconnect === 'function') prisma.$disconnect();
});
