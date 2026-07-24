import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://root:ERHffeIUyiChSeUdyJHAbRvMtUKXSlvw@reseau.proxy.rlwy.net:42055/railway"
    }
  }
});

async function main() {
  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: 21 }
    });

    if (!employee) {
      console.log("Employee not found for userId 21");
      return;
    }

    console.log("EMPLOYEE:", employee.id, employee.firstName, employee.lastName);

    const missions = await prisma.mission.findMany({
      where: { assignedEmployeeId: employee.id },
      orderBy: { id: 'desc' },
      include: { delivery: true }
    });

    console.log("\nMISSIONS ASSIGNED TO D.J.:");
    for (const m of missions) {
      console.log(`ID: ${m.id}, Number: ${m.missionNumber}, Type: ${m.missionType}, Status: ${m.status}, Delivery ID: ${m.deliveryId}, Delivery Number: ${m.delivery?.deliveryNumber}, CreatedAt: ${m.createdAt}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
