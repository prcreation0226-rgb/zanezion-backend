import prisma from '../src/config/db.js';

async function inspectQwertyuioClient() {
  try {
    const client = await prisma.client.findFirst({
      where: { email: 'qwertyuio@gmail.com' }
    });

    console.log('Client qwertyuio@gmail.com record:', JSON.stringify(client, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectQwertyuioClient();
