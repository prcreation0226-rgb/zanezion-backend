async function testItemCreation() {
  const payload = {
    name: "aDCV",
    categoryId: 1,
    unitId: 1,
    description: "dscv",
    inventoryType: "INTERNAL",
    clientId: 5,
    sku: "SKU-TEST-99",
    qty: 2,
    warehouseId: 2,
    price: 231
  };

  try {
    const res = await fetch('http://localhost:8000/api/v1/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mocking an admin user (assuming JWT token is required, I might get 401 Unauthorized if auth is enforced)
      },
      body: JSON.stringify(payload)
    });
    
    // I don't have a token, but let's see if we get a 500 error or a 401 error.
    const data = await res.json();
    console.log(res.status, data);
  } catch (e) {
    console.error(e);
  }
}

testItemCreation();
