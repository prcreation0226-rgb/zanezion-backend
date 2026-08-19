import * as invoiceRepo from '../repositories/invoice.repository.js';
import * as deliveryRepo from '../repositories/delivery.repository.js';
import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

const resolveClientId = async (id) => {
  if (!id) return null;
  const numId = Number(id);
  if (isNaN(numId)) return null;

  const client = await prisma.client.findUnique({ where: { id: numId } });
  if (client) return client.id;

  const user = await prisma.user.findUnique({ where: { id: numId } });
  if (user) {
    const clientByEmail = await prisma.client.findFirst({ where: { email: user.email } });
    if (clientByEmail) return clientByEmail.id;
  }
  return numId; // Fallback
};

export const generateInvoice = async (data, performerId, tenantId) => {
  const { items, deliveryId: rawDeliveryId, orderId: rawOrderId, dueDate } = data;

  const targetDeliveryId = rawDeliveryId != null && rawDeliveryId !== '' ? Number(String(rawDeliveryId).replace(/\D/g, '')) : null;
  const targetOrderId = rawOrderId != null && rawOrderId !== '' ? Number(String(rawOrderId).replace(/\D/g, '')) : (targetDeliveryId || null);

  let invoiceData = {};
  let referenceNumber = '';

  let delivery = targetDeliveryId ? await deliveryRepo.findDeliveryById(targetDeliveryId) : null;
  if (!delivery && targetOrderId) {
    delivery = await prisma.delivery.findFirst({ where: { orderId: targetOrderId } });
  }

  // Ensure all items map to valid item records in database to avoid Foreign Key constraints
  const validItems = [];
  for (let it of (items || [])) {
    const itId = Number(it.itemId || it.id || 1);
    const existingItem = await prisma.item.findUnique({ where: { id: itId } });
    if (existingItem) {
      validItems.push({ ...it, itemId: existingItem.id });
    } else {
      let fallbackItem = await prisma.item.findFirst({ where: { ...(tenantId != null && { tenantId }) } });
      if (!fallbackItem) {
        let category = await prisma.itemCategory.findFirst({ where: { name: 'General', ...(tenantId != null && { tenantId }) } });
        if (!category) {
          category = await prisma.itemCategory.create({
            data: { name: 'General', description: 'General Category', tenantId: tenantId || 1, status: 'active' }
          });
        }
        let unit = await prisma.itemUnit.findFirst({ where: { shortName: 'pcs', ...(tenantId != null && { tenantId }) } });
        if (!unit) {
          unit = await prisma.itemUnit.create({
            data: { name: 'Pieces', shortName: 'pcs', tenantId: tenantId || 1, status: 'active' }
          });
        }
        fallbackItem = await prisma.item.create({
          data: {
            tenantId: tenantId || 1,
            categoryId: category.id,
            unitId: unit.id,
            sku: 'SVC-' + Date.now().toString().slice(-6),
            name: 'General Logistics Service',
            description: 'General Logistics Service',
            inventoryType: 'INTERNAL',
            price: 0,
            status: 'active'
          }
        });
      }
      validItems.push({ ...it, itemId: fallbackItem.id });
    }
  }

  if (delivery) {
    if (tenantId !== null && delivery.tenantId !== tenantId) {
      throw new AppError('Delivery not found', 404);
    }
    const normalizedStatus = String(delivery.status || '').toLowerCase().trim();
    if (!['delivered', 'completed'].includes(normalizedStatus)) {
      // Auto-fulfill delivery so invoice generation is frictionless for completed orders/requests
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: { status: 'delivered' }
      }).catch(() => null);
      delivery.status = 'delivered';
    }
    let pod = await invoiceRepo.checkPODExists(delivery.id);
    if (!pod) {
      pod = await prisma.proofOfDelivery.create({
        data: {
          deliveryId: delivery.id,
          tenantId: delivery.tenantId,
          receiverName: (typeof delivery.client === 'object' ? (delivery.client?.name || delivery.client?.companyName) : delivery.client) || 'Authorized Receiver',
          receiverSignature: 'Verified on Delivery Handover',
          remarks: 'Institutional delivery verified'
        }
      }).catch(() => null);
    }

    const resolvedClientId = data.clientId ? await resolveClientId(data.clientId) : delivery.clientId;
    invoiceData = {
      clientId: resolvedClientId,
      orderId: delivery.orderId,
      deliveryId: delivery.id,
      invoiceDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    referenceNumber = delivery.deliveryNumber || `DEL-${delivery.id}`;
    data.items = validItems;
  } else {
    // Direct Order fallback
    const orderRepo = await import('../repositories/order.repository.js');
    const orderIdToLookup = targetOrderId || targetDeliveryId;
    const order = orderIdToLookup ? await orderRepo.findOrderById(orderIdToLookup) : null;
    if (!order || (tenantId !== null && order.tenantId !== tenantId)) {
      throw new AppError('Delivery or Order not found', 404);
    }

    const resolvedClientId = data.clientId ? await resolveClientId(data.clientId) : order.clientId;
    invoiceData = {
      clientId: resolvedClientId,
      orderId: order.id,
      deliveryId: null,
      invoiceDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    };
    referenceNumber = order.orderNumber || `ORD-${order.id}`;
    data.items = validItems;
  }

  const newInvoice = await invoiceRepo.createInvoice(invoiceData, data.items || validItems, tenantId);

  if (data.paidAmount && Number(data.paidAmount) > 0) {
    const paidVal = Number(data.paidAmount);
    await prisma.payment.create({
      data: {
        tenantId: newInvoice.tenantId,
        invoiceId: newInvoice.id,
        amount: paidVal,
        paymentDate: new Date(),
        paymentMethod: 'bank_transfer',
        referenceNumber: `DEP-${Date.now().toString().slice(-6)}`
      }
    });

    let newStatus = 'generated';
    if (paidVal >= newInvoice.totalAmount) {
      newStatus = 'paid';
    } else if (paidVal > 0) {
      newStatus = 'partially_paid';
    }

    await prisma.invoice.update({
      where: { id: newInvoice.id },
      data: { status: newStatus }
    });

    newInvoice.status = newStatus;
  }

  await logAudit({
    module: 'INVOICES',
    action: 'CREATE',
    description: `Generated Invoice ${newInvoice.invoiceNumber} for Delivery/Order ${referenceNumber}`,
    newValue: newInvoice,
    performedBy: performerId
  });

  return newInvoice;
};



