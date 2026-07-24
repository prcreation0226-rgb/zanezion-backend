import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany().then(u => { console.log(u); prisma.$disconnect(); }).catch(console.error);
