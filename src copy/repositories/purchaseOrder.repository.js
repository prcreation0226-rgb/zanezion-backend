import prisma from '../config/db.js';

const generatePONumber = async (tenantId) => {
  const count = await prisma.purchaseOrder.count({ where: { tenantId } });
  return `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

export const createPurchaseOrder = async (data) => {
  const poNumber = await generatePONumber(data.tenantId);
  return await prisma.purchaseOrder.create({
    data: {
      ...data,
      poNumber
    },
    include: { vendor: true, purchaseRequest: true, quotation: true }
  });
};

export const findPurchaseOrderById = async (id) => {
  return await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      purchaseRequest: { include: { items: true, department: true } },
      quotation: true
    }
  });
};

export const findAllPurchaseOrders = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, vendorId, purchaseRequestId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { poNumber: { contains: search } }),
    ...(status && { status }),
    ...(vendorId && { vendorId: Number(vendorId) }),
    ...(purchaseRequestId && { purchaseRequestId: Number(purchaseRequestId) })
  };

  const [purchaseOrders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { companyName: true, vendorCode: true } },
        purchaseRequest: {
          select: {
            prNumber: true,
            title: true,
            items: true
          }
        }
      }
    }),
    prisma.purchaseOrder.count({ where })
  ]);

  return { purchaseOrders, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updatePurchaseOrder = async (id, data) => {
  return await prisma.purchaseOrder.update({
    where: { id },
    data,
    include: {
      vendor: true,
      purchaseRequest: { include: { items: true, department: true } },
      quotation: true
    }
  });
};

export const updatePurchaseOrderStatus = async (id, status) => {
  return await prisma.purchaseOrder.update({
    where: { id },
    data: { status }
  });
};

export const deletePurchaseOrder = async (id) => {
  return await prisma.purchaseOrder.delete({ where: { id } });
};
