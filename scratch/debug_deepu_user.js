import prisma from '../src/config/db.js';

async function debugDeepuUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'deepu@gmail.com' },
      include: { role: true }
    });

    console.log('Deepu User Record:', JSON.stringify(user, null, 2));

    const customerRole = await prisma.role.findFirst({
      where: { name: 'CUSTOMER' }
    });

    console.log('Customer Role in DB:', customerRole);
    console.log('Matches roleId?', user?.roleId === customerRole?.id);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

debugDeepuUser();
