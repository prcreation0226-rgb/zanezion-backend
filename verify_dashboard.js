import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const [
    openOrders,
    totalPersonnel,
    stockItems,
    openTickets,
    activeEvents,
    chauffeurRequests
  ] = await Promise.all([
    prisma.order.count({ where: { status: { notIn: ['completed', 'cancelled'] } } }),
    prisma.user.count(),
    prisma.item.findMany({ select: { price: true, inventoryStock: { select: { quantity: true } } } }),
    prisma.supportTicket.count({ where: { status: { notIn: ['Closed', 'Resolved', 'closed', 'resolved'] } } }),
    prisma.event.count({ where: { status: { notIn: ['Completed', 'Cancelled', 'completed', 'cancelled'] } } }),
    prisma.order.count({ where: { orderType: 'CHAUFFEUR', status: { notIn: ['completed', 'cancelled'] } } })
  ]);

  let inventoryValue = 0;
  stockItems.forEach(item => {
    const totalStock = item.inventoryStock.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    inventoryValue += totalStock * (item.price || 0);
  });

  console.log('--- REAL DB NUMBERS ---');
  console.log(`Warehouse Assets (inventoryValue): $${(inventoryValue/1000).toFixed(1)}K`);
  console.log(`Active Operations (openOrders): ${openOrders}`);
  console.log(`Global Personnel (totalPersonnel): ${totalPersonnel}`);
  console.log(`Chauffeur Requests: ${chauffeurRequests}`);
  console.log(`Active Events: ${activeEvents}`);
  console.log(`Open Support Cases: ${openTickets}`);
  
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
