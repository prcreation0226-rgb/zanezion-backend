import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.findUnique({ where: { id: 7 }, include: { role: true } });
  console.log(user.role);
  process.exit(0);
})();
