import prisma from '../src/config/db.js';

async function checkQwertyuio() {
  try {
    const users = await prisma.user.findMany({
      where: {
        email: { contains: 'qwertyuio' }
      }
    });

    console.log('Users matching qwertyuio:', JSON.stringify(users, null, 2));

    const clients = await prisma.client.findMany({
      where: {
        email: { contains: 'qwertyuio' }
      }
    });

    console.log('Clients matching qwertyuio:', JSON.stringify(clients, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkQwertyuio();
