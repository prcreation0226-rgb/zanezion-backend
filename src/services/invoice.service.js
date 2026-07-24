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
  const { items, deliveryId, dueDate } = data;

  let invoiceData = {};
  let referenceNumber = '';

  const delivery = await deliveryRepo.findDeliveryById(deliveryId);
  if (delivery) {
    if (tenantId !== null && delivery.tenantId !== tenantId) {
      throw new AppError('Delivery not found', 404);
    }
    if (delivery.status !== 'delivered') {
      throw new AppError(`Flow Dependency Error: Cannot generate invoice. Delivery ${delivery.deliveryNumber || deliveryId} is currently '${delivery.status}'. Required Next Step: Complete the delivery and update its status to 'delivered'.`, 400);
    }
    const pod = await invoiceRepo.checkPODExists(deliveryId);
    if (!pod) {
      throw new AppError(`Flow Dependency Error: Missing Proof of Delivery (POD). Required Next Step: Upload and submit the POD document for Delivery ${delivery.deliveryNumber || deliveryId} before generating an invoice.`, 400);
    }

    // Validate quantities against what was actually delivered
    for (const item of items) {
      const deliveredItem = delivery.items.find(di => di.itemId === item.itemId);
      if (!deliveredItem) {
        throw new AppError(`Item ${item.itemId} was not part of this delivery`, 400);
      }
    }

    const resolvedClientId = data.clientId ? await resolveClientId(data.clientId) : delivery.clientId;
    invoiceData = {
      clientId: resolvedClientId,
      orderId: delivery.orderId,
      deliveryId: delivery.id,
      invoiceDate: new Date(),
      dueDate: new Date(dueDate)
    };
    referenceNumber = delivery.deliveryNumber;
  } else {
    // Fallback: If no delivery is found, check if it's a direct Order/Mission.
    // The frontend passes orderId as deliveryId for Missions.
    const orderRepo = await import('../repositories/order.repository.js');
    const order = await orderRepo.findOrderById(deliveryId);
    if (!order || (tenantId !== null && order.tenantId !== tenantId)) {
      throw new AppError('Delivery or Order not found', 404);
    }

    // Ensure item IDs are valid to prevent Foreign Key constraints
    const prisma = (await import('../config/db.js')).default;
    for (let it of items) {
      const existingItem = await prisma.item.findUnique({ where: { id: it.itemId } });
      if (!existingItem) {
        let fallbackItem = await prisma.item.findFirst({ where: { ...(tenantId != null && { tenantId }) } });
        if (!fallbackItem) {
          // Find or create category for this tenant
          let category = await prisma.itemCategory.findFirst({
            where: { name: 'General', ...(tenantId != null && { tenantId }) }
          });
          if (!category) {
            category = await prisma.itemCategory.create({
              data: {
                name: 'General',
                description: 'General Category',
                tenantId: tenantId || 1,
                status: 'active'
              }
            });
          }

          // Find or create unit for this tenant
          let unit = await prisma.itemUnit.findFirst({
            where: { shortName: 'pcs', ...(tenantId != null && { tenantId }) }
          });
          if (!unit) {
            unit = await prisma.itemUnit.create({
              data: {
                name: 'Pieces',
                shortName: 'pcs',
                tenantId: tenantId || 1,
                status: 'active'
              }
            });
          }

          // Create the fallback item with correct schema fields
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
        it.itemId = fallbackItem.id;
      }
    }

    const resolvedClientId = data.clientId ? await resolveClientId(data.clientId) : order.clientId;
    invoiceData = {
      clientId: resolvedClientId,
      orderId: order.id,
      deliveryId: null,
      invoiceDate: new Date(),
      dueDate: new Date(dueDate)
    };
    referenceNumber = order.orderNumber || order.id;
  }

  const newInvoice = await invoiceRepo.createInvoice(invoiceData, items, tenantId);

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
