import prisma from './src/config/db.js';

async function testBackend() {
  const email = 'admin@zanezion.com';
  let token;
  try {
    const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    });
    const loginData = await loginRes.json();
    token = loginData.data?.token || loginData.token;
  } catch (err) {
    console.error('Login error:', err.message);
    process.exit(1);
  }

  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  console.log('=== TESTING AUTO SKU GENERATION ===');
  const createItemRes = await fetch('http://localhost:8000/api/v1/items', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'SKU Test Watch', categoryId: 1, unitId: 1 }) // NO SKU PROVIDED
  });
  const createItemData = await createItemRes.json();
  console.log('HTTP POST /items Response:', JSON.stringify(createItemData, null, 2));
}

testBackend().finally(() => {
  if (prisma && typeof prisma.$disconnect === 'function') prisma.$disconnect();
});
