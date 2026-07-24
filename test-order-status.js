import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const order = await prisma.order.findUnique({ where: { id: 8 } });
  console.log(order);
  process.exit(0);
})();
