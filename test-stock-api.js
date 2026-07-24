(async () => {
  const tokenRes = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zanezion.com', password: 'password' })
  });
  const tokenData = await tokenRes.json();
  const token = tokenData.data.token;

  const res = await fetch('http://localhost:8000/api/v1/stock/adjust', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      warehouseId: 4,
      itemId: 2,
      quantity: 1,
      type: 'DEDUCT',
      remarks: 'Issue to customer'
    })
  });
  console.log(await res.json());
})();
