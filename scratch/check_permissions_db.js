import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "mysql://root:ERHffeIUyiChSeUdyJHAbRvMtUKXSlvw@reseau.proxy.rlwy.net:42055/railway"
    }
  }
});

async function main() {
  const perms = await prisma.permission.findMany();
  console.log('ALL PERMISSIONS:', perms.map(p => ({
    id: p.id,
    name: p.name,
    module: p.module,
    action: p.action
  })));
}

main().finally(() => prisma.$disconnect());
