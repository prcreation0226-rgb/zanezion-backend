import * as clientService from '../src/services/client.service.js';
import prisma from '../src/config/db.js';
import { resolveTenantId, resolveTenantIdForSaasManagement } from '../src/utils/tenantResolver.js';

async function debugGetClients() {
  try {
    console.log('--- Testing resolveTenantIdForSaasManagement ---');

    // 1. With SUPER_ADMIN user
    const superAdminReq = {
      user: { id: 74, tenantId: 1, role: { name: 'SUPER_ADMIN' } },
      query: { clientType: 'Personal' }
    };
    const superAdminTenantId = resolveTenantIdForSaasManagement(superAdminReq);
    console.log('Super Admin tenantIdToFilter:', superAdminTenantId);
    const superAdminResult = await clientService.getClients(superAdminTenantId, superAdminReq.query);
    console.log('Super Admin Result Total:', superAdminResult.total, 'Clients count:', superAdminResult.clients.length);

    // 2. With ADMIN user
    const adminReq = {
      user: { id: 78, tenantId: 1, role: { name: 'ADMIN' } },
      query: { clientType: 'Personal' }
    };
    const adminTenantId = resolveTenantId(adminReq);
    console.log('\nADMIN tenantIdToFilter:', adminTenantId);
    const adminResult = await clientService.getClients(adminTenantId, adminReq.query);
    console.log('ADMIN Result Total:', adminResult.total, 'Clients count:', adminResult.clients.length);

    // 3. Inspect all users in DB with role SUPER_ADMIN or ADMIN
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ['SUPER_ADMIN', 'ADMIN'] }
        }
      },
      include: { role: true }
    });

    console.log('\n--- All Admin Users in DB ---');
    console.log(JSON.stringify(adminUsers.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      roleName: u.role?.name,
      tenantId: u.tenantId
    })), null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

debugGetClients();
