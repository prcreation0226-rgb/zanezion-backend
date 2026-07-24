import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.securityEvent.create({
    data: {
      tenantId: 1,
      eventType: 'PANIC',
      location: 'Main Warehouse - Section A',
      details: 'Test Panic Alarm Triggered',
      reporter: 'Mock User',
      status: 'Active'
    }
  });
  console.log("Mock event created!");
}

main().finally(() => prisma.$disconnect());
