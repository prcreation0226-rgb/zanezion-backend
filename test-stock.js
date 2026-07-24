import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

(async () => {
  // Find a business client
  const user = await prisma.user.findFirst({ where: { role: { name: 'BUSINESS_CLIENT' } }, include: { role: true } });
  console.log('Testing with User:', user.email, 'Role:', user.role.name);
  
  const token = jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId },
    process.env.JWT_SECRET || 'ZANEZION_SECURE_TOKEN_SECRET_9921',
    { expiresIn: '24h' }
  );

  const res1 = await fetch('http://localhost:8000/api/v1/stock/adjust', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      warehouseId: 3, 
      itemId: 4, 
      quantity: 2, 
      type: "DEDUCT", 
      remarks: "Issued to test"
    })
  });
  console.log('ADJUST STOCK:', res1.status, await res1.text());

  process.exit(0);
})();
