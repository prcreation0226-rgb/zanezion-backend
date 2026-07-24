import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findFirst({where:{name:'OPERATIONS User'}}).then(console.log).finally(() => prisma.$disconnect());