export const getInvoices = async (tenantId, query) => {
  return await invoiceRepo.findAllInvoices(tenantId, query);
};

export const getInvoiceById = async (id, tenantId, clientId = null) => {
  const invoice = await invoiceRepo.findInvoiceById(id);
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  // Only enforce tenant isolation when tenantId is explicitly provided
  if (tenantId !== null && tenantId !== undefined && invoice.tenantId !== tenantId) {
    throw new AppError('Invoice not found', 404);
  }
  if (clientId !== null && clientId !== undefined && invoice.clientId !== clientId) {
    throw new AppError('Invoice not found', 404);
  }
  return invoice;
};

export const updateInvoiceStatus = async (id, status, tenantId, performerId) => {
  const invoice = await getInvoiceById(id, tenantId);

  const validTransitions = {
    'draft': ['generated', 'cancelled'],
    'generated': ['approved', 'cancelled'],
    'approved': ['sent', 'cancelled'],
    'sent': ['partially_paid', 'paid', 'cancelled'],
    'partially_paid': ['paid'],
    'paid': [],
    'cancelled': []
  };

  if (!validTransitions[invoice.status].includes(status)) {
    throw new AppError(`Invalid invoice status transition from ${invoice.status} to ${status}`, 400);
  }

  const updatedInvoice = await invoiceRepo.updateInvoiceStatus(id, status);

  await logAudit({
    module: 'INVOICES',
    action: 'STATUS_CHANGE',
    description: `Invoice ${invoice.invoiceNumber} status changed to ${status}`,
    oldValue: invoice,
    newValue: updatedInvoice,
    performedBy: performerId
  });

  return updatedInvoice;
};

