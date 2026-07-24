import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.employee.findMany().then(console.log).finally(() => prisma.$disconnect());
