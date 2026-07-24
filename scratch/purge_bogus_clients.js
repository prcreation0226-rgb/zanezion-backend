import prisma from '../src/config/db.js';

async function purgeBogusClients() {
  try {
    console.log('Finding all non-customer (staff/admin) users...');
    const staffUsers = await prisma.user.findMany({
      where: {
        role: {
          name: {
            in: [
              'SUPER_ADMIN',
              'ADMIN',
              'STAFF',
              'OPERATIONS',
              'LOGISTICS',
              'INVENTORY',
              'PROCUREMENT',
              'CONCIERGE'
            ]
          }
        }
      },
      select: { email: true }
    });

    const staffEmails = staffUsers.map(u => u.email).filter(Boolean);
    console.log(`Found ${staffEmails.length} staff/admin emails:`, staffEmails);

    const deleteResult = await prisma.client.deleteMany({
      where: {
        email: {
          in: staffEmails
        }
      }
    });

    console.log(`Successfully purged ${deleteResult.count} bogus client records for staff/admin users!`);

    // Fetch and display all remaining personal clients sorted by createdAt DESC
    const remainingPersonal = await prisma.client.findMany({
      where: {
        clientType: { in: ['Personal', 'individual'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('\n--- CLEAN REMAINING PERSONAL CLIENTS (SORTED NEWEST FIRST) ---');
    console.log(JSON.stringify(remainingPersonal.map((c, i) => ({
      index: i + 1,
      id: c.id,
      name: c.companyName,
      email: c.email,
      clientType: c.clientType,
      source: c.source,
      createdAt: c.createdAt
    })), null, 2));

  } catch (err) {
    console.error('Error during purge:', err);
  } finally {
    await prisma.$disconnect();
  }
}

purgeBogusClients();
