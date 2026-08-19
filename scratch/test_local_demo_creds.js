import axios from 'axios';

const demoCredentials = {
  'superadmin': { email: 'superadmin@zanezion.com', password: 'admin@123' },
  'admin': { email: 'admin@gmail.com', password: 'admin@123' },
  'procurement': { email: 'procurement@gmail.com', password: 'admin@123' },
  'operations': { email: 'operation@gmail.com', password: 'admin@123' },
  'logistics': { email: 'logistics@gmail.com', password: 'admin@123' },
  'inventory': { email: 'invontory@gmail.com', password: 'admin@123' },
  'concierge': { email: 'concierge@gmail.com', password: 'admin@123' },
  'client': { email: 'client01@gmail.com', password: 'admin@123' },
  'staff': { email: 'staff@gmail.com', password: 'admin@123' },
};

async function testLocal() {
  const url = 'http://localhost:8000/api/v1';
  console.log(`Testing all demo credentials on Localhost (${url}):\n`);

  for (const [role, creds] of Object.entries(demoCredentials)) {
    try {
      const res = await axios.post(`${url}/auth/login`, creds, { timeout: 5000 });
      const user = res.data?.data?.user;
      console.log(`[PASS] ${role.toUpperCase()}: ${creds.email} -> Logged in as: ${user?.name} (Role: ${user?.role?.name || user?.role})`);
    } catch (err) {
      console.log(`[FAIL] ${role.toUpperCase()}: ${creds.email} -> ${err.response?.status} : ${JSON.stringify(err.response?.data || err.message)}`);
    }
  }
}

testLocal();
