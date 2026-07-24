import { PrismaClient } from '@prisma/client';
import { sendResponse } from '../utils/response.js';

const prisma = new PrismaClient();

export const getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { tenantId } : {};

    const filterDays = { 'Daily': 1, 'Weekly': 7, 'Monthly': 30, 'Quarterly': 90, 'Annual': 365 };
    const days = filterDays[req.query.revenueFilter] || 30;
    
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const prevThresholdDate = new Date(thresholdDate.getTime() - (days * 24 * 60 * 60 * 1000));

    const [
      activeClients,
      totalOrders,
      openOrders,
      completedOrders,
      pendingDeliveries,
      activeStaff,
      fleetAvailable,
      activeProjects,
      invoices,
      stockItems
    ] = await Promise.all([
      prisma.client.count({ where: { ...filter, status: 'active' } }),
      prisma.order.count({ where: { ...filter } }),
      prisma.order.count({ where: { ...filter, status: { notIn: ['completed', 'cancelled'] } } }),
      prisma.order.count({ where: { ...filter, status: 'completed' } }),
      prisma.delivery.count({ where: { ...filter, status: 'Pending' } }),
      prisma.user.count({ where: { ...filter, status: 'active' } }),
      prisma.employee.count({ where: { ...filter, vehicleType: { not: null }, status: 'active' } }),
      prisma.order.count({ where: { ...filter, orderType: 'Project', status: { in: ['active', 'planned', 'in_progress', 'Pending', 'In Progress'] } } }),
      prisma.invoice.findMany({ where: filter, select: { totalAmount: true, status: true, invoiceDate: true, createdAt: true } }),
      prisma.item.findMany({ where: filter, select: { reorderLevel: true, inventoryStock: { select: { quantity: true } } } })
    ]);

    // Aggregate stock warnings
    const stockWarnings = stockItems.filter(item => {
      const totalStock = item.inventoryStock.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
      return totalStock <= (item.reorderLevel || 0);
    }).length;

    // Aggregate invoices
    const unpaidInvoices = invoices.filter(inv => inv.status !== 'Paid' && inv.status !== 'paid').length;
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    // Revenue Trends
    const relevantRevenue = invoices
      .filter(i => new Date(i.invoiceDate || i.createdAt) >= thresholdDate && (i.status === 'Paid' || i.status === 'paid'))
      .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    const prevRevenue = invoices
      .filter(i => {
         const d = new Date(i.invoiceDate || i.createdAt);
         return d >= prevThresholdDate && d < thresholdDate && (i.status === 'Paid' || i.status === 'paid');
      })
      .reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    const revenueTrendValue = prevRevenue > 0 ? ((relevantRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : (relevantRevenue > 0 ? 100 : 0);
    const revenueTrend = revenueTrendValue > 0 ? `+${revenueTrendValue}%` : `${revenueTrendValue}%`;

    sendResponse(res, 200, 'Dashboard stats retrieved successfully', {
      activeClients,
      totalOrders,
      openOrders,
      completedOrders,
      pendingDeliveries,
      activeStaff,
      fleetAvailable,
      activeProjects,
      stockWarnings,
      unpaidInvoices,
      totalRevenue,
      relevantRevenue,
      prevRevenue,
      revenueTrend,
      activeEvents: 0
    });
  } catch (error) {
    next(error);
  }
};
