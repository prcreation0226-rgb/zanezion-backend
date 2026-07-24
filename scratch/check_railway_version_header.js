import axios from 'axios';

async function checkRailwayVersionHeader() {
  try {
    const loginRes = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
      email: 'superadmin@zanezion.com',
      password: 'admin123'
    });
    const token = loginRes.data.data.token;

    const res = await axios.get('https://zanezion-backend-production.up.railway.app/api/v1/clients?page=1&limit=10&clientType=Personal', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('--- FULL RESPONSE FROM RAILWAY API ---');
    console.log('Response Keys:', Object.keys(res.data.data));
    console.log('Version:', res.data.data.version);
    console.log('DebugTenantIdToFilter:', res.data.data.debugTenantIdToFilter);
    console.log('DebugUserRole:', res.data.data.debugUserRole);

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

checkRailwayVersionHeader();
