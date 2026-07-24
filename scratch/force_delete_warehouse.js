import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceDeleteWarehouse(id) {
  try {
    const warehouseId = parseInt(id);
    console.log(`Starting force delete for warehouse ID: ${warehouseId}`);

    // Delete child records first to satisfy foreign key constraints
    
    // 1. Deliveries
    const delCount = await prisma.delivery.deleteMany({ where: { warehouseId } });
    console.log(`Deleted ${delCount.count} Deliveries`);

    // 2. Loss Assessments
    const lossCount = await prisma.lossAssessment.deleteMany({ where: { warehouseId } });
    console.log(`Deleted ${lossCount.count} Loss Assessments`);

    // 3. Stock Movements
    const movCount = await prisma.stockMovement.deleteMany({ where: { warehouseId } });
    console.log(`Deleted ${movCount.count} Stock Movements`);

    // 4. Inventory Stock
    const stockCount = await prisma.inventoryStock.deleteMany({ where: { warehouseId } });
    console.log(`Deleted ${stockCount.count} Inventory Stock records`);

    // 5. GRNs (Just in case)
    const grnCount = await prisma.gRN.deleteMany({ where: { warehouseId } });
    console.log(`Deleted ${grnCount.count} GRNs`);

    // Finally, delete the warehouse
    const deletedWarehouse = await prisma.warehouse.delete({ where: { id: warehouseId } });
    console.log(`Successfully deleted Warehouse: ${deletedWarehouse.name}`);
    
  } catch (error) {
    console.error('Error during force deletion:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceDeleteWarehouse(5);
