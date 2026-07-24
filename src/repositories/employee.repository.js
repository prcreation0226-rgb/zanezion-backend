import prisma from '../config/db.js';

export const createEmployeeWithUser = async (userData, employeeData) => {
  return await prisma.$transaction(async (tx) => {
    // Create the Foundation User
    const user = await tx.user.create({
      data: userData
    });

    // Create the Employee linked to the User
    const employee = await tx.employee.create({
      data: {
        ...employeeData,
        userId: user.id
      },
      include: {
        user: { select: { email: true, role: true } },
        department: true,
        designation: true
      }
    });

    return employee;
  });
};

export const findEmployeeById = async (id) => {
  return await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, role: true, avatar: true } },
      department: true,
      designation: true
    }
  });
};

export const findEmployeeByCodeAndTenant = async (employeeCode, tenantId) => {
  return await prisma.employee.findFirst({
    where: { 
      employeeCode, 
      ...(tenantId !== null && { tenantId }) 
    }
  });
};

export const findAllEmployees = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', departmentId, designationId, status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeCode: { contains: search } },
        { user: { email: { contains: search } } }
      ]
    }),
    ...(departmentId && { departmentId: Number(departmentId) }),
    ...(designationId && { designationId: Number(designationId) }),
    ...(status && { status })
  };

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true, avatar: true } },
        department: true,
        designation: true
      }
    }),
    prisma.employee.count({ where })
  ]);

  return { employees, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateEmployeeAndUser = async (id, userId, employeeData, userData) => {
  return await prisma.$transaction(async (tx) => {
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: userId },
        data: userData
      });
    }

    const employee = await tx.employee.update({
      where: { id },
      data: employeeData,
      include: {
        user: { select: { email: true, role: true } },
        department: true,
        designation: true
      }
    });

    return employee;
  });
};

export const deleteEmployeeAndUser = async (id, userId) => {
  return await prisma.$transaction(async (tx) => {
    await tx.employee.delete({ where: { id } });
    await tx.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() } // Soft delete foundation user
    });
    return true;
  });
};
