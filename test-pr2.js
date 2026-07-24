import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

(async () => {
  // Find a business client
  const user = await prisma.user.findFirst({ where: { role: { name: 'BUSINESS_CLIENT' } }, include: { role: true } });
  
  const token = jwt.sign(
    { id: user.id, email: user.email, roleId: user.roleId },
    process.env.JWT_SECRET || 'ZANEZION_SECURE_TOKEN_SECRET_9921',
    { expiresIn: '24h' }
  );

  const res1 = await fetch('http://localhost:8000/api/v1/purchase-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      connectedEntity: "",
      department: "Customer",
      departmentId: 1,
      items: [{name: "sssss", qty: 1, price: 2, itemName: "sssss", quantity: 1, estimatedCost: 2, unit: "Pieces"}],
      priority: "medium",
      requestDate: "2026-06-10",
      requestId: "REQ-248",
      requestType: "Individual",
      requester: "BUSINESS_CLIENT User",
      requester_id: 8,
      status: "Pending",
      timestamp: "2:55:50 PM",
      title: "sssss",
      todayDate: "2026-06-10",
      total: 2
    })
  });
  
  console.log('CREATE PR:', res1.status, await res1.text());

  process.exit(0);
})();
