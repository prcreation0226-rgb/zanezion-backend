import prisma from '../src/config/db.js';
import bcrypt from 'bcrypt';

async function resetPass() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.updateMany({
      where: { email: 'superadmin@zanezion.com' },
      data: { password: hashedPassword }
    });

    console.log('Successfully set superadmin@zanezion.com password to admin123!');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

resetPass();
