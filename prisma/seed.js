import prisma from '../src/config/db.js';
import bcrypt from 'bcrypt';

const defaultRoles = [
  'SUPER_ADMIN',
  'ADMIN',
  'PROCUREMENT',
  'OPERATIONS',
  'LOGISTICS',
  'INVENTORY',
  'CONCIERGE',
  'CLIENT',
  'STAFF',           // was FIELD_STAFF — renamed to match backend code
  'CUSTOMER',        // personal signup role
  'BUSINESS_CLIENT', // business signup role
  'SAAS_CLIENT',     // SaaS signup role
];

const defaultPermissions = [
  // User Management
  { name: 'Read Users', module: 'USERS', action: 'READ' },
  { name: 'Create Users', module: 'USERS', action: 'CREATE' },
  { name: 'Update Users', module: 'USERS', action: 'UPDATE' },
  { name: 'Delete Users', module: 'USERS', action: 'DELETE' },
  
  // Super Admin Modules
  { name: 'Manage Plans', module: 'PLANS', action: 'MANAGE' },
  { name: 'Manage Subscriptions', module: 'SUBSCRIPTIONS', action: 'MANAGE' },
  { name: 'Manage Organizations', module: 'ORGANIZATIONS', action: 'MANAGE' },
  { name: 'Manage Tenants', module: 'TENANTS', action: 'MANAGE' },
  
  // Foundation
  { name: 'Manage Roles', module: 'ROLES', action: 'MANAGE' },
  { name: 'Read Notifications', module: 'NOTIFICATIONS', action: 'READ' },
  { name: 'Update Notifications', module: 'NOTIFICATIONS', action: 'UPDATE' },
  { name: 'Manage Settings', module: 'SETTINGS', action: 'MANAGE' },
  
  // Admin Core Modules
  { name: 'Manage Departments', module: 'DEPARTMENTS', action: 'MANAGE' },
  { name: 'Manage Designations', module: 'DESIGNATIONS', action: 'MANAGE' },
  { name: 'Manage Employees', module: 'EMPLOYEES', action: 'MANAGE' },
  { name: 'Manage Vendors', module: 'VENDORS', action: 'MANAGE' },
  { name: 'Manage Documents', module: 'EMPLOYEE_DOCUMENTS', action: 'MANAGE' },
  { name: 'Verify Documents', module: 'EMPLOYEE_DOCUMENTS', action: 'VERIFY' },
  
  // Procurement Modules
  { name: 'Manage Purchase Requests', module: 'PURCHASE_REQUESTS', action: 'MANAGE' },
  { name: 'Approve Purchase Requests', module: 'PURCHASE_REQUESTS', action: 'APPROVE' },
  { name: 'Manage RFQs', module: 'RFQS', action: 'MANAGE' },
  { name: 'Manage Quotations', module: 'QUOTATIONS', action: 'MANAGE' },
  { name: 'Manage Purchase Orders', module: 'PURCHASE_ORDERS', action: 'MANAGE' },
  { name: 'Approve Purchase Orders', module: 'PURCHASE_ORDERS', action: 'APPROVE' },
  
  // Inventory Modules
  { name: 'Manage Items', module: 'ITEMS', action: 'MANAGE' },
  { name: 'Manage Warehouses', module: 'WAREHOUSES', action: 'MANAGE' },
  { name: 'Manage GRN', module: 'GRN', action: 'MANAGE' },
  { name: 'Approve GRN', module: 'GRN', action: 'APPROVE' },
  { name: 'Read Stock', module: 'STOCK', action: 'READ' },
  { name: 'Adjust Stock', module: 'STOCK', action: 'ADJUST' },
  { name: 'Transfer Stock', module: 'STOCK', action: 'TRANSFER' },

  // Clients & Orders Module (Phase 7)
  { name: 'Manage Clients', module: 'CLIENTS', action: 'MANAGE' },
  { name: 'View Clients', module: 'CLIENTS', action: 'READ' },
  { name: 'Manage Orders', module: 'ORDERS', action: 'MANAGE' },
  { name: 'View Orders', module: 'ORDERS', action: 'READ' },
  { name: 'Approve Orders', module: 'ORDERS', action: 'APPROVE' },

  // Delivery & Logistics Module (Phase 8)
  { name: 'Manage Deliveries', module: 'DELIVERIES', action: 'MANAGE' },
  { name: 'Assign Deliveries', module: 'DELIVERIES', action: 'ASSIGN' },
  { name: 'Track Deliveries', module: 'DELIVERIES', action: 'TRACK' },
  { name: 'View Deliveries', module: 'DELIVERIES', action: 'READ' },
  { name: 'Manage Missions', module: 'MISSIONS', action: 'MANAGE' },
  { name: 'Complete Missions', module: 'MISSIONS', action: 'COMPLETE' },

  // Finance, Invoices & Payments Module (Phase 9)
  { name: 'Manage Invoices', module: 'INVOICES', action: 'MANAGE' },
  { name: 'Approve Invoices', module: 'INVOICES', action: 'APPROVE' },
  { name: 'View Invoices', module: 'INVOICES', action: 'READ' },
  { name: 'Manage Payments', module: 'PAYMENTS', action: 'MANAGE' },
  { name: 'View Payments', module: 'PAYMENTS', action: 'READ' },
  { name: 'Generate Receipts', module: 'RECEIPTS', action: 'GENERATE' }
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create Default Roles
  const rolesMap = {};
  for (const roleName of defaultRoles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} Role` }
    });
    rolesMap[roleName] = role;
  }
  console.log(`✅ Created ${defaultRoles.length} Roles`);

  // 2. Create Default Permissions
  const permissionsList = [];
  for (const perm of defaultPermissions) {
    const permission = await prisma.permission.findFirst({
      where: { module: perm.module, action: perm.action }
    });
    
    if (permission) {
      permissionsList.push(permission);
    } else {
      const newPermission = await prisma.permission.create({
        data: perm
      });
      permissionsList.push(newPermission);
    }
  }
  console.log(`✅ Created ${defaultPermissions.length} Permissions`);

  // 3. Map ALL Permissions to SUPER_ADMIN
  const superAdminRole = rolesMap['SUPER_ADMIN'];
  for (const perm of permissionsList) {
    const existingMapping = await prisma.rolePermission.findFirst({
      where: { roleId: superAdminRole.id, permissionId: perm.id }
    });
    
    if (!existingMapping) {
      await prisma.rolePermission.create({
        data: {
          roleId: superAdminRole.id,
          permissionId: perm.id
        }
      });
    }
  }
  console.log(`✅ Mapped all permissions to SUPER_ADMIN`);

  // 4. Create Root Organization
  const org = await prisma.organization.upsert({
    where: { email: 'admin@zanezion.com' },
    update: {},
    create: {
      name: 'ZaneZion Global',
      email: 'admin@zanezion.com',
      phone: '+1234567890',
      status: 'active'
    }
  });

  // 5. Create Root Tenant
  const tenant = await prisma.tenant.upsert({
    where: { tenantCode: 'ZNZ-ROOT' },
    update: {},
    create: {
      organizationId: org.id,
      tenantCode: 'ZNZ-ROOT',
      status: 'active'
    }
  });
  console.log(`✅ Created Root Organization & Tenant`);

  // 6. Create Super Admin User
  const hashedPassword = await bcrypt.hash('Admin@123', 10);
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@zanezion.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@zanezion.com',
      password: hashedPassword,
      roleId: superAdminRole.id,
      tenantId: tenant.id,
      status: 'active'
    }
  });
  console.log(`✅ Created Default Super Admin (admin@zanezion.com / Admin@123)`);

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
