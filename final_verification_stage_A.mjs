import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const BASE_URL = 'http://localhost:8000/api/v1';

async function loginAndGetToken() {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zanezion.com', password: 'password123' })
  });
  const data = await res.json();
  return data.data.token;
}

async function run() {
  const token = await loginAndGetToken();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const evidence = {};

  // 1. CREATE
  const payload = {
    title: "UI Validation PR",
    departmentId: 1,
    priority: "medium",
    items: [{ itemName: "Validation Asset", quantity: 10, unit: "Boxes", estimatedCost: 50 }]
  };
  evidence.createPayload = payload;
  
  const createRes = await fetch(`${BASE_URL}/purchase-requests`, {
    method: 'POST', headers,
    body: JSON.stringify(payload)
  });
  evidence.createResponse = await createRes.json();
  const prId = evidence.createResponse.data.id;

  // 2. DATABASE VALIDATION
  const dbRecord = await prisma.purchaseRequest.findUnique({
    where: { id: prId },
    include: { items: true, department: true, requester: true }
  });
  evidence.dbInsert = dbRecord;

  // 3. READ
  const readRes = await fetch(`${BASE_URL}/purchase-requests/${prId}`, { headers });
  evidence.readResponse = await readRes.json();

  // 4. UPDATE
  const updateRes = await fetch(`${BASE_URL}/purchase-requests/${prId}`, {
    method: 'PUT', headers,
    body: JSON.stringify({
      title: "UI Validation PR - Updated",
      departmentId: 1,
      priority: "high",
      items: [{ itemName: "Validation Asset Updated", quantity: 20, unit: "Boxes", estimatedCost: 75 }]
    })
  });
  evidence.updateResponse = await updateRes.json();

  const dbUpdate = await prisma.purchaseRequest.findUnique({ where: { id: prId }, include: { items: true } });
  evidence.dbUpdate = dbUpdate;

  // 5. DELETE
  const deleteRes = await fetch(`${BASE_URL}/purchase-requests/${prId}`, { method: 'DELETE', headers });
  evidence.deleteResponse = { status: deleteRes.status, ok: deleteRes.ok };
  
  const dbDelete = await prisma.purchaseRequest.findUnique({ where: { id: prId } });
  evidence.dbDelete = dbDelete; // Should be null

  fs.writeFileSync('crud_evidence.json', JSON.stringify(evidence, null, 2));
  console.log("Validation complete");
  await prisma.$disconnect();
}

run().catch(console.error);
