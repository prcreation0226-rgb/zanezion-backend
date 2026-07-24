import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STANDARD_MENUS = [
  { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'DASHBOARD' },
  { name: 'Analytics', path: '/dashboard/analytics', icon: 'Activity', module: 'ANALYTICS' },
  { name: 'Clients', path: '/dashboard/clients', icon: 'Users', module: 'CLIENTS' },
  { name: 'Vendors', path: '/dashboard/vendors', icon: 'Store', module: 'VENDORS' },
  { name: 'Staff Management', path: '/dashboard/users', icon: 'UserCog', module: 'USERS' },
  { name: 'Audit Protocol', path: '/dashboard/audits', icon: 'BarChart3', module: 'AUDITS' },
  { name: 'Plans', path: '/dashboard/plans', icon: 'Globe', module: 'PLANS' },
  { name: 'Settings', path: '/dashboard/settings', icon: 'Settings', module: 'SETTINGS' },
  { name: 'Projects', path: '/dashboard/projects', icon: 'Briefcase', module: 'PROJECTS' },
  { name: 'Orders', path: '/dashboard/orders', icon: 'ShoppingCart', module: 'ORDERS' },
  { name: 'Missions', path: '/dashboard/missions', icon: 'Navigation', module: 'MISSIONS' },
  { name: 'Deliveries', path: '/dashboard/deliveries', icon: 'Truck', module: 'DELIVERIES' },
  { name: 'Invoices', path: '/dashboard/invoices', icon: 'FileText', module: 'INVOICES' },
  { name: 'Payments', path: '/dashboard/payments', icon: 'CreditCard', module: 'PAYMENTS' },
  { name: 'Staff Terminal', path: '/dashboard/staff-terminal', icon: 'Smartphone', module: 'STAFF_TERMINAL' },
  { name: 'Leave & Absence', path: '/dashboard?tab=leave', icon: 'Calendar', module: 'LEAVE' },
  { name: 'Pay & Records', path: '/dashboard?tab=pay', icon: 'History', module: 'PAY' },
  { name: 'Purchase Requests', path: '/dashboard/purchase-requests', icon: 'ClipboardList', module: 'PURCHASE_REQUESTS' },
  { name: 'Quotes', path: '/dashboard/quotes', icon: 'Box', module: 'QUOTES' },
  { name: 'Purchase Orders', path: '/dashboard/purchase-orders', icon: 'FileText', module: 'PURCHASE_ORDERS' },
  { name: 'Fleet', path: '/dashboard/fleet', icon: 'Truck', module: 'FLEET' },
  { name: 'Logistics Routes', path: '/dashboard/logistics-routes', icon: 'Navigation', module: 'ROUTES' },
  { name: 'Tracking', path: '/dashboard/logistics-tracking', icon: 'Activity', module: 'TRACKING' },
  { name: 'Urgent', path: '/dashboard/logistics-urgent', icon: 'AlertCircle', module: 'URGENT' },
  { name: 'Inventory', path: '/dashboard/inventory', icon: 'Package', module: 'INVENTORY' },
  { name: 'Warehouses', path: '/dashboard/warehouses', icon: 'Store', module: 'WAREHOUSES' },
  { name: 'Inventory Alerts', path: '/dashboard/inventory-alerts', icon: 'AlertCircle', module: 'ALERTS' },
  { name: 'Events', path: '/dashboard/events', icon: 'Calendar', module: 'EVENTS' },
  { name: 'Guest Requests', path: '/dashboard/guest-requests', icon: 'Heart', module: 'GUESTS' },
  { name: 'Luxury Items', path: '/dashboard/luxury-items', icon: 'Gift', module: 'LUXURY' },
  { name: 'VIP Access', path: '/dashboard/vip-access', icon: 'ShieldCheck', module: 'VIP' },
  { name: 'Chauffeur', path: '/dashboard/chauffeur', icon: 'Car', module: 'CHAUFFEUR' },
  { name: 'Payroll', path: '/dashboard/payroll', icon: 'CreditCard', module: 'PAYROLL' },
  { name: 'Reports', path: '/dashboard/reports', icon: 'BarChart3', module: 'REPORTS' },
  { name: 'Support', path: '/dashboard/support-tickets', icon: 'Headphones', module: 'SUPPORT' },
  { name: 'Security Protocol', path: '/dashboard/roles-permissions', icon: 'ShieldCheck', module: 'SECURITY' },
  { name: 'Marketplace', path: '/dashboard/store', icon: 'ShoppingBag', module: 'MARKETPLACE' },
  { name: 'My Orders', path: '/dashboard/client-orders', icon: 'ShoppingCart', module: 'MY_ORDERS' },
  { name: 'Track Delivery', path: '/dashboard/track-delivery', icon: 'Truck', module: 'TRACK_DELIVERY' },
  { name: 'Membership', path: '/dashboard/membership', icon: 'Sparkles', module: 'MEMBERSHIP' }
];

async function seed() {
  console.log('Seeding menus and basic roles...');

  // 1. Seed Menus
  const dbMenus = [];
  for (const menu of STANDARD_MENUS) {
    const existing = await prisma.menu.findFirst({ where: { path: menu.path } });
    if (!existing) {
      const created = await prisma.menu.create({ data: menu });
      dbMenus.push(created);
    } else {
      // update icon or name if changed
      const updated = await prisma.menu.update({
        where: { id: existing.id },
        data: { name: menu.name, icon: menu.icon, module: menu.module }
      });
      dbMenus.push(updated);
    }
  }

  // 2. Ensure Superadmin Role Exists
  let superAdminRole = await prisma.role.findUnique({ where: { name: 'superadmin' } });
  if (!superAdminRole) {
    superAdminRole = await prisma.role.create({
      data: { name: 'superadmin', description: 'Ultimate System Administrator' }
    });
  }

  // 3. Grant Superadmin full access to all menus
  for (const menu of dbMenus) {
    await prisma.roleMenu.upsert({
      where: {
        roleId_menuId: {
          roleId: superAdminRole.id,
          menuId: menu.id
        }
      },
      update: {
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: true
      },
      create: {
        roleId: superAdminRole.id,
        menuId: menu.id,
        can_view: true,
        can_add: true,
        can_edit: true,
        can_delete: true
      }
    });
  }

  // Optional: create some other default roles if they don't exist
  const basicRoles = ['admin', 'operations', 'procurement', 'logistics', 'inventory', 'concierge', 'client', 'saas_client', 'customer', 'staff'];
  for (const r of basicRoles) {
    const exists = await prisma.role.findUnique({ where: { name: r } });
    if (!exists) {
      await prisma.role.create({ data: { name: r, description: `${r} role` } });
    }
  }

  console.log('Seeding completed successfully.');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
