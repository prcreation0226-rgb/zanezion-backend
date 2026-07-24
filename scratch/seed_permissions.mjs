import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const MATRIX = {
  'ADMIN': ['Dashboard', 'Analytics', 'Clients', 'Vendors', 'Personnel', 'Audit Log', 'Plans', 'Settings', 'Security', 'Projects', 'Orders', 'Missions', 'Deliveries', 'Invoices', 'Payments', 'Purchase Requests', 'Quotes', 'Purchase Orders', 'Fleet', 'Routes', 'Tracking', 'Urgent', 'Inventory', 'Warehouses', 'Alerts', 'Events', 'Guest Requests', 'Luxury Items', 'Access Plans', 'Chauffeur', 'Staff Terminal', 'Assignments', 'Field Map', 'Leave & Absence', 'Pay & Records', 'Payroll', 'Support', 'Marketplace', 'My Orders', 'Membership'],
  'PROCUREMENT': ['Dashboard', 'Orders', 'Vendors', 'Purchase Requests', 'Quotes', 'Purchase Orders', 'Inventory', 'Warehouses', 'Invoices', 'Payments', 'Audit Log', 'Staff Terminal', 'Leave & Absence', 'Pay & Records'],
  'OPERATIONS': ['Dashboard', 'Analytics', 'Projects', 'Orders', 'Missions', 'Deliveries', 'Fleet', 'Routes', 'Tracking', 'Urgent', 'Invoices', 'Payments', 'Staff Terminal', 'Leave & Absence', 'Pay & Records'],
  'LOGISTICS': ['Dashboard', 'Orders', 'Missions', 'Deliveries', 'Fleet', 'Routes', 'Tracking', 'Urgent', 'Staff Terminal', 'Assignments', 'Field Map', 'Leave & Absence', 'Pay & Records'],
  'INVENTORY': ['Dashboard', 'Orders', 'Inventory', 'Warehouses', 'Alerts', 'Purchase Requests', 'Purchase Orders', 'Staff Terminal', 'Leave & Absence', 'Pay & Records'],
  'CONCIERGE': ['Dashboard', 'Orders', 'Events', 'Guest Requests', 'Luxury Items', 'Access Plans', 'Chauffeur', 'Clients', 'Staff Terminal', 'Leave & Absence', 'Pay & Records'],
  'STAFF': ['Staff Terminal', 'Assignments', 'Field Map', 'Leave & Absence', 'Pay & Records', 'Dashboard'],
  'CLIENT': ['Dashboard', 'Marketplace', 'My Orders', 'Membership', 'Support', 'Quotes', 'Invoices'],
  'BUSINESS_CLIENT': ['Dashboard', 'Marketplace', 'My Orders', 'Membership', 'Support', 'Quotes', 'Invoices', 'Projects'],
  'CUSTOMER': ['Dashboard', 'Marketplace', 'My Orders', 'Membership', 'Support'],
  'SAAS_CLIENT': ['Dashboard', 'Analytics', 'Clients', 'Settings', 'Projects', 'Orders', 'Missions', 'Deliveries', 'Fleet', 'Inventory', 'Warehouses']
};

async function seed() {
  const roles = await p.role.findMany();
  const menus = await p.menu.findMany();
  
  const menuMap = {};
  menus.forEach(m => menuMap[m.name] = m.id);

  for (const role of roles) {
    const roleName = role.name.toUpperCase();
    const targetMenus = MATRIX[roleName] || MATRIX[roleName.replace('_', ' ')] || [];
    
    if (targetMenus.length === 0) continue;

    console.log(`Setting perfect permissions for ${roleName}...`);
    
    // 1. Delete existing
    await p.roleMenu.deleteMany({ where: { roleId: role.id } });

    // 2. Insert new
    const inserts = [];
    for (const mName of targetMenus) {
      if (menuMap[mName]) {
        inserts.push({
          roleId: role.id,
          menuId: menuMap[mName],
          can_view: true,
          can_add: true,
          can_edit: true,
          can_delete: roleName === 'ADMIN'
        });
      } else {
        console.warn(`Warning: Menu "${mName}" not found for role ${roleName}`);
      }
    }
    
    if (inserts.length > 0) {
      await p.roleMenu.createMany({ data: inserts });
    }
  }

  console.log('Permissions seeded successfully!');
}

seed().catch(console.error).finally(() => p.$disconnect());
