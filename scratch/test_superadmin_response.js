async function testSuperadminLogin() {
  try {
    const res = await fetch('https://zanezion-backend-production-a303.up.railway.app/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@zanezion.com', password: 'admin@123' })
    });
    const json = await res.json();
    console.log('Status:', res.status);
    console.log('JSON Keys:', Object.keys(json));
    console.log('Full Response:', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
testSuperadminLogin();
