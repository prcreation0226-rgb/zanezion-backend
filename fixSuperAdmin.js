import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const menus = await prisma.menu.findMany();
  for (const menu of menus) {
    await prisma.roleMenu.upsert({
      where: { roleId_menuId: { roleId: 1, menuId: menu.id } },
      update: { can_view: true, can_add: true, can_edit: true, can_delete: true },
      create: { roleId: 1, menuId: menu.id, can_view: true, can_add: true, can_edit: true, can_delete: true }
    });
  }
  console.log("Assigned all menus to roleId 1 (SUPER_ADMIN)");
}
run().finally(() => prisma.$disconnect());
