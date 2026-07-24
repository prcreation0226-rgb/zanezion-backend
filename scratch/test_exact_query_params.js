import axios from 'axios';

async function testExactQueryParams() {
  try {
    const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
      email: 'superadmin@zanezion.com',
      password: 'admin123'
    });
    const token = loginRes.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    const urls = [
      'https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal',
      'https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Customers',
      'https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=individual',
      'https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10'
    ];

    for (const url of urls) {
      console.log('\n----------------------------------------');
      console.log('Testing URL:', url);
      const res = await axios.get(url, { headers });
      console.log('Total returned:', res.data.data.total);
      console.log('First 3 returned emails:', (res.data.data.clients || []).slice(0, 3).map(c => ({ id: c.id, email: c.email, tenantId: c.tenantId, clientType: c.clientType })));
    }

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testExactQueryParams();
