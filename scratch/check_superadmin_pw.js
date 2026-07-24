import prisma from '../src/config/db.js';
import bcrypt from 'bcrypt';

async function checkSuperAdminPw() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: 'superadmin@zanezion.com' }
    });

    console.log('User Record:', user);

    const matchAdmin123 = await bcrypt.compare('admin123', user.password);
    console.log('Matches "admin123"?', matchAdmin123);

    const matchAdmin = await bcrypt.compare('admin', user.password);
    console.log('Matches "admin"?', matchAdmin);

    const matchSuperadmin123 = await bcrypt.compare('superadmin123', user.password);
    console.log('Matches "superadmin123"?', matchSuperadmin123);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdminPw();
