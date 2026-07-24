import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'business01@gmail.com' },
      include: { role: true }
    });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    
    console.log(`Testing with user: ${user.name} (${user.email}), Tenant: ${user.tenantId}, Role: ${user.role.name}`);

    const token = jwt.sign(
      { id: user.id, email: user.email, roleId: user.roleId },
      process.env.JWT_SECRET || 'zanezion_super_secret_key_2026',
      { expiresIn: '24h' }
    );

    const res = await fetch('http://localhost:8000/api/v1/inventory', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Status Code:', res.status);
    const data = await res.json();
    console.log('Inventory Items Returned:', data.data?.length || data.length);
    console.log('Item details:', (data.data || data).slice(0, 5).map(item => ({ id: item.id, name: item.name, sku: item.sku, qty: item.qty })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
})();
