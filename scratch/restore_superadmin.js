import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const role = await prisma.role.findFirst({
    where: { name: 'SUPER_ADMIN' }
  });

  if (!role) {
    console.log("SUPER_ADMIN role not found!");
    return;
  }

  const hashedPassword = await bcrypt.hash('12345678', 10);

  const user = await prisma.user.upsert({
    where: { email: 'superadmin@zanezion.com' },
    update: {
      password: hashedPassword,
      roleId: role.id,
      status: 'Active',
      deletedAt: null
    },
    create: {
      name: 'Super Admin',
      email: 'superadmin@zanezion.com',
      password: hashedPassword,
      roleId: role.id,
      tenantId: 1,
      status: 'Active'
    }
  });

  console.log('Super Admin restored successfully:', user.email);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
