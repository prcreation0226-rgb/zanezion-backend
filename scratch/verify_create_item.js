import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import prisma from '../src/config/db.js';

async function test() {
  console.log("=== STARTING B2B CLIENT ITEM CREATION VERIFICATION ===");

  const user = await prisma.user.findUnique({
    where: { email: 'business00@gmail.com' },
    include: { role: true }
  });

  if (!user) {
    console.error("User business00@gmail.com not found!");
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.name, tenantId: user.tenantId },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  const payload = {
    name: 'B2B Client Test Item ' + Date.now(),
    categoryId: 1,
    unitId: 1,
    qty: 5,
    price: 15.00,
    warehouseId: 1,
    description: 'Created by client validation'
  };

  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("POST /items Response status:", res.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (res.status === 201) {
      console.log("SUCCESS: B2B client successfully created an item under master tenant 1!");
      // Cleanup the created item
      const createdId = data.data.id;
      if (createdId) {
         await prisma.inventoryStock.deleteMany({ where: { itemId: createdId } });
         await prisma.item.delete({ where: { id: createdId } });
         console.log("Cleanup of test item complete.");
      }
    } else {
      console.error("FAILURE: Response was not 201.");
    }
  } catch (err) {
    console.error("Error making POST request:", err.message);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
