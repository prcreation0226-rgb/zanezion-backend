import prisma from '../config/db.js';

export const createVendor = async (data) => {
  return await prisma.vendor.create({ data });
};

export const findVendorById = async (id) => {
  return await prisma.vendor.findUnique({
    where: { id }
  });
};

export const findVendorByCodeAndTenant = async (vendorCode, tenantId) => {
  return await prisma.vendor.findFirst({
    where: { 
      vendorCode, 
      ...(tenantId !== null && { tenantId }) 
    }
  });
};

export const findAllVendors = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && {
      OR: [
        { companyName: { contains: search } },
        { vendorCode: { contains: search } },
        { email: { contains: search } }
      ]
    }),
    ...(status && { status })
  };

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.vendor.count({ where })
  ]);

  return { vendors, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateVendor = async (id, data) => {
  return await prisma.vendor.update({
    where: { id },
    data
  });
};

export const deleteVendor = async (id) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Delete associated GRN dependencies (StockMovements and GRNItems)
    const grns = await tx.gRN.findMany({ where: { vendorId: id }, select: { id: true } });
    if (grns.length > 0) {
      const grnIds = grns.map(g => g.id);
      await tx.stockMovement.deleteMany({ where: { referenceType: 'GRN', referenceId: { in: grnIds } } });
      await tx.gRNItem.deleteMany({ where: { grnId: { in: grnIds } } });
      await tx.gRN.deleteMany({ where: { vendorId: id } });
    }

    // 2. Delete PurchaseOrders
    await tx.purchaseOrder.deleteMany({ where: { vendorId: id } });

    // 3. Delete Quotations
    await tx.quotation.deleteMany({ where: { vendorId: id } });

    // 4. Delete RFQs
    await tx.rFQ.deleteMany({ where: { vendorId: id } });

    // 5. Finally delete the Vendor
    return await tx.vendor.delete({ where: { id } });
  });
};
