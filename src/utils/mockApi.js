global.__mockDB__ = global.__mockDB__ || {};
import { 
  USERS, CLIENTS, VENDORS, INVENTORY, INVOICES, ACCESS_PLANS, EVENTS, LOGISTICS_DATA 
} from './data.js';

export const API_BASE_URL = 'http://localhost:3000/api/v1';
export const BACKEND_ORIGIN = 'http://localhost:3000';

export const toAbsoluteImageUrl = (rawPath) => {
  if (!rawPath) return null;
  if (typeof rawPath === 'object' && rawPath != null && typeof rawPath.url === 'string') {
    return toAbsoluteImageUrl(rawPath.url);
  }
  if (typeof rawPath !== 'string') return null;
  const trimmed = rawPath.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http') || trimmed.startsWith('data:')) return trimmed;
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/\\/g, '/')}`;
  return `${BACKEND_ORIGIN}${path}`;
};

// ==========================================
// LOCAL STORAGE MOCK DATABASE INITIALIZER
// ==========================================
const DB_PREFIX = "zz_demo_db_";

const defaultUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', role: 'operations', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '123-456-7891', role: 'procurement', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '123-456-7892', role: 'logistics', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '123-456-7893', role: 'inventory', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', phone: '123-456-7894', role: 'concierge', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  // Default login users
  { id: 10, name: 'Super Admin', email: 'admin@zanezion.com', phone: '111-222-3333', role: 'superadmin', status: 'active', vacation_balance: 20, vacationBalance: 20 },
  { id: 11, name: 'Admin User', email: 'admin@example.com', phone: '111-222-3334', role: 'admin', status: 'active', vacation_balance: 20, vacationBalance: 20 },
  { id: 12, name: 'Procurement User', email: 'procurement@example.com', phone: '111-222-3335', role: 'procurement', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 13, name: 'Operations User', email: 'operation@example.com', phone: '111-222-3336', role: 'operations', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 14, name: 'Logistics User', email: 'logistics@example.com', phone: '111-222-3337', role: 'logistics', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 15, name: 'Inventory User', email: 'inventory@example.com', phone: '111-222-3338', role: 'inventory', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 16, name: 'Concierge User', email: 'concierge@example.com', phone: '111-222-3339', role: 'concierge', status: 'active', vacation_balance: 15, vacationBalance: 15 },
  { id: 17, name: 'Customer One', email: 'customer1@example.com', phone: '111-222-3340', role: 'client', status: 'active', client_id: 1, vacation_balance: 15, vacationBalance: 15 },
  { id: 18, name: 'Staff User', email: 'staff@example.com', phone: '111-222-3341', role: 'staff', status: 'active', vacation_balance: 12, vacationBalance: 12 }
];

const defaultClients = CLIENTS || [];
const defaultVendors = [
  { id: 1, name: 'Caribbean Fine Provisions', contact_name: 'Mike Johnson', email: 'mike@cfp.com', phone: '123-456-7895', status: 'active', rating: 97, delivery: 94 },
  { id: 2, name: 'Nassau Wine & Spirits', contact_name: 'Sarah Lee', email: 'sarah@nws.com', phone: '123-456-7896', status: 'active', rating: 95, delivery: 91 },
  { id: 3, name: 'Bahamas Marine Tech', contact_name: 'David Bain', email: 'david@bmt.com', phone: '123-456-7897', status: 'active', rating: 89, delivery: 96 },
  { id: 4, name: 'Island Linen & Hospitality', contact_name: 'Julia Carey', email: 'julia@ilh.com', phone: '123-456-7898', status: 'active', rating: 93, delivery: 90 },
  { id: 5, name: 'Tropical Blooms & Floral', contact_name: 'Rose Moss', email: 'rose@tbf.com', phone: '123-456-7899', status: 'active', rating: 88, delivery: 85 }
];

const defaultInventory = INVENTORY.map((item, idx) => ({
  ...item,
  qty: item.quantity || 10,
  quantity: item.quantity || 10,
  status: item.quantity < 5 ? 'Warning' : 'Stable'
})) || [];

const defaultInvoices = INVOICES.map((inv) => ({
  ...inv,
  total: inv.amount || 1000,
  createdAt: inv.date || new Date().toISOString().split('T')[0]
})) || [];

const defaultPlans = ACCESS_PLANS || [];
const defaultEvents = EVENTS || [];
const defaultVehicles = LOGISTICS_DATA.map((v) => ({
  id: v.vehicle || `Van-${Math.floor(10 + Math.random() * 90)}`,
  driver: v.driver,
  vehicleId: v.vehicle || `Van-${Math.floor(10 + Math.random() * 90)}`,
  model: v.type === 'Truck' ? 'Ford Transit Cargo' : 'Contender 39ST Yacht',
  type: v.type || 'Truck',
  status: v.status || 'Active',
  diagnosticStatus: 'Healthy',
  battery: 95,
  engineTemp: 85
}));

const defaultOrders = [
  { id: 'ORD-001', client: 'Goldwynn Residences', clientId: 1, product: 'Premium Champagne & Spirits', items: [{name: 'Champagne', qty: 6}], status: 'Delivered', deliveryTime: '09:15 AM', total: 1200, address: 'Cable Beach, Nassau', phone: '123-456-7890' },
  { id: 'ORD-002', client: 'SY Azure', clientId: 2, product: 'Fresh Seafood & Provisions', items: [{name: 'Seafood', qty: 15}], status: 'On Way', deliveryTime: '11:30 AM', total: 750, address: 'Nassau Harbour', phone: '123-456-7891' },
  { id: 'ORD-003', client: 'Lyford Cay Estate', clientId: 3, product: 'Egyptian Cotton Linens', items: [{name: 'Linens', qty: 10}], status: 'Preparing', deliveryTime: '02:00 PM', total: 500, address: 'Lyford Cay, Nassau', phone: '123-456-7892' }
];

const defaultRoutes = [
  { id: 1, name: "Nassau Hub → Goldwynn Residences", type: "Land", dist: "8.5", time: "15", status: "Active" },
  { id: 2, name: "Potters Cay → Blue Lagoon Island", type: "Sea", dist: "12.0", time: "30", status: "Active" },
  { id: 3, name: "Nassau Hub → Lyford Cay Estate", type: "Land", dist: "24.5", time: "40", status: "Active" }
];

const defaultMissions = [
  { id: "MIS-001", name: "Goldwynn Provisioning", vehicleId: "Van-01", routeId: 1, driver: "Jaheem Brown", status: "Active", progress: 65, tasks: [{ name: "Load vehicle", done: true }, { name: "Transit", done: true }, { name: "Delivery signature", done: false }] },
  { id: "MIS-002", name: "Blue Lagoon Wedding logistics", vehicleId: "Vessel-02", routeId: 2, driver: "Devon Williams", status: "Active", progress: 40, tasks: [{ name: "Load marine cargo", done: true }, { name: "Sea transit", done: false }, { name: "Offload Salt Cay", done: false }] }
];

const defaultDeliveries = [
  { id: "DEL-001", orderId: "ORD-001", vehicleId: "Van-01", driver: "Jaheem Brown", status: "Delivered", eta: "09:15 AM" },
  { id: "DEL-002", orderId: "ORD-002", vehicleId: "Vessel-02", driver: "Devon Williams", status: "In Transit", eta: "11:30 AM" },
  { id: "DEL-003", orderId: "ORD-003", vehicleId: null, driver: null, status: "Pending", eta: "02:00 PM" },
  { id: "DEL-004", orderId: "ORD-003", vehicleId: null, driver: null, status: "Pending Pickup", eta: "03:30 PM" }
];

const defaultPurchaseRequests = [
  { id: "PR-001", item: "Dom Perignon Champagne", qty: 24, price: 180, total: 4320, category: "Beverage", status: "Approved", requester: "Jane Smith", date: "2026-06-01" },
  { id: "PR-002", item: "Egyptian Cotton Sheets", qty: 50, price: 35, total: 1750, category: "Home", status: "Pending", requester: "John Doe", date: "2026-06-03" }
];

const defaultQuotes = [
  { id: "Q-001", requestId: "PR-001", vendorName: "Nassau Wine & Spirits", price: 180, total: 4320, deliveryTime: "2 Days", status: "Approved" },
  { id: "Q-002", requestId: "PR-001", vendorName: "Caribbean Fine Provisions", price: 195, total: 4680, deliveryTime: "3 Days", status: "Pending" }
];

const defaultPurchaseOrders = [
  { id: "PO-001", requestId: "PR-001", quoteId: "Q-001", vendorName: "Nassau Wine & Spirits", total: 4320, status: "Issued", date: "2026-06-02" }
];

const defaultWarehouses = [
  { id: 1, name: "Main Warehouse", location: "Nassau Airport Area", capacity: 5000, volume: 3200, status: "Active" },
  { id: 2, name: "Cold Storage Facility", location: "Potters Cay Dock", capacity: 2000, volume: 1500, status: "Active" }
];

const defaultTickets = [
  { id: "T-001", user: "Goldwynn Residences", title: "Urgent inventory discrepancy", priority: "High", status: "Open", date: "2026-06-04", category: "Inventory", notes: [], attachments: [] },
  { id: "T-002", user: "SY Azure", title: "Chauffeur pick up delay", priority: "Medium", status: "Closed", date: "2026-06-03", category: "Chauffeur", notes: [], attachments: [] }
];

const defaultGuestRequests = [
  { id: 1, name: "Marcus Stone", room: "Villa 4", date: "2026-06-04", category: "Dining", request: "Private Chef reservation for 8 PM", status: "Pending", notes: [], attachments: [] },
  { id: 2, name: "Elena Rostova", room: "Suite 102", date: "2026-06-03", category: "Transport", request: "Airport pick up via Chauffeur", status: "Completed", notes: [], attachments: [] }
];

const defaultLuxuryItems = [
  { id: 1, name: "Cohiba Behike 56 Cigars (Box of 10)", category: "Luxury", qty: 3, price: 1500, status: "Available" },
  { id: 2, name: "Petrus Pomerol 2015 Red Wine", category: "Beverage", qty: 2, price: 3200, status: "Reserved" }
];

const defaultNotifications = [];

const defaultLeave = [
  { id: 1, employee: "Jaheem Brown", type: "Vacation", start: "2026-07-01", end: "2026-07-07", status: "Approved", reason: "Annual Leave" },
  { id: 2, employee: "Devon Williams", type: "Sick", start: "2026-06-10", end: "2026-06-12", status: "Pending", reason: "Medical Checkup" }
];

const defaultLogs = [
  { id: 1, action: "User Login", detail: "Super Admin logged into system console.", type: "auth", timestamp: new Date().toISOString() },
  { id: 2, action: "Order Dispatched", detail: "Logistics vehicle Van-01 dispatched to Goldwynn Residences.", type: "logistics", timestamp: new Date().toISOString() }
];

function initializeMockDatabase() {
  const getOrInit = (key, defaultData) => {
    const fullKey = DB_PREFIX + key;
    if (!global.__mockDB__[String(fullKey)]) {
      global.__mockDB__[String(fullKey)] = JSON.stringify(defaultData);
    }
  };
  getOrInit("users", defaultUsers);
  getOrInit("clients", defaultClients);
  getOrInit("vendors", defaultVendors);
  getOrInit("inventory", defaultInventory);
  getOrInit("invoices", defaultInvoices);
  getOrInit("plans", defaultPlans);
  getOrInit("events", defaultEvents);
  getOrInit("vehicles", defaultVehicles);
  getOrInit("orders", defaultOrders);
  getOrInit("routes", defaultRoutes);
  getOrInit("missions", defaultMissions);
  getOrInit("deliveries", defaultDeliveries);
  getOrInit("purchaseRequests", defaultPurchaseRequests);
  getOrInit("quotes", defaultQuotes);
  getOrInit("purchaseOrders", defaultPurchaseOrders);
  getOrInit("warehouses", defaultWarehouses);
  getOrInit("tickets", defaultTickets);
  getOrInit("guestRequests", defaultGuestRequests);
  getOrInit("luxuryItems", defaultLuxuryItems);
  getOrInit("notifications", defaultNotifications);
  getOrInit("leave", defaultLeave);
  getOrInit("logs", defaultLogs);
}

if (true) {
  initializeMockDatabase();
}

// ==========================================
// CENTRALIZED REQUEST DISPATCHER (LOCAL STATE CRUD)
// ==========================================
const handleRequest = async (method, url, data) => {
  let path = url.replace(API_BASE_URL, '').split('?')[0];
  path = path.replace(/^\/api(\/v\d+)?/, '');
  if (!path.startsWith('/')) path = '/' + path;

  const getDB = (key) => JSON.parse(global.__mockDB__[String(DB_PREFIX + key)] || '[]');
  const setDB = (key, arr) => global.__mockDB__[String(DB_PREFIX + key)] = JSON.stringify(arr);

  // Small delay to simulate async REST call
  await new Promise(resolve => setTimeout(resolve, 50));

  // Get active session user
  let activeUser = null;
  if (true) {
    try {
      activeUser = JSON.parse(global.__mockDB__[String("user")] || "null");
    } catch (_) {}
  }

  // ------------------------------------------
  // 1. MOCK AUTH LOGIN
  // ------------------------------------------
  if (path === '/auth/login') {
    const { email, password } = data;
    const users = getDB('users');
    const user = users.find(u => String(u.email).toLowerCase() === String(email).trim().toLowerCase());
    if (user) {
      return {
        data: {
          success: true,
          data: {
            token: `mock-token-${user.role}-${user.id}`,
            user,
            menuPermissions: []
          }
        }
      };
    }
    throw { response: { status: 401, data: { message: "Invalid email or password." } } };
  }

  if (path === '/auth/forgot-password') {
    return { data: { success: true, data: { otp: '123456' } } };
  }

  if (path === '/auth/reset-password') {
    return { data: { success: true } };
  }

  // ------------------------------------------
  // 2. CUSTOM / DYNAMIC STATS ENDPOINTS
  // ------------------------------------------
  if (path === '/dashboard/stats') {
    const orders = getDB('orders');
    const clients = getDB('clients');
    const deliveries = getDB('deliveries');
    const events = getDB('events');
    const invoices = getDB('invoices');
    const totalRev = invoices.reduce((sum, inv) => sum + (Number(inv.amount || inv.total) || 0), 0);
    return {
      data: {
        success: true,
        data: {
          activeClients: clients.filter(c => c.status === 'Active' || c.status === 'active').length,
          pendingOrders: orders.filter(o => o.status !== 'Delivered' && o.status !== 'delivered').length,
          deliveriesToday: deliveries.length,
          activeEvents: events.length,
          totalRevenue: totalRev,
          relevantRevenue: totalRev,
          outstandingRevenue: invoices.filter(i => i.status !== 'Paid' && i.status !== 'paid').reduce((sum, inv) => sum + (Number(inv.amount || inv.total) || 0), 0),
          completedOrders: orders.filter(o => o.status === 'Delivered' || o.status === 'delivered').length
        }
      }
    };
  }

  if (path === '/settings/system') {
    if (method === 'PUT') {
      global.__mockDB__[String('zz_system_pricing')] = JSON.stringify(data);
      return { data: { success: true, data } };
    }
    const raw = global.__mockDB__[String('zz_system_pricing')];
    const settings = raw ? JSON.parse(raw) : { chauffeur_base_price: '50.00', delivery_base_price: '25.00', pickup_charges: '10.00', per_km_charges: '2.50' };
    return { data: { success: true, data: settings } };
  }

  if (path === '/logistics/pricing') {
    const raw = global.__mockDB__[String('zz_shipping_mode_pricing_v1')];
    const pricing = raw ? JSON.parse(raw) : { Road: 0, Sea: 150, Air: 300 };
    return { data: { success: true, data: pricing } };
  }

  if (path === '/staff/public/admins') {
    const data = [{ id: 'admin1', name: 'ZaneZion HQ Admin', email: 'admin@zanezion.com' }];
    return { data: { success: true, data } };
  }

  // Handle inventory adjust
  const adjustMatch = path.match(/^\/inventory\/([^/]+)\/adjust$/);
  if (adjustMatch) {
    const itemId = Number(adjustMatch[1]);
    const { qty, quantity, type, reason } = data;
    const inv = getDB('inventory');
    const item = inv.find(i => i.id === itemId || String(i.name) === String(itemId) || String(i.id) === String(itemId));
    if (item) {
      const adjustment = Number(qty || quantity) || 0;
      const isDeduct = type === 'issue' || type === 'DEDUCT';
      const actualAdjustment = isDeduct ? -adjustment : adjustment;
      item.qty = Math.max(0, (item.qty || 0) + actualAdjustment);
      item.quantity = item.qty;
      setDB('inventory', inv);

      // Add movement log
      const logs = getDB('logs');
      logs.unshift({
        id: Date.now(),
        action: "Stock Adjustment",
        detail: `Item: ${item.name}, Adjust: ${actualAdjustment}, Type: ${type}, Reason: ${reason || 'N/A'}`,
        type: "inventory",
        timestamp: new Date().toISOString()
      });
      setDB('logs', logs);
      return { data: { success: true, data: item } };
    }
  }

  if (path === '/notifications/read-all') {
    const notifs = getDB('notifications');
    notifs.forEach(n => n.read = true);
    setDB('notifications', notifs);
    return { data: { success: true } };
  }
  if (path === '/notifications/unread-count') {
    const notifs = getDB('notifications');
    const count = notifs.filter(n => !n.read).length;
    return { data: { success: true, count } };
  }
  const notifReadMatch = path.match(/^\/notifications\/([^/]+)\/read$/);
  if (notifReadMatch) {
    const nid = Number(notifReadMatch[1]);
    const notifs = getDB('notifications');
    const notif = notifs.find(n => n.id === nid);
    if (notif) {
      notif.read = true;
      setDB('notifications', notifs);
    }
    return { data: { success: true } };
  }

  // ------------------------------------------
  // 3. INTEGRATED RELATIONSHIP ENGINE TRIGGERS
  // ------------------------------------------
  
  // -- ORDER LIFECYCLE: CREATE --
  if (path === '/orders' && method === 'POST') {
    const db = getDB('orders');
    const newOrder = {
      id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      status: data.status || 'admin_review',
      client_id: data.customer_id || 1,
      total_amount: data.total_amount || data.total || 0,
      items: data.items || [],
      notes: data.notes || '',
      attachments: data.attachments || [],
      ...data
    };

    // Resolve client name
    const clients = getDB('clients');
    const cl = clients.find(c => c.id === Number(newOrder.client_id));
    newOrder.client = cl ? cl.name : (newOrder.client || "Goldwynn Residences");

    db.push(newOrder);
    setDB('orders', db);

    // Auto-create a compliance log
    const logs = getDB('logs');
    logs.unshift({
      id: Date.now(),
      action: "Order Created",
      detail: `New order ${newOrder.id} placed for ${newOrder.client}. Total: $${newOrder.total_amount || 0}.`,
      type: "order",
      timestamp: new Date().toISOString()
    });
    setDB('logs', logs);

    // Trigger notification
    const notifications = getDB('notifications');
    notifications.unshift({
      id: Date.now(),
      title: "Order Placed",
      message: `A new order ${newOrder.id} has been registered for ${newOrder.client}.`,
      read: false,
      createdAt: new Date().toISOString()
    });
    setDB('notifications', notifications);

    return { data: { success: true, data: newOrder } };
  }

  // -- ORDER LIFECYCLE: STATUS PATTERNS --
  const statusPatchMatch = path.match(/^\/orders\/([^/]+)\/status$/);
  if (statusPatchMatch && (method === 'PUT' || method === 'PATCH')) {
    const orderId = statusPatchMatch[1];
    const { status } = data;
    const orders = getDB('orders');
    const orderIndex = orders.findIndex(o => String(o.id) === String(orderId) || String(o.id).replace(/[^\d]/g, '') === String(orderId));
    if (orderIndex !== -1) {
      const order = orders[orderIndex];
      const oldStatus = order.status;
      order.status = status;
      setDB('orders', orders);

      // A. Operational transition: Order Approved -> Launch Mission
      if (status === 'operation' || status === 'processing' || status === 'approved') {
        const missions = getDB('missions');
        const deliveries = getDB('deliveries');
        
        const missionId = `MIS-${Math.floor(100 + Math.random() * 900)}`;
        const deliveryId = `DEL-${Math.floor(100 + Math.random() * 900)}`;

        const missionExists = missions.some(m => m.orderId === order.id);
        if (!missionExists) {
          missions.push({
            id: missionId,
            orderId: order.id,
            name: `${order.client} Provisioning`,
            vehicleId: "Van-01",
            routeId: 1,
            driver: "Jaheem Brown",
            status: "Active",
            progress: 0,
            tasks: [
              { name: "Load vehicle", done: false },
              { name: "Transit", done: false },
              { name: "Delivery signature", done: false }
            ]
          });
          setDB('missions', missions);

          deliveries.push({
            id: deliveryId,
            orderId: order.id,
            vehicleId: "Van-01",
            driver: "Jaheem Brown",
            status: "In Transit",
            eta: "12 mins"
          });
          setDB('deliveries', deliveries);

          // Update logs and notifications
          const logs = getDB('logs');
          logs.unshift({
            id: Date.now(),
            action: "Mission Launched",
            detail: `Mission ${missionId} and delivery details mapped for Order ${order.id}.`,
            type: "logistics",
            timestamp: new Date().toISOString()
          });
          setDB('logs', logs);

          const notifications = getDB('notifications');
          notifications.unshift({
            id: Date.now(),
            title: "Mission Launched",
            message: `Logistics transport mission ${missionId} has been successfully dispatched.`,
            read: false,
            createdAt: new Date().toISOString()
          });
          setDB('notifications', notifications);
        }
      }

      // B. Fulfillment completion: Completed / Delivered -> Generate Invoice & Deduct stock
      if (status === 'completed' || status === 'delivered') {
        const invoices = getDB('invoices');
        const invId = `INV-${Math.floor(100 + Math.random() * 900)}`;
        const invoiceExists = invoices.some(i => i.orderId === order.id);
        if (!invoiceExists) {
          invoices.push({
            id: invId,
            orderId: order.id,
            clientId: order.client,
            amount: order.total_amount || 500,
            total: order.total_amount || 500,
            status: 'Pending',
            createdAt: new Date().toISOString().split('T')[0]
          });
          setDB('invoices', invoices);

          // Deduct quantities in stock
          const inventory = getDB('inventory');
          const notifications = getDB('notifications');

          if (Array.isArray(order.items)) {
            order.items.forEach(orderItem => {
              const invItem = inventory.find(i => i.name?.toLowerCase() === orderItem.name?.toLowerCase());
              if (invItem) {
                invItem.qty = Math.max(0, invItem.qty - (Number(orderItem.qty) || 1));
                invItem.quantity = invItem.qty;
                if (invItem.qty < 5) {
                  invItem.status = "Critical";
                  notifications.unshift({
                    id: Date.now() + Math.random(),
                    title: "Critical Stock Level",
                    message: `Item ${invItem.name} stock has dropped to ${invItem.qty} units.`,
                    read: false,
                    createdAt: new Date().toISOString()
                  });
                }
              }
            });
            setDB('inventory', inventory);
          }

          // Logs
          const logs = getDB('logs');
          logs.unshift({
            id: Date.now(),
            action: "Invoice Issued",
            detail: `Invoice ${invId} ($${order.total_amount || 500}) issued for ${order.client}.`,
            type: "finance",
            timestamp: new Date().toISOString()
          });
          setDB('logs', logs);

          notifications.unshift({
            id: Date.now(),
            title: "Fulfillment Completed",
            message: `Delivery completed for Order ${order.id}. Invoice ${invId} generated.`,
            read: false,
            createdAt: new Date().toISOString()
          });
          setDB('notifications', notifications);
        }
      }

      return { data: { success: true, data: order } };
    }
  }

  // -- FINANCIALS: PAYMENT SETTLEMENT --
  if (path.startsWith('/finance/invoices') && (method === 'PUT' || method === 'PATCH')) {
    const idMatch = path.match(/^\/finance\/invoices\/([^/]+)$/);
    if (idMatch) {
      const invId = idMatch[1];
      const invoices = getDB('invoices');
      const idx = invoices.findIndex(i => String(i.id) === String(invId));
      if (idx !== -1) {
        const inv = invoices[idx];
        const oldStatus = inv.status;
        invoices[idx] = { ...inv, ...data };
        setDB('invoices', invoices);

        if (data.status === 'Paid' && oldStatus !== 'Paid') {
          // Log payment in financial ledger
          const logs = getDB('logs');
          logs.unshift({
            id: Date.now(),
            action: "Payment Settled",
            detail: `Verified transaction payment of $${inv.amount} for Invoice ${invId}.`,
            type: "finance",
            timestamp: new Date().toISOString()
          });
          setDB('logs', logs);

          const notifications = getDB('notifications');
          notifications.unshift({
            id: Date.now(),
            title: "Payment Confirmed",
            message: `Platform dues of $${inv.amount} settled for Invoice ${invId}.`,
            read: false,
            createdAt: new Date().toISOString()
          });
          setDB('notifications', notifications);
        }
        return { data: { success: true, data: invoices[idx] } };
      }
    }
  }

  // -- PROCUREMENT: SUBMIT PURCHASE REQUEST --
  if (path === '/procurement/requests' && method === 'POST') {
    const db = getDB('purchaseRequests');
    const newPR = {
      id: `PR-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      requester: activeUser?.name || 'Jane Smith',
      total: Number(data.qty || 1) * Number(data.price || 50),
      notes: data.notes || '',
      attachments: data.attachments || [],
      ...data
    };
    db.push(newPR);
    setDB('purchaseRequests', db);

    // Auto-solicit 2 quotes from registered vendors
    const quotes = getDB('quotes');
    const quote1 = {
      id: `Q-${Math.floor(100 + Math.random() * 900)}`,
      requestId: newPR.id,
      vendorName: "Nassau Wine & Spirits",
      price: newPR.price || 180,
      total: newPR.total || 4320,
      deliveryTime: "2 Days",
      status: "Pending"
    };
    const quote2 = {
      id: `Q-${Math.floor(100 + Math.random() * 900)}`,
      requestId: newPR.id,
      vendorName: "Caribbean Fine Provisions",
      price: Math.max(10, (newPR.price || 180) - 15),
      total: Math.max(10, (newPR.price || 180) - 15) * (newPR.qty || 24),
      deliveryTime: "3 Days",
      status: "Pending"
    };
    quotes.push(quote1, quote2);
    setDB('quotes', quotes);

    return { data: { success: true, data: newPR } };
  }

  // -- PROCUREMENT: QUOTE APPROVAL --
  if (path.startsWith('/procurement/quotes') && (method === 'PUT' || method === 'PATCH')) {
    const qidMatch = path.match(/^\/procurement\/quotes\/([^/]+)$/);
    if (qidMatch) {
      const qid = qidMatch[1];
      const quotes = getDB('quotes');
      const idx = quotes.findIndex(q => String(q.id) === String(qid));
      if (idx !== -1) {
        const quote = quotes[idx];
        quotes[idx] = { ...quote, ...data };
        setDB('quotes', quotes);

        if (data.status === 'Approved') {
          // Reject other quotes for this request
          quotes.forEach(q => {
            if (q.requestId === quote.requestId && q.id !== quote.id) {
              q.status = 'Rejected';
            }
          });
          setDB('quotes', quotes);

          // Mark purchase request approved
          const prs = getDB('purchaseRequests');
          const pr = prs.find(p => p.id === quote.requestId);
          if (pr) {
            pr.status = 'Approved';
            setDB('purchaseRequests', prs);
          }

          // Create PO (Purchase Order)
          const pos = getDB('purchaseOrders');
          const poId = `PO-${Math.floor(100 + Math.random() * 900)}`;
          pos.push({
            id: poId,
            requestId: quote.requestId,
            quoteId: quote.id,
            vendorName: quote.vendorName,
            total: quote.total,
            status: "Issued",
            date: new Date().toISOString().split('T')[0],
            notes: '',
            attachments: []
          });
          setDB('purchaseOrders', pos);

          // Log
          const logs = getDB('logs');
          logs.unshift({
            id: Date.now(),
            action: "PO Issued",
            detail: `Issued Purchase Order ${poId} to supplier ${quote.vendorName}.`,
            type: "procurement",
            timestamp: new Date().toISOString()
          });
          setDB('logs', logs);

          const notifications = getDB('notifications');
          notifications.unshift({
            id: Date.now(),
            title: "PO Placed",
            message: `Official Purchase Order ${poId} generated.`,
            read: false,
            createdAt: new Date().toISOString()
          });
          setDB('notifications', notifications);
        }
        return { data: { success: true, data: quotes[idx] } };
      }
    }
  }

  // -- SOURCED GOODS INGESTION (PO COMPLETED) --
  if (path.startsWith('/procurement/po') && (method === 'PUT' || method === 'PATCH')) {
    const poidMatch = path.match(/^\/procurement\/po\/([^/]+)$/);
    if (poidMatch) {
      const poid = poidMatch[1];
      const pos = getDB('purchaseOrders');
      const idx = pos.findIndex(p => String(p.id) === String(poid));
      if (idx !== -1) {
        const po = pos[idx];
        const oldStatus = po.status;
        pos[idx] = { ...po, ...data };
        setDB('purchaseOrders', pos);

        if (data.status === 'Completed' && oldStatus !== 'Completed') {
          const prs = getDB('purchaseRequests');
          const pr = prs.find(p => p.id === po.requestId);
          if (pr) {
            const inventory = getDB('inventory');
            const invItem = inventory.find(i => i.name?.toLowerCase() === pr.item?.toLowerCase());
            if (invItem) {
              invItem.qty = (invItem.qty || 0) + Number(pr.qty || 1);
              invItem.quantity = invItem.qty;
              invItem.status = "Stable";
              setDB('inventory', inventory);
            } else {
              inventory.push({
                id: Date.now(),
                name: pr.item,
                category: pr.category || "General",
                qty: Number(pr.qty || 1),
                quantity: Number(pr.qty || 1),
                price: Number(pr.price || 50),
                vendor_name: po.vendorName,
                warehouse_name: "Main Warehouse",
                status: "Stable"
              });
              setDB('inventory', inventory);
            }
          }

          // Audit log & notifications
          const logs = getDB('logs');
          logs.unshift({
            id: Date.now(),
            action: "Goods Ingested",
            detail: `Warehouse inventory updated following PO ${poid} check-in.`,
            type: "inventory",
            timestamp: new Date().toISOString()
          });
          setDB('logs', logs);

          const notifications = getDB('notifications');
          notifications.unshift({
            id: Date.now(),
            title: "Inventory Restocked",
            message: `Warehouse stocks updated post-PO ${poid} completion.`,
            read: false,
            createdAt: new Date().toISOString()
          });
          setDB('notifications', notifications);
        }
        return { data: { success: true, data: pos[idx] } };
      }
    }
  }

  // -- CONCIERGE CHAUFFEUR DISPATCH --
  if (path.startsWith('/chauffeur') && method === 'POST') {
    const chauffeurs = getDB('events'); // mapping custom chauffeur events
    const newBooking = {
      id: Date.now(),
      name: `Chauffeur Protocol - ${data.pickupLocation || 'Pickup'}`,
      client: activeUser?.name || 'Vip Customer',
      location: data.dropLocation || 'Destination',
      date: data.pickupDate || new Date().toISOString().split('T')[0],
      progress: { planning: 100, setup: 100, logistics: 0, completed: 0 },
      notes: data.notes || '',
      attachments: data.attachments || [],
      ...data
    };
    chauffeurs.push(newBooking);
    setDB('events', chauffeurs);

    const logs = getDB('logs');
    logs.unshift({
      id: Date.now(),
      action: "Chauffeur Booked",
      detail: `New chauffeur booking requested from ${newBooking.pickupLocation || 'Pickup'}.`,
      type: "concierge",
      timestamp: new Date().toISOString()
    });
    setDB('logs', logs);

    return { data: { success: true, data: newBooking } };
  }

  // -- STAFF LEAVE APPLICATIONS DEDUCTION --
  if (path.startsWith('/staff/leave') && (method === 'PUT' || method === 'PATCH')) {
    const lMatch = path.match(/^\/staff\/leave\/([^/]+)$/);
    if (lMatch) {
      const lid = lMatch[1];
      const leaves = getDB('leave');
      const idx = leaves.findIndex(l => String(l.id) === String(lid));
      if (idx !== -1) {
        const leave = leaves[idx];
        const oldStatus = leave.status;
        leaves[idx] = { ...leave, ...data };
        setDB('leave', leaves);

        if (data.status === 'Approved' && oldStatus !== 'Approved') {
          // Find target staff user and deduct balance
          const users = getDB('users');
          const emp = users.find(u => u.name === leave.employee);
          if (emp) {
            emp.vacation_balance = Math.max(0, (emp.vacation_balance || 15) - 5);
            emp.vacationBalance = emp.vacation_balance;
            setDB('users', users);
          }

          // Audit log & notifications
          const logs = getDB('logs');
          logs.unshift({
            id: Date.now(),
            action: "Leave Authorized",
            detail: `Leave application authorized for employee ${leave.employee}.`,
            type: "hr",
            timestamp: new Date().toISOString()
          });
          setDB('logs', logs);

          const notifications = getDB('notifications');
          notifications.unshift({
            id: Date.now(),
            title: "Absence Request Authorized",
            message: `Absence authorization finalized for ${leave.employee}.`,
            read: false,
            createdAt: new Date().toISOString()
          });
          setDB('notifications', notifications);
        }
        return { data: { success: true, data: leaves[idx] } };
      }
    }
  }

  // ------------------------------------------
  // 4. DEFAULT MOCK REST RESOURCE ROUTING
  // ------------------------------------------
  const urlRoutes = [
    { pattern: /^\/users\/([^/]+)$/, key: 'users' },
    { pattern: /^\/users$/, key: 'users' },
    { pattern: /^\/clients\/([^/]+)$/, key: 'clients' },
    { pattern: /^\/clients$/, key: 'clients' },
    { pattern: /^\/vendors\/([^/]+)$/, key: 'vendors' },
    { pattern: /^\/vendors$/, key: 'vendors' },
    { pattern: /^\/inventory\/movements$/, key: 'logs' },
    { pattern: /^\/inventory\/alerts$/, key: 'notifications' },
    { pattern: /^\/inventory\/([^/]+)$/, key: 'inventory' },
    { pattern: /^\/inventory$/, key: 'inventory' },
    { pattern: /^\/saas\/plans\/([^/]+)$/, key: 'plans' },
    { pattern: /^\/saas\/plans$/, key: 'plans' },
    { pattern: /^\/saas\/requests$/, key: 'clients' },
    { pattern: /^\/staff\/leave\/([^/]+)$/, key: 'leave' },
    { pattern: /^\/staff\/leave$/, key: 'leave' },
    { pattern: /^\/logistics\/vehicles\/([^/]+)$/, key: 'vehicles' },
    { pattern: /^\/logistics\/vehicles$/, key: 'vehicles' },
    { pattern: /^\/logistics\/deliveries\/([^/]+)$/, key: 'deliveries' },
    { pattern: /^\/logistics\/deliveries$/, key: 'deliveries' },
    { pattern: /^\/procurement\/requests\/([^/]+)$/, key: 'purchaseRequests' },
    { pattern: /^\/procurement\/requests$/, key: 'purchaseRequests' },
    { pattern: /^\/procurement\/quotes\/([^/]+)$/, key: 'quotes' },
    { pattern: /^\/procurement\/quotes$/, key: 'quotes' },
    { pattern: /^\/procurement\/po\/([^/]+)$/, key: 'purchaseOrders' },
    { pattern: /^\/procurement\/po$/, key: 'purchaseOrders' },
    { pattern: /^\/orders\/([^/]+)$/, key: 'orders' },
    { pattern: /^\/orders$/, key: 'orders' },
    { pattern: /^\/finance\/invoices\/([^/]+)$/, key: 'invoices' },
    { pattern: /^\/finance\/invoices$/, key: 'invoices' },
    { pattern: /^\/invoices\/([^/]+)$/, key: 'invoices' },
    { pattern: /^\/invoices$/, key: 'invoices' },
    { pattern: /^\/warehouses\/([^/]+)$/, key: 'warehouses' },
    { pattern: /^\/warehouses$/, key: 'warehouses' },
    { pattern: /^\/support\/tickets\/([^/]+)$/, key: 'tickets' },
    { pattern: /^\/support\/tickets$/, key: 'tickets' },
    { pattern: /^\/support\/events\/([^/]+)$/, key: 'events' },
    { pattern: /^\/support\/events$/, key: 'events' },
    { pattern: /^\/support\/guest-requests\/([^/]+)$/, key: 'guestRequests' },
    { pattern: /^\/support\/guest-requests$/, key: 'guestRequests' },
    { pattern: /^\/concierge\/luxury-items\/([^/]+)$/, key: 'luxuryItems' },
    { pattern: /^\/concierge\/luxury-items$/, key: 'luxuryItems' },
    { pattern: /^\/notifications$/, key: 'notifications' }
  ];

  const matchedRoute = urlRoutes.find(r => r.pattern.test(path));
  if (matchedRoute) {
    const key = matchedRoute.key;
    const match = path.match(matchedRoute.pattern);
    const id = match[1];

    if (id) {
      const db = getDB(key);
      const index = db.findIndex(item => String(item.id) === String(id));

      if (method === 'GET') {
        if (index !== -1) {
          return { data: { success: true, data: db[index] } };
        }
        throw { response: { status: 404, data: { message: "Item not found." } } };
      }

      if (method === 'PUT' || method === 'PATCH') {
        if (index !== -1) {
          db[index] = { ...db[index], ...data };
          setDB(key, db);
          return { data: { success: true, data: db[index] } };
        }
        throw { response: { status: 404, data: { message: "Item not found." } } };
      }

      if (method === 'DELETE') {
        if (index !== -1) {
          const removed = db.splice(index, 1)[0];
          setDB(key, db);
          return { data: { success: true, data: removed } };
        }
        throw { response: { status: 404, data: { message: "Item not found." } } };
      }
    } else {
      const db = getDB(key);

      if (method === 'GET') {
        if (key === 'invoices') {
          return { data: { success: true, data: { invoices: db, total: db.length, page: 1, totalPages: 1 } } };
        }
        if (key === 'orders') {
          return { data: { success: true, data: { orders: db, total: db.length, page: 1, totalPages: 1 } } };
        }
        return { data: { success: true, data: db } };
      }

      if (method === 'POST') {
        const newItem = {
          id: key === 'orders' ? `ORD-${Math.floor(100 + Math.random() * 900)}` : Date.now(),
          notes: '',
          attachments: [],
          ...data
        };
        db.push(newItem);
        setDB(key, db);
        return { data: { success: true, data: newItem } };
      }
    }
  }

  console.warn("Mock API Endpoint not mapped:", method, path);
  return { data: { success: true, data: [] } };
};

// ==========================================

export const handleMockRequest = handleRequest;