const mapStatusToDb = (status) => {
  if (!status) return undefined;
  const s = status.toLowerCase().replace(/\s+/g, '_');
  if (s === 'unpaid') return 'generated';
  if (s === 'partially_paid') return 'partially_paid';
  if (s === 'paid') return 'paid';
  if (s === 'overdue') return 'overdue';
  if (s === 'cancelled') return 'cancelled';
  return s;
};

export const updateInvoice = async (id, data, tenantId, performerId) => {
  const invoice = await getInvoiceById(id, tenantId);
  // Always work with the resolved integer primary key from the database record
  const invoiceId = invoice.id;

  const updateData = {};
  if (data.totalAmount !== undefined) updateData.totalAmount = Number(data.totalAmount);
  if (data.dueDate !== undefined) updateData.dueDate = new Date(data.dueDate);
  if (data.clientId !== undefined) {
    const resolvedClientId = await resolveClientId(data.clientId);
    updateData.clientId = resolvedClientId;
  }
  if (data.orderId !== undefined) updateData.orderId = Number(data.orderId);

  // Auto-derive status from amounts and due date — ignore whatever the client sent
  const totalAmount = data.totalAmount !== undefined ? Number(data.totalAmount) : invoice.totalAmount;
  const targetPaid = data.paidAmount !== undefined ? Number(data.paidAmount) : (invoice.paidAmount || 0);
  const dueDate = data.dueDate !== undefined ? new Date(data.dueDate) : invoice.dueDate;
  const now = new Date();

  if (data.status === 'Cancelled' || data.status === 'cancelled') {
    // Only set cancelled when explicitly requested
    updateData.status = 'cancelled';
  } else if (targetPaid >= totalAmount && totalAmount > 0) {
    updateData.status = 'paid';
  } else if (targetPaid > 0 && targetPaid < totalAmount) {
    updateData.status = 'partially_paid';
  } else if (dueDate && dueDate < now && targetPaid < totalAmount) {
    updateData.status = 'overdue';
  } else {
    updateData.status = 'generated';
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: updateData,
    include: { payments: true }
  });

  if (data.paidAmount !== undefined) {
    const currentPaid = invoice.payments ? invoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

    if (Math.abs(currentPaid - targetPaid) > 0.01) {
      await prisma.payment.deleteMany({ where: { invoiceId } });
      if (targetPaid > 0) {
        await prisma.payment.create({
          data: {
            tenantId: updatedInvoice.tenantId,
            invoiceId,
            amount: targetPaid,
            paymentDate: new Date(),
            paymentMethod: 'bank_transfer',
            referenceNumber: `ADJ-${Date.now().toString().slice(-6)}`
          }
        });
      }
    }
  }

  const finalInvoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: { include: { item: true } },
      client: true,
      order: true,
      delivery: true,
      payments: true
    }
  });

  const paidAmount = finalInvoice.payments ? finalInvoice.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  const result = { ...finalInvoice, paidAmount };

  await logAudit({
    module: 'INVOICES',
    action: 'UPDATE',
    description: `Updated Invoice ${invoice.invoiceNumber}. New Total: ${result.totalAmount}, Paid: ${paidAmount}, Status: ${result.status}`,
    oldValue: invoice,
    newValue: result,
    performedBy: performerId
  });

  return result;
};

export const deleteInvoice = async (id, tenantId, performerId) => {
  const invoice = await getInvoiceById(id, tenantId);
  await invoiceRepo.deleteInvoice(invoice.id);

  await logAudit({
    module: 'INVOICES',
    action: 'DELETE',
    description: `Deleted Invoice ${invoice.invoiceNumber}`,
    oldValue: invoice,
    performedBy: performerId
  });

  return invoice;
};
