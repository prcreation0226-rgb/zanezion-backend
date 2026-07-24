import prisma from '../src/config/db.js';
import * as inventoryService from '../src/services/inventory.service.js';

async function test() {
  console.log("=== STARTING INVENTORY ISSUE & LOSS VERIFICATION TEST ===");

  // Ensure there is some stock in Nassau Main Depot (warehouseId 1, itemId 21)
  console.log("Setting initial stock for babu supari...");
  await prisma.inventoryStock.upsert({
    where: { warehouseId_itemId: { warehouseId: 1, itemId: 21 } },
    update: { quantity: 10, reservedQuantity: 0 },
    create: { warehouseId: 1, itemId: 21, quantity: 10, reservedQuantity: 0, tenantId: 1 }
  });

  const performerId = 59; // Business_client user ID
  const tenantId = 8;     // Business_client tenant ID
  const isBusinessClient = true;

  // 1. Test issueStock
  console.log("Testing issueStock as Business Client...");
  try {
    const issueResult = await inventoryService.issueStock({
      warehouseId: 1,
      itemId: 21,
      quantity: 1,
      issuedBy: 'Verification Officer',
      issuedTo: 'Verification Recipient',
      clientId: null,
      remarks: 'Test issue stock by business client'
    }, performerId, tenantId, isBusinessClient);
    console.log("SUCCESS: issueStock completed successfully! Updated stock quantity:", issueResult.quantity);
  } catch (err) {
    console.error("FAILURE: issueStock threw an error:", err.message);
  }

  // 2. Test recordLoss
  console.log("Testing recordLoss as Business Client...");
  try {
    const lossResult = await inventoryService.recordLoss({
      warehouseId: 1,
      itemId: 21,
      quantity: 1,
      lossType: 'Theft',
      explanation: 'Verification test for record loss by business client',
      reportedBy: 'Verification Reporter',
      investigationStatus: 'Pending',
      evidenceUrl: null
    }, performerId, tenantId, isBusinessClient);
    console.log("SUCCESS: recordLoss completed successfully! Loss assessment ID:", lossResult.id);
  } catch (err) {
    console.error("FAILURE: recordLoss threw an error:", err.message);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
