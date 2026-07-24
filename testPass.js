import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findFirst({ where: { email: 'superadmin@zanezion.com' } });
  const isMatch = await bcrypt.compare('password123', user.password);
  console.log("Does password123 match?", isMatch);
}
check().finally(() => prisma.$disconnect());
