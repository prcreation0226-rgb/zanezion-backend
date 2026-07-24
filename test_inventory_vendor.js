import prisma from './src/config/db.js';

async function testInventoryAndVendors() {
  const email = 'admin@zanezion.com';
  let token;
  try {
    const loginRes = await fetch('http://localhost:8000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' })
    });
    const loginData = await loginRes.json();
    token = loginData.data?.token || loginData.token;
  } catch (err) {
    console.error('Login error:', err.message);
    process.exit(1);
  }

  const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  console.log('=== INVENTORY VALIDATION ===');
  // 1. Create
  const createItemRes = await fetch('http://localhost:8000/api/v1/items', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name: 'Rolex Daytona Real Test', categoryId: 1, unitId: 1, sku: 'SKU-' + Date.now(), description: 'A test watch' })
  });
  const createItemData = await createItemRes.json();
  const newItemId = createItemData?.data?.id || createItemData?.id;
  console.log('HTTP POST /items Response:', JSON.stringify(createItemData, null, 2));

  let dbItem;
  if (newItemId) {
    dbItem = await prisma.item.findUnique({ where: { id: parseInt(newItemId) } });
    console.log(`Database row ID ${newItemId} after creation:`, JSON.stringify(dbItem, null, 2));

    // 2. Update
    const updateItemRes = await fetch(`http://localhost:8000/api/v1/items/${newItemId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ name: 'Rolex Daytona Real Updated', description: 'Updated test watch' })
    });
    console.log('HTTP PUT /items Response:', updateItemRes.status);

    const dbItemUpdated = await prisma.item.findUnique({ where: { id: parseInt(newItemId) } });
    console.log(`Database row ID ${newItemId} after update:`, JSON.stringify(dbItemUpdated, null, 2));

    // 3. Delete
    const deleteItemRes = await fetch(`http://localhost:8000/api/v1/items/${newItemId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    console.log('HTTP DELETE /items Response:', deleteItemRes.status);

    const dbItemDeleted = await prisma.item.findUnique({ where: { id: parseInt(newItemId) } });
    console.log(`Database row ID ${newItemId} after deletion (should be null):`, dbItemDeleted);
  } else {
    console.log('Failed to create item, skipping update/delete.');
  }

  console.log('\n=== VENDOR VALIDATION ===');
  // 1. Create
  const createVendorRes = await fetch('http://localhost:8000/api/v1/vendors', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ companyName: 'Test Vendor SA', vendorCode: 'VND-' + Date.now().toString().slice(-6), email: 'default@vendor.com', contactPerson: 'John Doe', phone: '1234567890', address: '123 Test St' })
  });
  const createVendorData = await createVendorRes.json();
  const newVendorId = createVendorData?.data?.id || createVendorData?.id;
  console.log('HTTP POST /vendors Response:', JSON.stringify(createVendorData, null, 2));

  if (newVendorId) {
    const dbVendor = await prisma.vendor.findUnique({ where: { id: parseInt(newVendorId) } });
    console.log(`Database row ID ${newVendorId} after creation:`, JSON.stringify(dbVendor, null, 2));

    // 2. Update
    const updateVendorRes = await fetch(`http://localhost:8000/api/v1/vendors/${newVendorId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ companyName: 'Test Vendor SA Updated', contactPerson: 'Jane Doe' })
    });
    console.log('HTTP PUT /vendors Response:', updateVendorRes.status);

    const dbVendorUpdated = await prisma.vendor.findUnique({ where: { id: parseInt(newVendorId) } });
    console.log(`Database row ID ${newVendorId} after update:`, JSON.stringify(dbVendorUpdated, null, 2));

    // 3. Delete
    const deleteVendorRes = await fetch(`http://localhost:8000/api/v1/vendors/${newVendorId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    console.log('HTTP DELETE /vendors Response:', deleteVendorRes.status);

    const dbVendorDeleted = await prisma.vendor.findUnique({ where: { id: parseInt(newVendorId) } });
    console.log(`Database row ID ${newVendorId} after deletion (should be null):`, dbVendorDeleted);
  } else {
    console.log('Failed to create vendor, skipping update/delete.');
  }
}

testInventoryAndVendors().finally(() => {
  if (prisma && typeof prisma.$disconnect === 'function') prisma.$disconnect();
});
