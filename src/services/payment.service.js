import * as paymentRepo from '../repositories/payment.repository.js';
import * as invoiceRepo from '../repositories/invoice.repository.js';
import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { logAudit } from '../utils/audit.js';

export const receivePayment = async (data, performerId, tenantId) => {
  const perfLog = [];
  const startTotal = Date.now();
  let stepStart = Date.now();

  const { invoiceId, amount, ...paymentDetails } = data;

  const [invoice, totalPaid] = await Promise.all([
    invoiceRepo.findInvoiceById(invoiceId),
    paymentRepo.getTotalPaidForInvoice(invoiceId)
  ]);
  
  perfLog.push(`Validation Fetch: ${Date.now() - stepStart}ms`);
  stepStart = Date.now();

  if (!invoice || (tenantId !== null && invoice.tenantId !== tenantId)) {
    throw new AppError('Invoice not found', 404);
  }

  // Check valid status
  if (!['draft', 'generated', 'approved', 'sent', 'partially_paid'].includes(invoice.status)) {
    throw new AppError(`Cannot receive payment for an invoice in ${invoice.status} status`, 400);
  }

  const outstandingBalance = invoice.totalAmount - totalPaid;

  // Overpayment check
  if (amount > outstandingBalance) {
    throw new AppError(`Payment amount (${amount}) exceeds outstanding balance (${outstandingBalance})`, 400);
  }

  let result;
  
  perfLog.push(`Validation Check: ${Date.now() - stepStart}ms`);
  stepStart = Date.now();

  await prisma.$transaction(async (tx) => {
    const paymentData = {
      ...paymentDetails,
      invoiceId,
      amount,
      tenantId,
      paymentDate: new Date()
    };

    const newTotalPaid = totalPaid + amount;
    const isFullyPaid = Math.abs(invoice.totalAmount - newTotalPaid) < 0.01;
    const newStatus = isFullyPaid ? 'paid' : 'partially_paid';

    // Parallelize DB updates
    const [creationResult] = await Promise.all([
      paymentRepo.createPaymentAndReceipt(tx, paymentData, tenantId),
      invoiceRepo.updateInvoiceStatus(invoiceId, newStatus, tx)
    ]);
    
    result = creationResult;
    invoice.status = newStatus;
  }, { timeout: 10000 }); // Increase timeout safely, though it should be fast now
  
  perfLog.push(`Transaction: ${Date.now() - stepStart}ms`);
  stepStart = Date.now();

  await logAudit({
    module: 'PAYMENTS',
    action: 'RECEIVE',
    description: `Received payment of ${amount} for Invoice ${invoice.invoiceNumber}. Receipt: ${result.receipt.receiptNumber}`,
    newValue: result.payment,
    performedBy: performerId
  });
  
  perfLog.push(`Audit Log: ${Date.now() - stepStart}ms`);
  console.log(`[PERFORMANCE] Payment Creation Flow: Total ${Date.now() - startTotal}ms | Steps: ${perfLog.join(' | ')}`);

  return result;
};

export const getPayments = async (tenantId, query) => {
  return await paymentRepo.findAllPayments(tenantId, query);
};

export const getReceiptById = async (id, tenantId) => {
  const receipt = await paymentRepo.findReceiptById(id, tenantId);
  if (!receipt) {
    throw new AppError('Receipt not found', 404);
  }
  return receipt;
};
