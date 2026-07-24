import prisma from '../config/db.js';

export const createUser = async (data) => {
  const prismaData = { ...data };
  delete prismaData.vacation_balance;
  delete prismaData.nib_number;
  delete prismaData.employment_status;
  delete prismaData.banking_info;

  if (prismaData.birthday) {
    prismaData.birthday = new Date(prismaData.birthday);
  }

  return await prisma.user.create({ data: prismaData });
};

export const findUserByEmailAndTenant = async (email, tenantId) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  return await prisma.user.findFirst({
    where: {
      email,
      ...(tenantId !== null && { tenantId }),
      deletedAt: null
    },
    include: { role: true }
  });
};

export const findUserById = async (id) => {
  return await prisma.user.findFirst({
    where: { id, deletedAt: null },
    include: { role: true }
  });
};

export const findAllUsersByTenant = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', roleId, roleName, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } }
      ]
    }),
    ...(roleId && { roleId: Number(roleId) }),
    ...(roleName ? { role: { name: roleName } } : { role: { name: { not: 'SUPER_ADMIN' } } }),
    ...(status && { status })
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      select: {
        id: true,
        uuid: true,
        tenantId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        vacationBalance: true,
        birthday: true,
        nibNumber: true,
        employmentStatus: true,
        hasPassport: true,
        hasLicense: true,
        hasNIB: true,
        hasResume: true,
        bankingInfo: true,
        isSalaried: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.user.count({ where })
  ]);

  return { users, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateUser = async (id, data) => {
  const prismaData = { ...data };
  delete prismaData.id;
  delete prismaData.role;
  delete prismaData.vacation_balance;
  delete prismaData.nib_number;
  delete prismaData.employment_status;
  delete prismaData.banking_info;

  if (prismaData.birthday) {
    prismaData.birthday = new Date(prismaData.birthday);
  }

  return await prisma.user.update({
    where: { id },
    data: prismaData
  });
};

export const softDeleteUser = async (id) => {
  return await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
};
