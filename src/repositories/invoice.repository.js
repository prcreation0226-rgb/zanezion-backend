import prisma from '../config/db.js';

const generateInvoiceNumber = async (tenantId) => {
  const count = await prisma.invoice.count({ where: { tenantId } });
  return `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
};

export const createInvoice = async (data, items, tenantId) => {
  return await prisma.$transaction(async (tx) => {
    const invoiceNumber = await generateInvoiceNumber(tenantId);
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const invoiceItemsData = items.map(item => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const tax = item.tax || 0;
      const discount = item.discount || 0;
      const lineTotal = lineSubtotal + tax - discount;
      
      subtotal += lineSubtotal;
      totalTax += tax;
      totalDiscount += discount;

      return {
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tax,
        discount,
        total: lineTotal,
        tenantId
      };
    });

    const totalAmount = subtotal + totalTax - totalDiscount;

    return await tx.invoice.create({
      data: {
        ...data,
        invoiceNumber,
        tenantId,
        subtotal,
        taxAmount: totalTax,
        discountAmount: totalDiscount,
        totalAmount,
        status: 'generated',
        items: {
          create: invoiceItemsData
        }
      },
      include: { items: true, client: true, order: true, delivery: true }
    });
  });
};

export const findInvoiceById = async (id) => {
  // Support lookup by both integer primary key AND invoiceNumber string
  const numericId = Number(id);
  const where = !isNaN(numericId) && numericId > 0
    ? { id: numericId }
    : { invoiceNumber: String(id) };

  const inv = await prisma.invoice.findFirst({
    where,
    include: {
      items: { include: { item: true } },
      client: true,
      order: true,
      delivery: true,
      payments: true
    }
  });
  if (!inv) return null;
  const paidAmount = inv.payments ? inv.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  return { ...inv, paidAmount };
};

export const findAllInvoices = async (tenantId, query) => {
  const { page = 1, limit = 10, search = '', status, clientId } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(tenantId !== null && { tenantId }),
    ...(search && { invoiceNumber: { contains: search } }),
    ...(status && { status }),
    ...(clientId && { clientId: Number(clientId) })
  };

  const [invoicesData, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { companyName: true } },
        order: { select: { orderNumber: true } },
        payments: { select: { amount: true } }
      }
    }),
    prisma.invoice.count({ where })
  ]);

  const invoices = invoicesData.map(inv => {
    const paidAmount = inv.payments ? inv.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
    return { ...inv, paidAmount };
  });

  return { invoices, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

export const updateInvoiceStatus = async (id, status, tx = prisma) => {
  return await tx.invoice.update({
    where: { id },
    data: { status }
  });
};

export const checkPODExists = async (deliveryId) => {
  return await prisma.proofOfDelivery.findFirst({
    where: { deliveryId }
  });
};

export const deleteInvoice = async (id) => {
  return await prisma.$transaction(async (tx) => {
    await tx.payment.deleteMany({ where: { invoiceId: id } });
    await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
    return await tx.invoice.delete({ where: { id } });
  });
};
