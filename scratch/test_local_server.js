import axios from 'axios';

async function testLocalServer() {
  try {
    console.log('Logging in to LOCAL backend server on port 8000...');
    const loginRes = await axios.post('http://localhost:8000/api/v1/auth/login', {
      email: 'superadmin@zanezion.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('Local Server Login OK!');

    const res = await axios.get('http://localhost:8000/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('\n--- LOCAL SERVER API RESPONSE (PORT 8000) ---');
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
      source: c.source,
      createdAt: c.createdAt
    })), null, 2));

  } catch (err) {
    console.error('Local Server Error:', err.response?.data || err.message);
  }
}

testLocalServer();
