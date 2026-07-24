import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    include: { role: true }
  });
  console.log('Users in DB:', users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role?.name,
    birthday: u.birthday,
    nibNumber: u.nibNumber,
    bankingInfo: u.bankingInfo,
    vacationBalance: u.vacationBalance
  })));
}

run().catch(console.error).finally(() => prisma.$disconnect());
