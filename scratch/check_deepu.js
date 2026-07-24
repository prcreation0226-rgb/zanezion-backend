import prisma from '../src/config/db.js';

async function checkDeepu() {
  try {
    console.log('Checking deepu@gmail.com in User table...');
    const deepuUser = await prisma.user.findFirst({
      where: { email: 'deepu@gmail.com' },
      include: { role: true, tenant: true }
    });
    console.log('Deepu User:', JSON.stringify(deepuUser, null, 2));

    console.log('\nChecking deepu@gmail.com in Client table...');
    const deepuClient = await prisma.client.findFirst({
      where: { email: 'deepu@gmail.com' }
    });
    console.log('Deepu Client:', JSON.stringify(deepuClient, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeepu();
