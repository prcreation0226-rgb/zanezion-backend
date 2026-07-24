import axios from 'axios';

async function verifyRailway() {
  try {
    console.log('Testing live Railway backend with admin login...');
    const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
      email: 'admin@zanezion.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token;
    console.log('Login OK!');

    const res = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = res.data.data;
    const clients = data.clients || data;
    console.log('Total Returned:', data.total || clients.length);
    console.log('Top Personal Clients:');
    console.log(JSON.stringify(clients.map((c, i) => ({
      index: i + 1,
      id: c.id,
      name: c.companyName,
      email: c.email,
      clientType: c.clientType,
      source: c.source
    })), null, 2));

  } catch (err) {
    console.error('Verify error:', err.response?.data || err.message);
  }
}

verifyRailway();
