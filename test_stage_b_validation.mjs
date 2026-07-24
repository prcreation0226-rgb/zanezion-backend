import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:8000/api/v1';
let token = '';

async function login() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@zanezion.com', password: 'password123' })
  });
  const data = await res.json();
  return data.data.token;
}

async function runVerification() {
  const report = [];
  try {
    token = await login();
    report.push('== STAGE B CRUD VERIFICATION ==');
    
    // Create PR for linking
    const prRes = await fetch(`${API_URL}/purchase-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        departmentId: 2,
        title: "Stage B Test Asset",
        description: "Testing RFQ Flow",
        priority: "high",
        items: [
            { itemName: "Test Asset", quantity: 1, estimatedCost: 5000, unit: "Pcs" }
        ]
      })
    });
    const prData = await prRes.json();
    if (!prRes.ok) {
        console.error("PR Error:", prData);
        process.exit(1);
    }
    const prId = prData.data.id;
    report.push(`[PR Created] ID: ${prId}`);

    // Force approve PR via Prisma to allow RFQ creation
    await prisma.purchaseRequest.update({
        where: { id: prId },
        data: { status: 'approved' }
    });

    // Get a valid Vendor ID
    let vendor = await prisma.vendor.findFirst();
    if (!vendor) {
        vendor = await prisma.vendor.create({
            data: { status: 'approved', vendorCode: 'VND-TEST-001', companyName: 'Test Company', email: 'test@example.com', phone: '1234567890', tenantId: 1 }
        });
    }
    const vendorId = vendor.id;

    // Create RFQ
    const rfqRes = await fetch(`${API_URL}/rfqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        purchaseRequestId: prId,
        vendorId: vendorId
      })
    });
    const rfqData = await rfqRes.json();
    if (!rfqRes.ok) {
        console.error("RFQ Error:", rfqData);
        process.exit(1);
    }
    const rfqId = rfqData.data.id;
    report.push(`[RFQ Created] API Response: ${JSON.stringify(rfqData)}`);

    // Get RFQs
    const getRfqsRes = await fetch(`${API_URL}/rfqs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const getRfqsData = await getRfqsRes.json();
    report.push(`[RFQ Read] Count: ${getRfqsData.data.length}`);

    // Create Quotation
    const quoRes = await fetch(`${API_URL}/quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        rfqId: rfqId,
        vendorId: vendorId,
        amount: 4500,
        remarks: "Special Discount"
      })
    });
    const quoData = await quoRes.json();
    if (!quoRes.ok) {
        console.error("Quotation Error:", quoData);
        process.exit(1);
    }
    const quoId = quoData.data.id;
    report.push(`[Quotation Created] API Response: ${JSON.stringify(quoData)}`);

    // Force approve Quotation via Prisma
    await prisma.quotation.update({
        where: { id: quoId },
        data: { status: 'approved' }
    });

    // Create Purchase Order
    const poRes = await fetch(`${API_URL}/purchase-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        vendorId: vendorId,
        purchaseRequestId: prId,
        quotationId: quoId,
        totalAmount: 4500
      })
    });
    const poData = await poRes.json();
    if (!poRes.ok) {
        console.error("PO Error:", poData);
        process.exit(1);
    }
    const poId = poData.data.id;
    report.push(`[PO Created] API Response: ${JSON.stringify(poData)}`);

    // DB Verification
    const dbRfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });
    const dbQuo = await prisma.quotation.findUnique({ where: { id: quoId } });
    const dbPo = await prisma.purchaseOrder.findUnique({ where: { id: poId } });

    report.push('\n== DB PERSISTENCE VERIFICATION ==');
    report.push(`RFQ in DB: ${dbRfq !== null} | PR ID: ${dbRfq?.purchaseRequestId}`);
    report.push(`Quotation in DB: ${dbQuo !== null} | RFQ ID: ${dbQuo?.rfqId}`);
    report.push(`PO in DB: ${dbPo !== null} | PR ID: ${dbPo?.purchaseRequestId} | Quote ID: ${dbPo?.quotationId}`);

    fs.writeFileSync('stage_b_validation_results.txt', report.join('\n'));
    console.log('Verification Complete.');
    process.exit(0);

  } catch (err) {
    console.error(err);
    fs.writeFileSync('stage_b_validation_results.txt', `ERROR: ${err.message}`);
    process.exit(1);
  }
}

runVerification();
