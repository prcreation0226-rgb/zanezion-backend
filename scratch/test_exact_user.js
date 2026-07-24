import prisma from '../src/config/db.js';
import { resolveTenantIdForSaasManagement } from '../src/utils/tenantResolver.js';

async function testExactUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { id: 74 },
      include: { role: true }
    });

    console.log('User 74:', JSON.stringify(user, null, 2));

    const mockReq = {
      user: user,
      query: { clientType: 'Personal' }
    };

    const tenantId = resolveTenantIdForSaasManagement(mockReq);
    console.log('Resolved tenantIdToFilter:', tenantId);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

testExactUser();
