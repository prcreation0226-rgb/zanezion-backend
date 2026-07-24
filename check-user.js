import prisma from './src/config/db.js';

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'yashu@gmail.com' },
    include: { role: true }
  });
  console.log('User status in DB:', JSON.stringify(user, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
