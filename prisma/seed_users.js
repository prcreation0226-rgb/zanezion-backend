import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const testUsers = [
  { email: 'superadmin@zanezion.com', role: 'SUPER_ADMIN', name: 'Super Admin' },
  { email: 'admin@zanezion.com', role: 'ADMIN', name: 'Admin User' },
  { email: 'operations@zanezion.com', role: 'OPERATIONS', name: 'Operations User' },
  { email: 'procurement@zanezion.com', role: 'PROCUREMENT', name: 'Procurement User' },
  { email: 'logistics@zanezion.com', role: 'LOGISTICS', name: 'Logistics User' },
  { email: 'inventory@zanezion.com', role: 'INVENTORY', name: 'Inventory User' },
  { email: 'concierge@zanezion.com', role: 'CONCIERGE', name: 'Concierge User' },
  { email: 'businessclient@zanezion.com', role: 'BUSINESS_CLIENT', name: 'Business Client' },
  { email: 'fieldstaff@zanezion.com', role: 'FIELD_STAFF', name: 'Field Staff' }
];

async function seedTestUsers() {
  console.log('🌱 Seeding specific test users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const tenant = await prisma.tenant.findFirst();
  
  if (!tenant) {
    console.error('❌ No tenant found in DB.');
    return;
  }

  for (const tu of testUsers) {
    const role = await prisma.role.findFirst({
      where: { name: tu.role }
    });
    
    if (!role) {
      console.warn(`Role ${tu.role} not found. Skipping ${tu.email}.`);
      continue;
    }
    
    await prisma.user.upsert({
      where: { email: tu.email },
      update: {
        password: hashedPassword,
        roleId: role.id,
        status: 'active'
      },
      create: {
        name: tu.name,
        email: tu.email,
        password: hashedPassword,
        roleId: role.id,
        tenantId: tenant.id,
        status: 'active'
      }
    });
    console.log(`✅ Upserted user: ${tu.email}`);
  }
  
  console.log('🎉 Done seeding test users!');
}

seedTestUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

