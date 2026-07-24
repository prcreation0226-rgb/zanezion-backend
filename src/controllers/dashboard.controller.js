import { PrismaClient } from '@prisma/client';
import { sendResponse } from '../utils/response.js';
import { resolveTenantId } from '../utils/tenantResolver.js';

const prisma = new PrismaClient();

/**
 * Build revenue chart time-series data server-side based on the selected filter.
 * Returns an array of { name, revenue } objects ready for Recharts.
 */
function buildRevenueChartData(paidInvoices, revenueFilter) {
  const now = new Date();
  const dataMap = {};

  if (revenueFilter === 'Daily') {
    // Last 24 hours in 2-hour blocks
    for (let i = 0; i < 24; i += 2) {
      const hour = String(i).padStart(2, '0') + ':00';
      dataMap[hour] = 0;
    }
    paidInvoices.forEach(inv => {
      const date = new Date(inv.invoiceDate || inv.createdAt);
      if (now.getTime() - date.getTime() < 86400000) {
        const hour = Math.floor(date.getHours() / 2) * 2;
        const key = String(hour).padStart(2, '0') + ':00';
        if (dataMap[key] !== undefined) dataMap[key] += (inv.totalAmount || 0);
      }
    });
  } else if (revenueFilter === 'Weekly') {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(d => (dataMap[d] = 0));
    paidInvoices.forEach(inv => {
      const date = new Date(inv.invoiceDate || inv.createdAt);
      if (now.getTime() - date.getTime() < 7 * 86400000) {
        const day = days[date.getDay()];
        dataMap[day] += (inv.totalAmount || 0);
      }
    });
  } else if (revenueFilter === 'Monthly') {
    ['Week 1', 'Week 2', 'Week 3', 'Week 4'].forEach(w => (dataMap[w] = 0));
    paidInvoices.forEach(inv => {
      const date = new Date(inv.invoiceDate || inv.createdAt);
      if (now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear()) {
        const week = Math.min(4, Math.ceil(date.getDate() / 7));
        dataMap[`Week ${week}`] += (inv.totalAmount || 0);
      }
    });
  } else if (revenueFilter === 'Quarterly') {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const quarterMonths = [currentQuarter * 3, currentQuarter * 3 + 1, currentQuarter * 3 + 2];
    quarterMonths.forEach(m => (dataMap[monthNames[m]] = 0));
    paidInvoices.forEach(inv => {
      const date = new Date(inv.invoiceDate || inv.createdAt);
      if (date.getFullYear() === now.getFullYear() && quarterMonths.includes(date.getMonth())) {
        dataMap[monthNames[date.getMonth()]] += (inv.totalAmount || 0);
      }
    });
  } else {
    // Annual — all 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(m => (dataMap[m] = 0));
    paidInvoices.forEach(inv => {
      const date = new Date(inv.invoiceDate || inv.createdAt);
      if (now.getFullYear() === date.getFullYear()) {
        const month = months[date.getMonth()];
        dataMap[month] += (inv.totalAmount || 0);
      }
    });
  }

  return Object.keys(dataMap).map(key => ({ name: key, revenue: dataMap[key] }));
}

