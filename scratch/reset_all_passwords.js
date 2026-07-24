import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:XUGrYOePvFcSjLSUSYiHknUsUuYTHGcg@hopper.proxy.rlwy.net:49760/railway'
    }
  }
});

async function resetAllPasswords() {
  try {
    const hashedPassword = await bcrypt.hash('admin@123', 10);
    
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });
    
    console.log(`Found ${users.length} users. Updating all passwords to admin@123 ...`);
    
    const result = await prisma.user.updateMany({
      data: {
        password: hashedPassword
      }
    });
    
    console.log(`✅ Successfully updated ${result.count} users' passwords to admin@123`);
    
    // List all users for confirmation
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.name})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetAllPasswords();
