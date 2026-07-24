import prisma from '../src/config/db.js';

async function cleanupHqPersonnelClients() {
  try {
    console.log('Finding all HQ Personnel staff users...');
    // Find all users who are staff/internal personnel
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
      select: { email: true, name: true, role: { select: { name: true } } }
    });

    const staffEmails = staffUsers.map(u => u.email).filter(Boolean);
    console.log(`Found ${staffEmails.length} staff emails.`);

    // Delete client records matching staff emails
    const deleteResult = await prisma.client.deleteMany({
      where: {
        email: {
          in: staffEmails
        }
      }
    });

    console.log(`Deleted ${deleteResult.count} client records that belonged to HQ Personnel!`);

    // Print remaining personal clients
    const remainingPersonalClients = await prisma.client.findMany({
      where: {
        clientType: { in: ['Personal', 'individual'] }
      }
    });

    console.log('\n--- Remaining Real Personal Clients ---');
    console.log(JSON.stringify(remainingPersonalClients.map(c => ({
      id: c.id,
      companyName: c.companyName,
      email: c.email,
      clientType: c.clientType,
      source: c.source
    })), null, 2));

  } catch (error) {
    console.error('Cleanup error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupHqPersonnelClients();
