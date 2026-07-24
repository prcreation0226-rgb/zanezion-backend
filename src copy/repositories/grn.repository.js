import prisma from '../config/db.js';

const generateGRNNumber = async (tenantId) => {
  const count = await prisma.gRN.count({ where: { tenantId } });
  return `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const createGRN = async (data, items, tenantId) => {
  return await prisma.$transaction(async (tx) => {
    const grnNumber = await generateGRNNumber(tenantId);
    
    return await tx.gRN.create({
      data: {
        ...data,
        grnNumber,
        tenantId,
        items: {
          create: items.map(item => ({
            ...item,
            totalPrice: item.acceptedQuantity * item.unitPrice
          }))
        }
      },
      include: { items: true, vendor: true, warehouse: true }
    });
  });
};

export const findGRNById = async (id) => {
  return await prisma.gRN.findUnique({
    where: { id },
    include: {
      items: { include: { item: true } },
      vendor: true,
      warehouse: true,
      purchaseOrder: true,
      receiver: { select: { firstName: true, lastName: true } }
    }
  });
};

export const findAllGRNs = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, warehouseId, vendorId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { grnNumber: { contains: search } }),
    ...(status && { status }),
    ...(warehouseId && { warehouseId: Number(warehouseId) }),
    ...(vendorId && { vendorId: Number(vendorId) })
  };

  const [grns, total] = await Promise.all([
    prisma.gRN.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { companyName: true } },
        warehouse: { select: { name: true } },
        purchaseOrder: { select: { poNumber: true } }
      }
    }),
    prisma.gRN.count({ where })
  ]);

  return { grns, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateGRNStatus = async (id, status) => {
  return await prisma.gRN.update({
    where: { id },
    data: { status }
  });
};

export const deleteGRN = async (id) => {
  return await prisma.gRN.delete({ where: { id } });
};
