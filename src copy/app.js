import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { globalErrorHandler } from './middlewares/error.middleware.js';

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "https://zanezion.kiaansoftware.com",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ZaneZion Foundation API is running smoothly',
    timestamp: new Date().toISOString()
  });
});

import authRoutes from './routes/auth.routes.js';
import { handleMockRequest } from './utils/mockApi.js';
import userRoutes from './routes/user.routes.js';
import roleRoutes from './routes/role.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import planRoutes from './routes/plan.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import departmentRoutes from './routes/department.routes.js';
import designationRoutes from './routes/designation.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import employeeDocumentRoutes from './routes/employeeDocument.routes.js';
import leaveRoutes from './routes/leave.routes.js';
import saasRoutes from './routes/saas.routes.js';

// Procurement Layer (Phase 5)
import purchaseRequestRoutes from './routes/purchaseRequest.routes.js';
import rfqRoutes from './routes/rfq.routes.js';
import quotationRoutes from './routes/quotation.routes.js';
import purchaseOrderRoutes from './routes/purchaseOrder.routes.js';

// Inventory Layer (Phase 6)
import itemCategoryRoutes from './routes/itemCategory.routes.js';
import itemUnitRoutes from './routes/itemUnit.routes.js';
import itemRoutes from './routes/item.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';
import grnRoutes from './routes/grn.routes.js';
import stockRoutes from './routes/stock.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';

// Clients & Orders Layer (Phase 7)
import clientRoutes from './routes/client.routes.js';
import orderRoutes from './routes/order.routes.js';

// Delivery, Logistics & Missions Layer (Phase 8)
import deliveryRoutes from './routes/delivery.routes.js';
import missionRoutes from './routes/mission.routes.js';

// Finance, Invoices & Payments Layer (Phase 9)
import financeRoutes from './routes/finance.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import paymentRoutes from './routes/payment.routes.js';

import dashboardRoutes from './routes/dashboard.routes.js';
import supportRoutes from './routes/support.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/plans', planRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/organizations', organizationRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/designations', designationRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/employee-documents', employeeDocumentRoutes);
app.use('/api/v1/staff/leave', leaveRoutes);
app.use('/api/v1/saas', saasRoutes);

// Register Phase 5 routes
app.use('/api/v1/purchase-requests', purchaseRequestRoutes);
app.use('/api/v1/rfqs', rfqRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/purchase-orders', purchaseOrderRoutes);

// Register Phase 6 routes
app.use('/api/v1/item-categories', itemCategoryRoutes);
app.use('/api/v1/item-units', itemUnitRoutes);
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/warehouses', warehouseRoutes);
app.use('/api/v1/grns', grnRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/inventory', inventoryRoutes);

// Register Phase 7 routes
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/orders', orderRoutes);

// Register Phase 8 routes
app.use('/api/v1/deliveries', deliveryRoutes);
app.use('/api/v1/missions', missionRoutes);
import trackingRoutes from './routes/tracking.routes.js';
import securityRoutes from './routes/security.routes.js';
app.use('/api/v1/logistics/tracking', trackingRoutes);
app.use('/api/v1/security', securityRoutes);
import routeRoutes from './routes/route.routes.js';
app.use('/api/v1/logistics/routes', routeRoutes);
import urgentRoutes from './routes/urgent.routes.js';
app.use('/api/v1/logistics/urgent', urgentRoutes);
// supportRoutes removed here since it's already imported above
import conciergeRoutes from './routes/concierge.routes.js';
app.use('/api/v1/concierge', conciergeRoutes);

// Register Phase 9 routes
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Fleet / Vehicles
app.use('/api/v1/vehicles', vehicleRoutes);

// Fallback to Mock API for unimplemented routes
app.use(async (req, res, next) => {
  try {
    const result = await handleMockRequest(req.method, req.originalUrl, req.body);
    if (result && result.data) {
      res.status(200).json(result.data);
    } else {
      res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        data: null
      });
    }
  } catch (error) {
    if (error.response && error.response.status) {
      return res.status(error.response.status).json(error.response.data);
    }
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      data: null
    });
  }
});

// Global Error Handler
app.use(globalErrorHandler);

export default app;
// Trigger restart for prisma schema
