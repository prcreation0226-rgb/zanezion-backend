(async () => {
  try {
    const tokenRes = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
    });
    const tokenData = await tokenRes.json();
    const token = tokenData.data.token;

    const res = await fetch('http://localhost:8000/api/v1/items', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(JSON.stringify(await res.json(), null, 2));
  } catch (e) {
    console.error(e);
  }
})();
