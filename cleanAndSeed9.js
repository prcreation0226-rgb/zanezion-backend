import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function run() {
  console.log('Seeding 9 roles and users...');
  
  const ROLES = [
    'SUPER_ADMIN',
    'ADMIN',
    'OPERATIONS',
    'PROCUREMENT',
    'LOGISTICS',
    'INVENTORY',
    'CONCIERGE',
    'BUSINESS_CLIENT',
    'FIELD_STAFF'
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);
  let superAdminId = null;
  
  for (const roleName of ROLES) {
    let role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
       role = await prisma.role.create({
         data: { name: roleName, description: `${roleName} Role` }
       });
    }
    
    if (roleName === 'SUPER_ADMIN') {
      superAdminId = role.id;
    }
    
    const emailPrefix = roleName.toLowerCase().replace('_', '');
    const userExists = await prisma.user.findUnique({ where: { email: `${emailPrefix}@zanezion.com` } });
    if (!userExists) {
      await prisma.user.create({
        data: {
          name: `${roleName} User`,
          email: `${emailPrefix}@zanezion.com`,
          password: hashedPassword,
          roleId: role.id,
          status: 'active'
        }
      });
    }
  }
  
  // Grant SUPER_ADMIN full access to all existing menus
  if (superAdminId) {
    const menus = await prisma.menu.findMany();
    for (const menu of menus) {
      const exists = await prisma.roleMenu.findFirst({
         where: { roleId: superAdminId, menuId: menu.id }
      });
      if (!exists) {
        await prisma.roleMenu.create({
          data: {
            roleId: superAdminId,
            menuId: menu.id,
            can_view: true,
            can_add: true,
            can_edit: true,
            can_delete: true
          }
        });
      }
    }
    console.log(`Granted all permissions to SUPER_ADMIN (Role ID ${superAdminId})`);
  }
  
  console.log('Done! Created exactly 9 roles and their respective login users with password "password123".');
}

run().catch(console.error).finally(() => prisma.$disconnect());
