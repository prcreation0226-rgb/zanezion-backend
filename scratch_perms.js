import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const role = await prisma.role.findFirst({where:{name:'ADMIN'}});
  if (!role) {
     console.log('Role ADMIN not found');
     return;
  }
  const roleMenu = await prisma.roleMenu.findFirst({
     where:{roleId:role.id, menu:{name:'Projects'}}
  });
  console.log('RoleMenu for Projects:', roleMenu);
  
  if (!roleMenu) {
     const menu = await prisma.menu.findFirst({where:{name:'Projects'}});
     if (menu) {
         await prisma.roleMenu.create({
             data: {
                 roleId: role.id,
                 menuId: menu.id,
                 can_view: true,
                 can_add: true,
                 can_edit: true,
                 can_delete: true
             }
         });
         console.log('Created RoleMenu for ADMIN and Projects');
     } else {
         console.log('Projects menu does not exist');
     }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
