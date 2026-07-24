import prisma from '../src/config/db.js';

async function checkDeletedAt() {
  try {
    const users = await prisma.user.findMany();
    console.log('Total users in DB:', users.length);

    const deletedUsers = users.filter(u => u.deletedAt !== null);
    console.log('Users with deletedAt NOT null:', deletedUsers.map(u => ({ id: u.id, email: u.email, deletedAt: u.deletedAt })));

    const activeAdmins = users.filter(u => u.deletedAt === null && u.roleId === 1);
    console.log('Active Super Admins (deletedAt === null):', activeAdmins.map(u => ({ id: u.id, email: u.email, status: u.status })));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDeletedAt();
