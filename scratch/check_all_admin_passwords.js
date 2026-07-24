import prisma from '../src/config/db.js';
import bcrypt from 'bcrypt';

async function checkAllAdminPasswords() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ['SUPER_ADMIN', 'ADMIN'] }
        }
      },
      include: { role: true }
    });

    console.log(`Found ${admins.length} Super Admin / Admin accounts in DB:`);

    for (const admin of admins) {
      console.log(`\nEmail: ${admin.email} (ID: ${admin.id}, Role: ${admin.role.name}, Status: ${admin.status}, DeletedAt: ${admin.deletedAt})`);

      const testPasswords = ['admin123', 'admin', 'superadmin123', 'password', '123456'];
      for (const pass of testPasswords) {
        const matches = await bcrypt.compare(pass, admin.password);
        if (matches) {
          console.log(`  --> Password "${pass}" MATCHES!`);
        }
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllAdminPasswords();
