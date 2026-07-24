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

    const res = await fetch('http://localhost:8000/api/v1/stock?limit=500', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Status Code:', res.status);
    const data = await res.json();
    console.log('Stock Items Returned:', data.data?.stock?.length || data.data?.length || data.length);
    console.log('Stock details:', (data.data?.stock || data.data || data).map(s => ({ id: s.id, itemId: s.itemId, name: s.item?.name || s.name, tenantId: s.tenantId, quantity: s.quantity })));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
})();
