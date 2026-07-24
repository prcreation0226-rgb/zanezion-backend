import prisma from './src/config/db.js';

const categories = [
  'Grocery',
  'Food',
  'Beverage',
  'Automotive',
  'Maritime',
  'Pharmaceutical',
  'Building Supplies',
  'Electronics',
  'Home',
  'General',
];

const units = [
  { name: 'Pieces', shortName: 'pcs' },
  { name: 'Case', shortName: 'case' },
  { name: 'LB', shortName: 'lb' },
  { name: 'KG', shortName: 'kg' },
  { name: 'Gallon', shortName: 'gal' }
];

async function seed() {
  console.log('Seeding categories...');
  for (const catName of categories) {
    const existing = await prisma.itemCategory.findFirst({
      where: { tenantId: 1, name: catName }
    });
    if (!existing) {
      await prisma.itemCategory.create({
        data: {
          tenantId: 1,
          name: catName,
          status: 'active'
        }
      });
      console.log(`Created category: ${catName}`);
    }
  }
  
  console.log('Seeding units...');
  for (const unit of units) {
    const existing = await prisma.itemUnit.findFirst({
      where: { tenantId: 1, name: unit.name }
    });
    if (!existing) {
      await prisma.itemUnit.create({
        data: {
          tenantId: 1,
          name: unit.name,
          shortName: unit.shortName,
          status: 'active'
        }
      });
      console.log(`Created unit: ${unit.name}`);
    }
  }
  
  console.log('Seeding categories and units completed successfully!');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
