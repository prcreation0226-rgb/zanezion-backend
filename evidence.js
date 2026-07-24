import prisma from './src/config/db.js';

async function run() {
  console.log('=== 1. Menu Table Records (first 10) ===');
  const menus = await prisma.menu.findMany({ take: 10 });
  menus.forEach(m => console.log(`ID: ${m.id} | Name: ${m.name} | Module: ${m.module}`));

  console.log('\n=== 2. RoleMenu Records for Selected Roles ===');
  const roles = await prisma.role.findMany({
    where: { name: { in: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS'] } }
  });
  
  for (const role of roles) {
    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId: role.id },
      include: { menu: true },
      take: 5 // limit output
    });
    console.log(`\nRole: ${role.name}`);
    roleMenus.forEach(rm => console.log(`  Menu: ${rm.menu.name} | can_view: ${rm.can_view} | can_add: ${rm.can_add} | can_edit: ${rm.can_edit} | can_delete: ${rm.can_delete}`));
  }

  console.log('\n=== 3. Live API Tests ===');
  const users = [
    { email: 'admin@zanezion.com', endpoint: '/api/v1/orders' },
    { email: 'operations@zanezion.com', endpoint: '/api/v1/orders' },
    { email: 'inventory@zanezion.com', endpoint: '/api/v1/items' }
  ];

  for (const u of users) {
    try {
      const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: u.email,
          password: u.email === 'admin@zanezion.com' ? 'Admin@123' : 'password123'
        })
      });
      const loginData = await loginRes.json();
      const token = loginData.data?.token || loginData.token;
      
      if (!token) {
        console.log(`${u.email} -> Login Failed: ${JSON.stringify(loginData)}`);
        continue;
      }

      const getRes = await fetch(`http://localhost:8000${u.endpoint}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await getRes.json();
      
      if (getRes.ok) {
        console.log(`${u.email} -> GET ${u.endpoint} | Status: ${getRes.status} | Payload (truncated): ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`${u.email} -> GET ${u.endpoint} | Status: ${getRes.status} | Payload: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`${u.email} -> Error: ${error.message}`);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
