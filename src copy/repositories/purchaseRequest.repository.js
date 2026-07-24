import prisma from '../config/db.js';

const generatePRNumber = async (tenantId) => {
  const safeTenantId = tenantId || 1;
  const count = await prisma.purchaseRequest.count({ where: { tenantId: safeTenantId } });
  return `PR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const createPurchaseRequest = async (data, items, tenantId) => {
  const safeTenantId = tenantId || 1;
  return await prisma.$transaction(async (tx) => {
    const prNumber = await generatePRNumber(safeTenantId);
    
    return await tx.purchaseRequest.create({
      data: {
        ...data,
        prNumber,
        tenantId: safeTenantId,
        items: {
          create: items
        }
      },
      include: { items: true }
    });
  });
};

export const findPurchaseRequestById = async (id) => {
  return await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      items: true,
      department: true,
      requester: { select: { id: true, firstName: true, lastName: true, employeeCode: true } }
    }
  });
};

export const findAllPurchaseRequests = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, departmentId, requestedBy } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && {
      OR: [
        { prNumber: { contains: search } },
        { title: { contains: search } }
      ]
    }),
    ...(status && { status }),
    ...(departmentId && { departmentId: Number(departmentId) }),
    ...(requestedBy && { requestedBy: Number(requestedBy) })
  };

  const [purchaseRequests, total] = await Promise.all([
    prisma.purchaseRequest.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { name: true } },
        requester: { select: { id: true, firstName: true, lastName: true } },
        items: true
      }
    }),
    prisma.purchaseRequest.count({ where })
  ]);

  return { purchaseRequests, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updatePurchaseRequest = async (id, data, items) => {
  return await prisma.$transaction(async (tx) => {
    const updatedPr = await tx.purchaseRequest.update({
      where: { id },
      data
    });

    if (items && items.length > 0) {
      // Delete existing items
      await tx.purchaseRequestItem.deleteMany({ where: { purchaseRequestId: id } });
      // Insert new items
      await tx.purchaseRequestItem.createMany({
        data: items.map(item => ({ ...item, purchaseRequestId: id }))
      });
    }

    return await tx.purchaseRequest.findUnique({
      where: { id },
      include: { items: true }
    });
  });
};

export const updatePurchaseRequestStatus = async (id, status) => {
  return await prisma.purchaseRequest.update({
    where: { id },
    data: { status }
  });
};

export const deletePurchaseRequest = async (id) => {
  return await prisma.purchaseRequest.delete({ where: { id } });
};
