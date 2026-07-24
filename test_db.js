import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.warehouse.findMany().then(console.log).finally(() => prisma.$disconnect());
