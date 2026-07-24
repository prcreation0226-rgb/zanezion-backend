import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const res = await prisma.supportTicket.create({
      data: {
        tenantId: 1,
        ticketId: "TKT-TESTING",
        title: "Test",
        clientId: 5,
        messages: [{ test: "data" }]
      }
    });
    console.log("Success", res);
  } catch(e) {
    console.log("Error", e);
  }
}

main().finally(() => prisma.$disconnect());
