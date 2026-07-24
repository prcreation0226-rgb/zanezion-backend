import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany({
    select: { email: true, status: true, password: true }
  });
  console.log("Users in DB:", users);
}

check().finally(() => prisma.$disconnect());
