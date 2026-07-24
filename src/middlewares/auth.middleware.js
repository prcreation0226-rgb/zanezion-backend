import jwt from 'jsonwebtoken';
import { sendResponse } from '../utils/response.js';
import { config } from '../config/env.js';
import prisma from '../config/db.js';

const MENU_NAME_MAPPING = {
  'ORDERS': 'Orders',
  'PROJECTS': 'Projects',
  'MISSIONS': 'Missions',
  'DELIVERIES': 'Deliveries',
  'USERS': 'Personnel',
  'ROLES': 'Security',
  'PERMISSIONS': 'Security',
  'INVOICES': 'Invoices',
  'CLIENTS': 'Clients',
  'ITEMS': 'Inventory',
  'WAREHOUSES': 'Warehouses',
  'STOCK': 'Inventory',
  'GRN': 'Warehouses',
  'VENDORS': 'Vendors',
  'PURCHASE_REQUESTS': 'Purchase Requests',
  'QUOTATIONS': 'Quotes',
  'PURCHASE_ORDERS': 'Purchase Orders',
  'RFQS': 'Quotes',
  'PAYMENTS': 'Payments',
  'RECEIPTS': 'Payments',
  'PLANS': 'Plans',
  'SETTINGS': 'Settings',
  'TENANTS': 'Tenants',
  'SUBSCRIPTIONS': 'Subscriptions',
  'ORGANIZATIONS': 'Organizations',
  'DEPARTMENTS': 'Personnel',
  'DESIGNATIONS': 'Personnel',
  'EMPLOYEES': 'Personnel',
  'EMPLOYEE_DOCUMENTS': 'Personnel',
  'SUPPORT': 'Support',
  'CONCIERGE': 'Concierge',
  'TRACKING': 'Logistics',
  'PAYROLL': 'Payroll'
};

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return sendResponse(res, 401, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    // Verify user exists and fetch role
    const user = await prisma.user.findFirst({
      where: { id: decoded.id, deletedAt: null },
      include: { role: true }
    });

    if (!user) {
      return sendResponse(res, 401, 'User no longer exists');
    }

    if (user.tenantId) {
      let client = await prisma.client.findFirst({ where: { email: user.email } });
      if (!client) {
        client = await prisma.client.findFirst({ where: { tenantId: user.tenantId } });
      }
      if (client) {
        user.clientId = client.id;
        user.company_id = client.id;
      }
    }

    req.user = user;
    next();
  } catch (error) {
    return sendResponse(res, 401, 'Invalid or expired token');
  }
};

export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (!userRole || !allowedRoles.includes(userRole.name)) {
        return sendResponse(res, 403, 'Forbidden: You do not have the required role');
      }

      next();
    } catch (error) {
      return sendResponse(res, 500, 'Error authorizing user');
    }
  };
};

export const requireSuperAdmin = async (req, res, next) => {
  try {
    const roleName = req.user.role?.name || 'UNKNOWN';
    const isSuperAdmin = roleName === 'SUPER_ADMIN' || roleName === 'superadmin';

    if (!isSuperAdmin) {
      console.log(`[RBAC] Role: ${roleName} | Route: SUPER_ADMIN_ONLY | Result: DENIED`);
      return sendResponse(res, 403, 'Forbidden: Super Admin access required');
    }

    console.log(`[RBAC] Role: ${roleName} | Route: SUPER_ADMIN_ONLY | Result: ALLOWED`);
    next();
  } catch (error) {
    console.error(`[RBAC Error]`, error);
    return sendResponse(res, 500, 'Error checking permissions');
  }
};

