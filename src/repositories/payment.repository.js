import prisma from '../config/db.js';

const generateReceiptNumber = async (tx, tenantId) => {
  const count = await tx.receipt.count({ where: { tenantId } });
  return `REC-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
};

export const createPaymentAndReceipt = async (tx, paymentData, tenantId) => {
  const payment = await tx.payment.create({
    data: paymentData
  });

  const receiptNumber = await generateReceiptNumber(tx, tenantId);

  const receipt = await tx.receipt.create({
    data: {
      tenantId,
      receiptNumber,
      paymentId: payment.id,
      receiptDate: new Date(),
      amount: payment.amount
    }
  });

  return { payment, receipt };
};

export const getTotalPaidForInvoice = async (invoiceId) => {
  const agg = await prisma.payment.aggregate({
    where: { invoiceId },
    _sum: { amount: true }
  });
  return agg._sum.amount || 0;
};

export const findAllPayments = async (tenantId, query) => {
  const { page = 1, limit = 10, invoiceId, paymentMethod } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(invoiceId && { invoiceId: Number(invoiceId) }),
    ...(paymentMethod && { paymentMethod })
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: { select: { invoiceNumber: true, client: { select: { companyName: true } } } },
        receipts: { select: { receiptNumber: true } }
      }
    }),
    prisma.payment.count({ where })
  ]);

  return { payments, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const findReceiptById = async (id, tenantId) => {
  return await prisma.receipt.findFirst({
    where: {
      id,
      ...(tenantId !== null && { tenantId })
    },
    include: {
      payment: {
        include: {
          invoice: {
            include: { client: true }
          }
        }
      }
    }
  });
};
