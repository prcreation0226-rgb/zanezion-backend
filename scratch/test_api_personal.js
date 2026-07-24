import axios from 'axios';

async function testRailwayBackendWithAuth() {
  try {
    console.log('Logging in as Super Admin to Railway production backend...');
    const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
      email: 'admin@zanezion.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('Login successful! Token acquired.');

    const res = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('GET /clients?clientType=Personal Response:');
    const clientsData = res.data.data;
    const clients = clientsData.clients || clientsData;
    console.log(JSON.stringify(clients.map((c, i) => ({ index: i + 1, id: c.id, name: c.companyName, email: c.email, clientType: c.clientType, source: c.source })), null, 2));

  } catch (err) {
    console.error('API Error:', err.response?.data || err.message);
  }
}

testRailwayBackendWithAuth();
