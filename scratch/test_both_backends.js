import axios from 'axios';
import jwt from 'jsonwebtoken';

const config = {
  jwtSecret: 'zanezion_super_secret_jwt_key_2026_x9z8y7'
};

async function testBothBackends() {
  const superAdminToken = jwt.sign(
    { id: 74, email: 'superadmin@zanezion.com', roleId: 1, tenantId: 1 },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  console.log('--- 1. TESTING RAILWAY PRODUCTION BACKEND ---');
  try {
    const railwayRes = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('Railway Status:', railwayRes.status);
    console.log('Railway Total:', railwayRes.data.data.total);
    console.log('Railway Clients:', JSON.stringify(railwayRes.data.data.clients.map(c => ({ id: c.id, email: c.email, tenantId: c.tenantId })), null, 2));
  } catch (e) {
    console.error('Railway Error:', e.response?.data || e.message);
  }

  console.log('\n--- 2. TESTING LOCAL BACKEND (http://localhost:5000 or 8000) ---');
  try {
    const localRes = await axios.get('http://localhost:5000/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('Local Status:', localRes.status);
    console.log('Local Total:', localRes.data.data.total);
    console.log('Local Clients:', JSON.stringify(localRes.data.data.clients.map(c => ({ id: c.id, email: c.email, tenantId: c.tenantId })), null, 2));
  } catch (e) {
    console.error('Local 5000 Error:', e.response?.data || e.message);
  }
}

testBothBackends();
