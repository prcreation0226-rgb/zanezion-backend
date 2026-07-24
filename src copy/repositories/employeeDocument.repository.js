import prisma from '../config/db.js';

export const createDocument = async (data) => {
  return await prisma.employeeDocument.create({ data });
};

export const findDocumentById = async (id) => {
  return await prisma.employeeDocument.findUnique({
    where: { id },
    include: { employee: true }
  });
};

export const findAllDocuments = async (tenantId, query) => {
  const { page = 1, limit = 10, employeeId, verificationStatus, documentType } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(employeeId && { employeeId: Number(employeeId) }),
    ...(verificationStatus && { verificationStatus }),
    ...(documentType && { documentType })
  };

  const [documents, total] = await Promise.all([
    prisma.employeeDocument.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } }
    }),
    prisma.employeeDocument.count({ where })
  ]);

  return { documents, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateDocument = async (id, data) => {
  return await prisma.employeeDocument.update({
    where: { id },
    data
  });
};

export const deleteDocument = async (id) => {
  return await prisma.employeeDocument.delete({ where: { id } });
};
