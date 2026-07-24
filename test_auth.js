import prisma from './src/config/db.js';

async function runTest() {
  const users = [
    { email: 'operations@zanezion.com', endpoint: '/api/v1/orders' },
    { email: 'inventory@zanezion.com', endpoint: '/api/v1/items' },
    { email: 'procurement@zanezion.com', endpoint: '/api/v1/purchase-requests' } // Note: role is PROCUREMENT but email is usually procurement@zanezion.com
  ];

  for (const u of users) {
    try {
      const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: u.email,
          password: 'password123'
        })
      });
      const loginData = await loginRes.json();
      const token = loginData.data?.token || loginData.token;
      
      if (!token) {
        console.log(`[AUTH FAILED] ${u.email} -> ${loginRes.status} | Payload: ${JSON.stringify(loginData)}`);
        continue;
      }

      const getRes = await fetch(`http://localhost:8000${u.endpoint}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log(`[API TEST] ${u.email} -> GET ${u.endpoint} | Status: ${getRes.status}`);
    } catch (error) {
      console.log(`[ERROR] ${u.email} -> ${error.message}`);
    }
  }
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
