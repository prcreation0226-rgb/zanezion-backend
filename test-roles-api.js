import prisma from './src/config/db.js';

async function main() {
  // Find a saas_client user
  const user = await prisma.user.findFirst({
    where: { role: { name: 'SAAS_CLIENT' } },
    include: { role: true }
  });

  if (!user) {
    console.error('No SAAS_CLIENT user found');
    return;
  }

  console.log('Testing with user:', user.email);

  // Login
  const loginRes = await fetch('http://[::1]:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'password123' })
  });

  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status, await loginRes.text());
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;

  // Fetch roles
  const rolesRes = await fetch('http://[::1]:8000/api/v1/roles?limit=100', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('GET /roles status:', rolesRes.status);
  const rolesData = await rolesRes.json();
  console.log('GET /roles data:', JSON.stringify(rolesData, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