export const checkPermission = (routeIdentifier, action) => {
  return async (req, res, next) => {
    try {
      const { roleId } = req.user;
      const roleName = req.user.role?.name || 'UNKNOWN';

      const implicitModules = ['NOTIFICATIONS', 'PROFILE', 'AUTH', 'SYSTEM'];
      if (implicitModules.includes(routeIdentifier)) {
        console.log(`[RBAC] Role: ${roleName} | Route: ${routeIdentifier} | Action: ${action} | Result: ALLOWED (Implicit)`);
        return next();
      }

      const roleNameLower = roleName.toLowerCase();
      console.log(`[RBAC] DEBUG: Role=${roleName}, Route=${routeIdentifier}, Action=${action}`);
      const isCustomer = ['business_client', 'business client', 'individual_client', 'individual client', 'unknown', 'guest', 'client', 'saas_client', 'saas client', 'customer'].includes(roleNameLower);
      if (isCustomer && action === 'READ' && ['ORDERS', 'CLIENTS', 'USERS', 'VENDORS', 'DELIVERIES', 'WAREHOUSES', 'INVOICES', 'PURCHASE_REQUESTS', 'QUOTATIONS', 'RFQS', 'PURCHASE_ORDERS', 'ITEMS', 'STOCK', 'PLANS', 'TRACKING', 'MISSIONS', 'ROUTES', 'URGENT', 'SUPPORT', 'CONCIERGE', 'ROLES', 'PROJECTS', 'DEPARTMENTS', 'DESIGNATIONS'].includes(routeIdentifier)) {
        console.log(`[RBAC] Role: ${roleName} | Route: ${routeIdentifier} | Action: READ | Result: ALLOWED (Customer Bypass)`);
        return next();
      }

      if (isCustomer && ['CREATE', 'UPDATE', 'DELETE', 'ADJUST', 'TRANSFER', 'APPROVE', 'MANAGE'].includes(action) && ['ORDERS', 'SUPPORT', 'CONCIERGE', 'DELIVERIES', 'STOCK', 'WAREHOUSES', 'PURCHASE_ORDERS', 'PURCHASE_REQUESTS', 'USERS', 'CLIENTS', 'PROJECTS', 'INVOICES', 'PAYMENTS', 'RFQS', 'QUOTATIONS'].includes(routeIdentifier)) {
        console.log(`[RBAC] Role: ${roleName} | Route: ${routeIdentifier} | Action: ${action} | Result: ALLOWED (Customer Action Bypass)`);
        return next();
      }

      const mappedMenuName = MENU_NAME_MAPPING[routeIdentifier];
      let hasAccess = false;

      if (mappedMenuName) {
        const roleMenu = await prisma.roleMenu.findFirst({
          where: {
            roleId,
            menu: { name: mappedMenuName }
          }
        });

        if (roleMenu) {
          switch (action) {
            case 'READ': hasAccess = roleMenu.can_view; break;
            case 'CREATE': hasAccess = roleMenu.can_add; break;
            case 'UPDATE': hasAccess = roleMenu.can_edit; break;
            case 'DELETE': hasAccess = roleMenu.can_delete; break;
            case 'MANAGE': hasAccess = roleMenu.can_edit || roleMenu.can_add; break;
            case 'APPROVE': hasAccess = roleMenu.can_edit; break;
            default: hasAccess = roleMenu.can_edit; break; // ADJUST, TRANSFER, ASSIGN_PERMISSIONS etc.
          }
        }
      }

      const isSuperAdmin = roleName === 'SUPER_ADMIN' || roleName === 'superadmin';

      if (!hasAccess && !isSuperAdmin) {
        // Implicit bypass for internal staff roles for core operational workflows
        const staffRoles = ['admin', 'operations', 'procurement', 'logistics', 'inventory', 'concierge', 'staff', 'saas_client', 'saas client'];
        const isStaff = staffRoles.some(r => roleName.toLowerCase().includes(r));

        const operationalRoutes = [
          'ORDERS', 'PROJECTS', 'MISSIONS', 'DELIVERIES', 'INVOICES',
          'VENDORS', 'CLIENTS', 'USERS', 'WAREHOUSES', 'ITEMS', 'STOCK', 'GRN',
          'PURCHASE_REQUESTS', 'QUOTATIONS', 'RFQS', 'PURCHASE_ORDERS',
          'TRACKING', 'ROUTES', 'URGENT', 'SUPPORT', 'CONCIERGE', 'PAYROLL'
        ];

        if (action === 'READ' && [...operationalRoutes, 'ROLES'].includes(routeIdentifier) && isStaff) {
          console.log(`[RBAC] Role: ${roleName} | Route: ${routeIdentifier} | Action: ${action} | Result: ALLOWED (Staff Lookup Bypass)`);
          return next();
        }

        if (['CREATE', 'UPDATE', 'DELETE', 'MANAGE', 'ADJUST', 'TRANSFER', 'APPROVE', 'COMPLETE'].includes(action) && operationalRoutes.includes(routeIdentifier) && isStaff) {
          console.log(`[RBAC] Role: ${roleName} | Route: ${routeIdentifier} | Action: ${action} | Result: ALLOWED (Staff Operational Bypass)`);
          return next();
        }

        console.log(`[RBAC] Role: ${roleName} | Route: ${routeIdentifier} | Mapped Menu: ${mappedMenuName || 'UNMAPPED'} | Action: ${action} | Result: DENIED`);
        return sendResponse(res, 403, 'Forbidden: Insufficient permissions for this action');
      }

      const resultStr = isSuperAdmin && !hasAccess ? 'ALLOWED (Super Admin Bypass)' : 'ALLOWED';
      console.log(`[RBAC] Role: ${roleName} | Route: ${routeIdentifier} | Mapped Menu: ${mappedMenuName || 'UNMAPPED'} | Action: ${action} | Result: ${resultStr}`);

      next();
    } catch (error) {
      console.error(`[RBAC Error]`, error);
      return sendResponse(res, 500, 'Error checking permissions');
    }
  };
};
