import prisma from './src/config/db.js';

async function check() {
  const rms = await prisma.roleMenu.count();
  console.log('RoleMenus count:', rms);
  
  const sample = await prisma.roleMenu.findMany({ take: 5, include: { role: true, menu: true }});
  console.log(sample.map(s => `${s.role.name} -> ${s.menu.name}`));
}

check().finally(() => prisma.$disconnect());
