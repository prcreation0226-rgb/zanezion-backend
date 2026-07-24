import prisma from './src/config/db.js';

async function validate() {
  const testCases = [
    // 1. OPERATIONS (Create/Update Orders)
    { role: 'OPERATIONS', email: 'operations@zanezion.com', method: 'POST', endpoint: '/api/v1/orders', expect: 201 }, 
    { role: 'OPERATIONS', email: 'operations@zanezion.com', method: 'PUT', endpoint: '/api/v1/orders/1', expect: 200 },
    // 2. PROCUREMENT (Create/Update Purchase Requests)
    { role: 'PROCUREMENT', email: 'procurement@zanezion.com', method: 'POST', endpoint: '/api/v1/purchase-requests', expect: 201 },
    { role: 'PROCUREMENT', email: 'procurement@zanezion.com', method: 'PUT', endpoint: '/api/v1/purchase-requests/1', expect: 200 },
    // 3. INVENTORY (CRUD Items)
    { role: 'INVENTORY', email: 'inventory@zanezion.com', method: 'GET', endpoint: '/api/v1/items', expect: 200 },
    { role: 'INVENTORY', email: 'inventory@zanezion.com', method: 'POST', endpoint: '/api/v1/items', expect: 201 },
    { role: 'INVENTORY', email: 'inventory@zanezion.com', method: 'PUT', endpoint: '/api/v1/items/1', expect: 200 },
    { role: 'INVENTORY', email: 'inventory@zanezion.com', method: 'DELETE', endpoint: '/api/v1/items/1', expect: 200 },
    // 4. LOGISTICS (Update Deliveries only)
    { role: 'LOGISTICS', email: 'logistics@zanezion.com', method: 'PUT', endpoint: '/api/v1/deliveries/1', expect: 200 },
    { role: 'LOGISTICS', email: 'logistics@zanezion.com', method: 'POST', endpoint: '/api/v1/deliveries', expect: 403 },
    // 5. BUSINESS_CLIENT (Limited)
    { role: 'BUSINESS_CLIENT', email: 'client@zanezion.com', method: 'GET', endpoint: '/api/v1/missions', expect: 403 },
    // 6. FIELD_STAFF (Limited)
    { role: 'FIELD_STAFF', email: 'staff@zanezion.com', method: 'GET', endpoint: '/api/v1/users', expect: 403 },
    // 7. Personnel (ADMIN only)
    { role: 'OPERATIONS', email: 'operations@zanezion.com', method: 'GET', endpoint: '/api/v1/users', expect: 403 },
    // 8. Security (ADMIN only)
    { role: 'OPERATIONS', email: 'operations@zanezion.com', method: 'GET', endpoint: '/api/v1/roles', expect: 403 },
    // 9. Tenant (SUPER_ADMIN only)
    { role: 'ADMIN', email: 'admin2@zanezion.com', method: 'GET', endpoint: '/api/v1/tenants', expect: 403 }, 
  ];

  const results = [];

  for (const tc of testCases) {
    try {
      const login = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tc.email, password: 'password123' })
      });
      const loginData = await login.json();
      const token = loginData.data?.token || loginData.token;
      
      if (!token) {
        results.push(`[SKIPPED] User ${tc.email} not found or login failed.`);
        continue;
      }

      const res = await fetch(`http://localhost:8000${tc.endpoint}`, {
        method: tc.method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: tc.method !== 'GET' && tc.method !== 'DELETE' ? JSON.stringify({}) : undefined
      });
      
      const isExpected = res.status !== 403 ? (tc.expect !== 403) : (tc.expect === 403); 
      const statusStr = isExpected ? 'PASS' : 'FAIL';
      results.push(`[${statusStr}] ${tc.role} ${tc.method} ${tc.endpoint} -> Status: ${res.status}`);
    } catch (e) {
      results.push(`[ERROR] ${tc.role} ${tc.method} ${tc.endpoint} -> ${e.message}`);
    }
  }

  console.log(results.join('\n'));
}

validate().catch(console.error).finally(() => prisma.$disconnect());
