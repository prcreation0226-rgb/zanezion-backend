import prisma from '../src/config/db.js';
import crypto from 'crypto';

async function syncPersonalClients() {
  try {
    console.log('Finding all CUSTOMER users missing client records...');
    const customerRole = await prisma.role.findFirst({
      where: { name: 'CUSTOMER' }
    });

    if (!customerRole) {
      console.log('No CUSTOMER role found');
      return;
    }

    const customerUsers = await prisma.user.findMany({
      where: {
        roleId: customerRole.id,
        deletedAt: null
      }
    });

    console.log(`Found ${customerUsers.length} total active CUSTOMER users.`);

    for (const user of customerUsers) {
      let client = await prisma.client.findFirst({
        where: { email: user.email }
      });

      if (!client) {
        console.log(`User ${user.email} (ID: ${user.id}) has NO client record. Syncing...`);
        let tenantId = user.tenantId;

        if (!tenantId) {
          console.log(`  Creating Organization + Tenant for ${user.email}...`);
          const personalOrg = await prisma.organization.create({
            data: {
              name: user.name || 'Personal Customer',
              email: user.email,
              phone: user.phone || ''
            }
          });

          const personalTenantCode = `PERSONAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          const personalTenant = await prisma.tenant.create({
            data: {
              organizationId: personalOrg.id,
              tenantCode: personalTenantCode,
              status: 'active'
            }
          });

          tenantId = personalTenant.id;

          await prisma.user.update({
            where: { id: user.id },
            data: { tenantId }
          });
        }

        client = await prisma.client.create({
          data: {
            tenantId,
            clientCode: `CLT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
            companyName: user.name || 'Personal Customer',
            contactPerson: user.name || 'Personal Customer',
            email: user.email,
            phone: user.phone || '',
            status: 'active',
            clientType: 'Personal',
            plan: 'Free',
            source: 'Website'
          }
        });

        console.log(`  Successfully created Personal Client for ${user.email} (Client ID: ${client.id}, Tenant ID: ${tenantId})`);
      } else {
        console.log(`User ${user.email} already has client record ID: ${client.id}`);
      }
    }

    console.log('\n--- VERIFYING ALL PERSONAL CLIENTS IN DB ---');
    const allPersonal = await prisma.client.findMany({
      where: { clientType: { in: ['Personal', 'individual'] } },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`Total Personal Clients: ${allPersonal.length}`);
    console.log(JSON.stringify(allPersonal.map((c, i) => ({
      index: i + 1,
      id: c.id,
      name: c.companyName,
      email: c.email,
      clientType: c.clientType,
      source: c.source,
      createdAt: c.createdAt
    })), null, 2));

  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await prisma.$disconnect();
  }
}

syncPersonalClients();
