import prisma from './src/config/db.js';

// Defines which menus each role can access. Empty arrays mean no explicit db mapping needed.
const roleMappings = {
  'SUPER_ADMIN': ['*'],
  'ADMIN': [
    'Dashboard', 'Analytics', 'Clients', 'Orders', 'Projects', 'Missions', 
    'Deliveries', 'Inventory', 'Personnel', 'Users', 'Invoices', 'Payments', 'Payroll', 
    'Reports', 'Support', 'Support Tickets', 'Chauffeur', 'Events', 'Guest Requests', 
    'Luxury Items', 'Vendors', 'Purchase Requests', 'Quotes', 'Purchase Orders', 
    'Fleet', 'Warehouses', 'Audit Protocol', 'Settings', 'Security Protocol', 
    'Security Incidents', 'Leave & Absence'
  ],
  'OPERATIONS': [
    'Dashboard', 'Analytics', 'Projects', 'Orders', 'Missions', 'Deliveries', 
    'Invoices', 'Payments', 'Staff Terminal', 'Leave & Absence', 'Pay & Records'
  ],
  'PROCUREMENT': [
    'Dashboard', 'Purchase Requests', 'Vendors', 'Quotes', 'Purchase Orders', 
    'Invoices', 'Audit Log', 'Leave & Absence', 'Pay & Records'
  ],
  'LOGISTICS': [
    'Dashboard', 'Missions', 'Deliveries', 'Fleet', 'Routes', 'Tracking', 
    'Urgent', 'Staff Terminal', 'Leave & Absence', 'Pay & Records'
  ],
  'INVENTORY': [
    'Dashboard', 'Inventory', 'Warehouses', 'Alerts', 'Audit Log', 
    'Staff Terminal', 'Leave & Absence', 'Pay & Records'
  ],
  'CONCIERGE': [
    'Dashboard', 'Orders', 'Events', 'Guest Requests', 'Luxury Items', 
    'Inventory', 'Access Plans', 'Chauffeur', 'Leave & Absence', 'Pay & Records'
  ],
  'BUSINESS_CLIENT': [
    'Dashboard', 'Marketplace', 'My Orders', 'Chauffeur', 'Events', 'Support'
    // Explicitly excluded: Missions
  ],
  'FIELD_STAFF': [
    'Staff Terminal', 'Assignments', 'Field Map', 'Leave & Absence', 'Pay & Records'
  ]
};

async function seedRoleMenus() {
  console.log('Upserting RoleMenus...');
  const allMenus = await prisma.menu.findMany();
  
  for (const [roleName, menuNames] of Object.entries(roleMappings)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      console.warn(`Role ${roleName} not found, skipping...`);
      continue;
    }

    const targetMenus = menuNames.includes('*') 
      ? allMenus 
      : allMenus.filter(m => menuNames.includes(m.name));

    for (const menu of targetMenus) {
      // Upsert role_menu
      const existing = await prisma.roleMenu.findFirst({
        where: { roleId: role.id, menuId: menu.id }
      });

      if (existing) {
        await prisma.roleMenu.update({
          where: { id: existing.id },
          data: {
            can_view: true,
            can_add: ['SUPER_ADMIN', 'ADMIN'].includes(roleName),
            can_edit: ['SUPER_ADMIN', 'ADMIN'].includes(roleName),
            can_delete: ['SUPER_ADMIN', 'ADMIN'].includes(roleName)
          }
        });
      } else {
        await prisma.roleMenu.create({
          data: {
            roleId: role.id,
            menuId: menu.id,
            can_view: true,
            can_add: ['SUPER_ADMIN', 'ADMIN'].includes(roleName),
            can_edit: ['SUPER_ADMIN', 'ADMIN'].includes(roleName),
            can_delete: ['SUPER_ADMIN', 'ADMIN'].includes(roleName)
          }
        });
      }
    }
    console.log(`Linked ${targetMenus.length} menus to ${roleName}`);
  }
  
  console.log('RoleMenu seeding complete.');
}

seedRoleMenus().catch(console.error).finally(() => prisma.$disconnect());
