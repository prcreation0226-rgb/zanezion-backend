import axios from 'axios';

async function testRailwayLimit() {
  try {
    // 1. Login as Super Admin
    const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
      email: 'superadmin@zanezion.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('Login successful! Token received.');

    // 2. Fetch clients with limit=100
    const clientsRes = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=100&clientType=Personal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n--- RAILWAY API RESPONSE (limit=100) ---');
    console.log('Total Count from Backend:', clientsRes.data.data.total);
    console.log('Array Length Returned:', clientsRes.data.data.clients.length);
    console.log('Returned Emails:');
    console.log(clientsRes.data.data.clients.map(c => c.email));

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testRailwayLimit();