export const getDashboardStats = async (req, res, next) => {
  try {
    const tenantId = resolveTenantId(req);
    const filter = { tenantId };

    const revenueFilter = req.query.revenueFilter || 'Monthly';
    const filterDays = { 'Daily': 1, 'Weekly': 7, 'Monthly': 30, 'Quarterly': 90, 'Annual': 365 };
    const days = filterDays[revenueFilter] || 30;
    
    const now = new Date();
    const thresholdDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    const prevThresholdDate = new Date(thresholdDate.getTime() - (days * 24 * 60 * 60 * 1000));
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const masterFilter = { tenantId };

    const [
      activeClients,
      totalOrders,
      openOrders,
      completedOrders,
      pendingDeliveries,
      activeStaff,
      totalPersonnel,
      onlineStaff,
      fleetAvailable,
      activeProjects,
      invoices,
      stockItems,
      openTickets,
      activeEvents,
      chauffeurRequests,
      lossAssessments,
      totalSkus
    ] = await Promise.all([
      prisma.client.count({ where: { ...filter, status: 'active', clientType: 'Personal' } }),
      prisma.order.count({ where: { ...filter } }),
      prisma.order.count({ where: { ...filter, status: { notIn: ['completed', 'cancelled'] } } }),
      prisma.order.count({ where: { ...filter, status: 'completed' } }),
      prisma.delivery.count({ where: { ...filter, status: 'Pending' } }),
      prisma.user.count({ where: { ...filter, status: 'active' } }),
      prisma.user.count({ where: filter }),
      prisma.user.count({ where: { ...filter, lastLogin: { gte: last24h } } }),
      prisma.employee.count({ where: { ...masterFilter, vehicleType: { not: null }, status: 'active' } }),
      prisma.order.count({ where: { ...filter, orderType: 'Project', status: { in: ['active', 'planned', 'in_progress', 'Pending', 'In Progress'] } } }),
      prisma.invoice.findMany({ where: filter, select: { totalAmount: true, status: true, invoiceDate: true, createdAt: true } }),
      prisma.item.findMany({ where: masterFilter, select: { reorderLevel: true, price: true, inventoryStock: { select: { quantity: true } } } }),
      prisma.supportTicket.count({ where: { ...filter, status: { notIn: ['Closed', 'Resolved', 'closed', 'resolved'] } } }),
      prisma.event.count({ where: { ...filter, status: { notIn: ['Completed', 'Cancelled', 'completed', 'cancelled'] } } }),
      // Chauffeur requests — orders of type CHAUFFEUR that are not completed/cancelled
      prisma.order.count({ where: { ...filter, orderType: 'CHAUFFEUR', status: { notIn: ['completed', 'cancelled'] } } }),
      // Loss assessments — sum of quantity × item price for asset loss
      prisma.lossAssessment.findMany({
        where: filter,
        select: { quantity: true, item: { select: { price: true } } }
      }),
      // Total SKUs
      prisma.item.count({ where: masterFilter })
    ]);

    // Aggregate stock warnings and inventory value
    let inventoryValue = 0;
    let inventoryValueOnHand = 0;
    const stockWarnings = stockItems.filter(item => {
      const totalStock = item.inventoryStock.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
      inventoryValue += totalStock * (item.price || 0);
      inventoryValueOnHand += totalStock * (item.price || 0);
      return totalStock <= (item.reorderLevel || 0);
    }).length;

    // Calculate asset loss from loss assessments
    const assetLoss = lossAssessments.reduce((sum, la) => {
      return sum + ((la.quantity || 0) * (la.item?.price || 0));
    }, 0);

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

    // Orders trend (compare current period vs previous period)
    const currentPeriodOrders = await prisma.order.count({ where: { ...filter, createdAt: { gte: thresholdDate } } });
    const prevPeriodOrders = await prisma.order.count({ where: { ...filter, createdAt: { gte: prevThresholdDate, lt: thresholdDate } } });
    const ordersTrendValue = prevPeriodOrders > 0 ? ((currentPeriodOrders - prevPeriodOrders) / prevPeriodOrders * 100).toFixed(1) : (currentPeriodOrders > 0 ? 100 : 0);
    const ordersTrend = ordersTrendValue > 0 ? `+${ordersTrendValue}%` : `${ordersTrendValue}%`;

    // Build revenue chart data server-side
    const paidInvoices = invoices.filter(i => i.status === 'Paid' || i.status === 'paid');
    const revenueChartData = buildRevenueChartData(paidInvoices, revenueFilter);

    sendResponse(res, 200, 'Dashboard stats retrieved successfully', {
      activeClients,
      totalOrders,
      openOrders,
      completedOrders,
      pendingDeliveries,
      activeStaff,
      totalPersonnel,
      onlineStaff,
      fleetAvailable,
      activeProjects,
      stockWarnings,
      inventoryValue,
      inventoryValueOnHand,
      totalSkus,
      assetLoss,
      openTickets,
      activeEvents,
      chauffeurRequests,
      unpaidInvoices,
      totalRevenue,
      relevantRevenue,
      prevRevenue,
      revenueTrend,
      ordersTrend,
      revenueChartData
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardLogs = async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const filter = tenantId ? { user: { tenantId } } : {};

    const logs = await prisma.auditLog.findMany({
      where: filter,
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    sendResponse(res, 200, 'Dashboard logs retrieved successfully', logs);
  } catch (error) {
    next(error);
  }
};
