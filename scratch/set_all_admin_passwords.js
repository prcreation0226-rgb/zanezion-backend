import prisma from '../src/config/db.js';
import bcrypt from 'bcrypt';

async function setAllAdminPasswords() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const updated = await prisma.user.updateMany({
      where: {
        email: { in: ['superadmin@zanezion.com', 'admin@zanezion.com', 'admin@gmail.com'] }
      },
      data: {
        password: hashedPassword,
        status: 'active',
        deletedAt: null
      }
    });

    console.log(`Successfully updated ${updated.count} admin accounts to password "admin123", status "active", deletedAt null!`);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

setAllAdminPasswords();
