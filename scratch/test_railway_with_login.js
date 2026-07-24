import axios from 'axios';

async function testRailwayWithLogin() {
  try {
    console.log('Logging in to Railway production backend with superadmin@zanezion.com...');
    const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
      email: 'superadmin@zanezion.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('Login successful! Token received.');

    const res = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n--- RAILWAY PRODUCTION API RESPONSE ---');
    console.log('Status:', res.status);
    console.log('Message:', res.data.message);
    const data = res.data.data;
    const clients = data.clients || data;
    console.log('Total Clients in Response:', data.total || clients.length);
    console.log('Clients Returned:');
    console.log(JSON.stringify(clients.map((c, i) => ({
      index: i + 1,
      id: c.id,
      name: c.companyName,
      email: c.email,
      clientType: c.clientType,
      tenantId: c.tenantId,
      source: c.source
    })), null, 2));

  } catch (err) {
    console.error('Railway Login/API Error:', err.response?.data || err.message);
  }
}

testRailwayWithLogin();
