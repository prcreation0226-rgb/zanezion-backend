import axios from 'axios';

async function testRailwayLogin() {
  const urls = [
    'https://zanezion-backend-production-a303.up.railway.app/api/v1',
    'https://zanezion-backend-production.up.railway.app/api/v1'
  ];

  for (const url of urls) {
    try {
      console.log(`\nTesting URL: ${url}`);
      const res = await axios.post(`${url}/auth/login`, {
        email: 'client01@gmail.com',
        password: 'admin@123'
      }, { timeout: 8000 });
      console.log(`Success on ${url}! Data:`, res.data?.success, res.data?.data?.user?.email);
    } catch (err) {
      console.log(`Failed on ${url}:`, err.response?.status, err.response?.data || err.message);
    }
  }
}

testRailwayLogin();
