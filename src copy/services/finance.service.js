import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';

export const getPayrolls = async (tenantId, userId = null) => {
  return await prisma.payroll.findMany({
    where: { 
      tenantId,
      ...(userId && { userId: Number(userId) })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const createPayroll = async (tenantId, createdByUserId, data) => {
  const { user_id, base_salary, bonus, nib_deduction, medical_deduction, pension_deduction, savings_deduction, birthday_club, net_amount, method, payment_date, status } = data;

  const payroll = await prisma.payroll.create({
    data: {
      tenantId,
      userId: Number(user_id),
      baseSalary: Number(base_salary || 0),
      bonus: Number(bonus || 0),
      nibDeduction: Number(nib_deduction || 0),
      medicalDeduction: Number(medical_deduction || 0),
      pensionDeduction: Number(pension_deduction || 0),
      savingsDeduction: Number(savings_deduction || 0),
      birthdayClub: Number(birthday_club || 0),
      netAmount: Number(net_amount || 0),
      method: method || 'Direct Deposit',
      paymentDate: payment_date ? new Date(payment_date) : null,
      status: status || 'Pending'
    }
  });

  return payroll;
};

export const updatePayroll = async (tenantId, updatedByUserId, payrollId, data) => {
  const existing = await prisma.payroll.findFirst({
    where: { id: Number(payrollId), tenantId }
  });

  if (!existing) {
    throw new AppError('Payroll record not found', 404);
  }

  const { user_id, base_salary, bonus, nib_deduction, medical_deduction, pension_deduction, savings_deduction, birthday_club, net_amount, method, payment_date, status } = data;

  const payroll = await prisma.payroll.update({
    where: { id: Number(payrollId) },
    data: {
      ...(user_id !== undefined && { userId: Number(user_id) }),
      ...(base_salary !== undefined && { baseSalary: Number(base_salary) }),
      ...(bonus !== undefined && { bonus: Number(bonus) }),
      ...(nib_deduction !== undefined && { nibDeduction: Number(nib_deduction) }),
      ...(medical_deduction !== undefined && { medicalDeduction: Number(medical_deduction) }),
      ...(pension_deduction !== undefined && { pensionDeduction: Number(pension_deduction) }),
      ...(savings_deduction !== undefined && { savingsDeduction: Number(savings_deduction) }),
      ...(birthday_club !== undefined && { birthdayClub: Number(birthday_club) }),
      ...(net_amount !== undefined && { netAmount: Number(net_amount) }),
      ...(method !== undefined && { method }),
      ...(payment_date !== undefined && { paymentDate: payment_date ? new Date(payment_date) : null }),
      ...(status !== undefined && { status })
    }
  });

  return payroll;
};

export const deletePayroll = async (tenantId, deletedByUserId, payrollId) => {
  const existing = await prisma.payroll.findFirst({
    where: { id: Number(payrollId), tenantId }
  });

  if (!existing) {
    throw new AppError('Payroll record not found', 404);
  }

  await prisma.payroll.delete({
    where: { id: Number(payrollId) }
  });

  return true;
};
