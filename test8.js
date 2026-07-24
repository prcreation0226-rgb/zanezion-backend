import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.user.findMany({include: {role: true}}).then(u => console.log(u.map(x => ({name: x.name, role: x.role?.name})))).finally(() => prisma.$disconnect());
