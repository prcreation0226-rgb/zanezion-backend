import prisma from './src/config/db.js';

const menus = [
  { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', module: 'Core' },
  { name: 'Analytics', path: '/dashboard/analytics', icon: 'Activity', module: 'Core' },
  { name: 'Clients', path: '/dashboard/clients', icon: 'Users', module: 'CRM' },
  { name: 'Vendors', path: '/dashboard/vendors', icon: 'Store', module: 'Procurement' },
  { name: 'Personnel', path: '/dashboard/users', icon: 'UserCog', module: 'HR' },
  { name: 'Audit Log', path: '/dashboard/audits', icon: 'BarChart3', module: 'System' },
  { name: 'Plans', path: '/dashboard/plans', icon: 'Globe', module: 'Settings' },
  { name: 'Settings', path: '/dashboard/settings', icon: 'Settings', module: 'Settings' },
  { name: 'Security', path: '/dashboard/roles-permissions', icon: 'ShieldCheck', module: 'Settings' },
  { name: 'Projects', path: '/dashboard/projects', icon: 'Briefcase', module: 'Operations' },
  { name: 'Orders', path: '/dashboard/orders', icon: 'ShoppingCart', module: 'Operations' },
  { name: 'Missions', path: '/dashboard/missions', icon: 'Navigation', module: 'Logistics' },
  { name: 'Deliveries', path: '/dashboard/deliveries', icon: 'Truck', module: 'Logistics' },
  { name: 'Invoices', path: '/dashboard/invoices', icon: 'FileText', module: 'Finance' },
  { name: 'Payments', path: '/dashboard/payments', icon: 'CreditCard', module: 'Finance' },
  { name: 'Purchase Requests', path: '/dashboard/purchase-requests', icon: 'ClipboardList', module: 'Procurement' },
  { name: 'Quotes', path: '/dashboard/quotes', icon: 'Box', module: 'Procurement' },
  { name: 'Purchase Orders', path: '/dashboard/purchase-orders', icon: 'FileText', module: 'Procurement' },
  { name: 'Fleet', path: '/dashboard/fleet', icon: 'Truck', module: 'Logistics' },
  { name: 'Routes', path: '/dashboard/logistics-routes', icon: 'Navigation', module: 'Logistics' },
  { name: 'Tracking', path: '/dashboard/logistics-tracking', icon: 'Activity', module: 'Logistics' },
  { name: 'Urgent', path: '/dashboard/logistics-urgent', icon: 'AlertCircle', module: 'Logistics' },
  { name: 'Inventory', path: '/dashboard/inventory', icon: 'Package', module: 'Inventory' },
  { name: 'Warehouses', path: '/dashboard/warehouses', icon: 'Store', module: 'Inventory' },
  { name: 'Alerts', path: '/dashboard/inventory-alerts', icon: 'AlertCircle', module: 'Inventory' },
  { name: 'Events', path: '/dashboard/events', icon: 'Calendar', module: 'Concierge' },
  { name: 'Guest Requests', path: '/dashboard/guest-requests', icon: 'Heart', module: 'Concierge' },
  { name: 'Luxury Items', path: '/dashboard/luxury-items', icon: 'Gift', module: 'Concierge' },
  { name: 'Access Plans', path: '/dashboard/vip-access', icon: 'ShieldCheck', module: 'Concierge' },
  { name: 'Chauffeur', path: '/dashboard/chauffeur', icon: 'Car', module: 'Concierge' },
  { name: 'Staff Terminal', path: '/dashboard/staff-terminal', icon: 'Smartphone', module: 'Staff' },
  { name: 'Assignments', path: '/dashboard?tab=assignments', icon: 'Smartphone', module: 'Staff' },
  { name: 'Field Map', path: '/dashboard?tab=map', icon: 'Map', module: 'Staff' },
  { name: 'Leave & Absence', path: '/dashboard?tab=leave', icon: 'Calendar', module: 'HR' },
  { name: 'Pay & Records', path: '/dashboard?tab=pay', icon: 'History', module: 'HR' },
  { name: 'Payroll', path: '/dashboard/payroll', icon: 'CreditCard', module: 'HR' },
  { name: 'Support', path: '/dashboard/support', icon: 'Headphones', module: 'CRM' },
  { name: 'Marketplace', path: '/dashboard/store', icon: 'ShoppingBag', module: 'Client' },
  { name: 'My Orders', path: '/dashboard/client-orders', icon: 'ShoppingCart', module: 'Client' },
  { name: 'Membership', path: '/dashboard/membership', icon: 'Sparkles', module: 'Client' }
];

async function seedMenus() {
  console.log('Upserting Menus...');
  for (const menu of menus) {
    const existing = await prisma.menu.findFirst({
      where: { path: menu.path }
    });
    
    if (existing) {
      await prisma.menu.update({
        where: { id: existing.id },
        data: menu
      });
      console.log(`Updated Menu: ${menu.name}`);
    } else {
      await prisma.menu.create({
        data: menu
      });
      console.log(`Created Menu: ${menu.name}`);
    }
  }
  console.log('Menu seeding complete.');
}

seedMenus().catch(console.error).finally(() => prisma.$disconnect());
