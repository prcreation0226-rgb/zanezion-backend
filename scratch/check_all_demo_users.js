import prisma from '../src/config/db.js';
import bcrypt from 'bcrypt';

async function main() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });

  console.log(`Total users in DB: ${users.length}`);

  const demoList = [
    'superadmin@zanezion.com',
    'admin@gmail.com',
    'admin@zanezion.com',
    'procurement@gmail.com',
    'procurement@zanezion.com',
    'operation@gmail.com',
    'operations@zanezion.com',
    'logistics@gmail.com',
    'logistics@zanezion.com',
    'invontory@gmail.com',
    'inventory@gmail.com',
    'inventory@zanezion.com',
    'concierge@gmail.com',
    'concierge@zanezion.com',
    'client01@gmail.com',
    'client@zanezion.com',
    'businessclient@zanezion.com',
    'staff@gmail.com',
    'staff@zanezion.com',
    'fieldstaff@zanezion.com'
  ];

  console.log("\n=== Checking Demo List Users ===");
  for (const email of demoList) {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      const matchAdmin123 = await bcrypt.compare('admin@123', user.password);
      const matchPassword123 = await bcrypt.compare('password123', user.password);
      console.log(`FOUND: ${user.email} | Role: ${user.role?.name} (id: ${user.roleId}) | Status: ${user.status} | admin@123: ${matchAdmin123} | password123: ${matchPassword123}`);
    } else {
      console.log(`NOT FOUND: ${email}`);
    }
  }

  console.log("\n=== All Other Users with Roles ===");
  for (const u of users) {
    const matchAdmin123 = await bcrypt.compare('admin@123', u.password);
    const matchPassword123 = await bcrypt.compare('password123', u.password);
    console.log(`User: ${u.email} | Name: ${u.name} | Role: ${u.role?.name} | Status: ${u.status} | admin@123: ${matchAdmin123} | password123: ${matchPassword123}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
