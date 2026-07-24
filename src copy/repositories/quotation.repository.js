import prisma from '../config/db.js';

export const createQuotation = async (data) => {
  return await prisma.quotation.create({
    data,
    include: { vendor: true, rfq: true }
  });
};

export const findQuotationById = async (id) => {
  return await prisma.quotation.findUnique({
    where: { id },
    include: {
      vendor: true,
      rfq: { include: { purchaseRequest: true } }
    }
  });
};

export const findQuotationByRFQAndVendor = async (rfqId, vendorId) => {
  return await prisma.quotation.findFirst({
    where: { rfqId, vendorId }
  });
};

export const findAllQuotations = async (tenantId, query) => {
  const { page = 1, limit = 10, status, rfqId, vendorId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(status && { status }),
    ...(rfqId && { rfqId: Number(rfqId) }),
    ...(vendorId && { vendorId: Number(vendorId) })
  };

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: { select: { companyName: true, vendorCode: true } },
        rfq: { select: { rfqNumber: true, purchaseRequestId: true, purchaseRequest: { select: { id: true, title: true, prNumber: true } } } }
      }
    }),
    prisma.quotation.count({ where })
  ]);

  return { quotations, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateQuotationStatus = async (id, status) => {
  return await prisma.quotation.update({
    where: { id },
    data: { status }
  });
};

export const deleteQuotation = async (id) => {
  return await prisma.quotation.delete({ where: { id } });
};
