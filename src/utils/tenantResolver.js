/**
 * Centralized Tenant ID Resolver for SaaS Multi-Tenant Isolation.
 *
 * RULE:
 *  - Super Admin (tenantId=1) → sees ONLY their own HQ data (tenantId=1)
 *    UNLESS they explicitly pass ?tenantId=X to drill into a specific tenant.
 *  - Everyone else → always filtered by their own req.user.tenantId.
 */
export const resolveTenantId = (req) => {
  const roleName = String(typeof req.user?.role === 'string' ? req.user.role : (req.user?.role?.name || '')).toUpperCase();
  const isSuperAdmin = roleName === 'SUPER_ADMIN' || roleName === 'SUPERADMIN' || req.user?.roleId === 1;

  if (isSuperAdmin) {
    if (req.query?.tenantId) {
      return Number(req.query.tenantId);
    }
    return req.user?.tenantId || 1;
  }

  // All other roles: strictly their own tenant
  return req.user?.tenantId || 1;
};

/**
 * Special resolver for SaaS management endpoints where Super Admin
 * NEEDS to see all tenants (e.g., SaaS Clients list, Subscriptions, Plans).
 * Returns null ONLY for Super Admin.
 */
export const resolveTenantIdForSaasManagement = (req) => {
  const roleName = String(typeof req.user?.role === 'string' ? req.user.role : (req.user?.role?.name || '')).toUpperCase();
  const isSuperAdmin = roleName === 'SUPER_ADMIN' || roleName === 'SUPERADMIN' || req.user?.roleId === 1;

  if (isSuperAdmin) {
    if (req.query?.tenantId) {
      return Number(req.query.tenantId);
    }
    return null;
  }

  return req.user?.tenantId || 1;
};

/**
 * Special resolver for operational routes (Deliveries, Missions, etc.).
 * ONLY HQ Staff / Super Admin (under tenantId: 1) have cross-tenant operational management.
 * All client accounts (SAAS_CLIENT, BUSINESS_CLIENT, CUSTOMER) and non-HQ tenant accounts
 * are strictly isolated to their own tenantId.
 */
export const resolveTenantIdForOperations = (req) => {
  const roleName = String(typeof req.user?.role === 'string' ? req.user.role : (req.user?.role?.name || '')).toUpperCase();
  const userTenant = req.user?.tenantId ? Number(req.user.tenantId) : 1;
  const isHQStaff = [
    'SUPER_ADMIN', 'SUPERADMIN', 'LOGISTICS', 'OPERATIONS', 'STAFF', 'FIELD_STAFF', 'CONCIERGE', 'SECURITY', 'DRIVER', 'ADMIN'
  ].includes(roleName) && userTenant === 1;

  if (isHQStaff) {
    if (req.query?.tenantId) {
      return Number(req.query.tenantId);
    }
    return null; // Cross-tenant visibility for central HQ operational management
  }

  // All tenant accounts, SaaS clients, Business clients, and Customers: strictly their own tenant
  return resolveTenantId(req);
};
