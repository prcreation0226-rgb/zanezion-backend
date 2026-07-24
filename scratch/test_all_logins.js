import axios from 'axios';

async function testAllLogins() {
  const emails = ['superadmin@zanezion.com', 'admin@zanezion.com', 'admin@gmail.com'];

  for (const email of emails) {
    try {
      console.log(`Testing login for ${email}...`);
      const res = await axios.post('https://zanezion-backend-production.up.railway.app/api/v1/auth/login', {
        email,
        password: 'admin123'
      });
      console.log(`✅ SUCCESS for ${email}! Token received. Role: ${res.data.data.user.role?.name}`);
    } catch (err) {
      console.error(`❌ FAILED for ${email}:`, err.response?.data || err.message);
    }
  }
}

testAllLogins();
