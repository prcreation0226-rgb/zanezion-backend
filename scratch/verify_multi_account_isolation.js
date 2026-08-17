import 'dotenv/config';
import prisma from '../src/config/db.js';
import * as authService from '../src/services/auth.service.js';
import * as orderService from '../src/services/order.service.js';
import * as deliveryService from '../src/services/delivery.service.js';
import * as supportService from '../src/services/support.service.js';
import * as invoiceService from '../src/services/invoice.service.js';
import * as missionService from '../src/services/mission.service.js';

async function testIsolation() {
  console.log('====================================================');
  console.log('STARTING MULTI-ACCOUNT ISOLATION VERIFICATION');
  console.log('====================================================\n');

  const timestamp = Date.now();
  const testPersonalEmail = `test_personal_${timestamp}@test.com`;
  const testBusinessEmail = `test_biz_${timestamp}@test.com`;
  const testSaasEmail = `test_saas_${timestamp}@test.com`;

  // 1. Create Personal Account
  console.log('1. Creating Personal Account:', testPersonalEmail);
  const personalUser = await authService.signupUser({
    name: `Test Personal User ${timestamp}`,
    email: testPersonalEmail,
    password: 'Password123!',
    phone: '1234567890',
    accountType: 'personal',
    role: 'customer'
  });
  console.log('   Personal User created with ID:', personalUser.id, 'TenantID:', personalUser.tenantId);

  // 2. Create Business Account
  console.log('2. Creating Business Account:', testBusinessEmail);
  const bizUser = await authService.signupUser({
    name: `Test Biz User ${timestamp}`,
    email: testBusinessEmail,
    password: 'Password123!',
    phone: '1234567891',
    accountType: 'business',
    role: 'client',
    companyName: `Test Biz Co ${timestamp}`
  });
  console.log('   Business User created with ID:', bizUser.id, 'TenantID:', bizUser.tenantId);

  // 3. Create SaaS Account
  console.log('3. Creating SaaS Account:', testSaasEmail);
  const saasUser = await authService.signupUser({
    name: `Test SaaS User ${timestamp}`,
    email: testSaasEmail,
    password: 'Password123!',
    phone: '1234567892',
    accountType: 'saas',
    role: 'saas_client',
    companyName: `Test SaaS Co ${timestamp}`
  });
  console.log('   SaaS User created with ID:', saasUser.id, 'TenantID:', saasUser.tenantId);

  console.log('\n--- VERIFYING INITIAL CLEAN SLATE FOR ALL 3 ACCOUNTS ---\n');

  // Verify Personal Account
  const personalOrders = await orderService.getOrders(personalUser.tenantId, {
    page: 1, limit: 10, user_id: personalUser.id, customer_email: personalUser.email
  });
  const personalChauffeur = await orderService.getOrders(personalUser.tenantId, {
    page: 1, limit: 10, orderType: 'CHAUFFEUR', user_id: personalUser.id, customer_email: personalUser.email
  });
  const personalTickets = await supportService.getTickets(personalUser.tenantId, personalUser);
  const personalEvents = await supportService.getEvents(personalUser.tenantId, personalUser);
  const personalInvoices = await invoiceService.getInvoices(personalUser.tenantId, { clientId: -1 });

  console.log('Personal Account Data:');
  console.log(' - Orders count:', personalOrders.total, personalOrders.total === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Chauffeur count:', personalChauffeur.total, personalChauffeur.total === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Tickets count:', personalTickets.length, personalTickets.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Events count:', personalEvents.length, personalEvents.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Invoices count:', personalInvoices.total || 0, (personalInvoices.total || 0) === 0 ? '✅ PASS' : '❌ FAIL');

  // Verify Business Account
  const bizOrders = await orderService.getOrders(bizUser.tenantId, { page: 1, limit: 10 });
  const bizChauffeur = await orderService.getOrders(bizUser.tenantId, { page: 1, limit: 10, orderType: 'CHAUFFEUR' });
  const bizTickets = await supportService.getTickets(bizUser.tenantId, bizUser);
  const bizEvents = await supportService.getEvents(bizUser.tenantId, bizUser);
  const bizInvoices = await invoiceService.getInvoices(bizUser.tenantId, {});

  console.log('\nBusiness Account Data:');
  console.log(' - Orders count:', bizOrders.total, bizOrders.total === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Chauffeur count:', bizChauffeur.total, bizChauffeur.total === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Tickets count:', bizTickets.length, bizTickets.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Events count:', bizEvents.length, bizEvents.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Invoices count:', bizInvoices.total || 0, (bizInvoices.total || 0) === 0 ? '✅ PASS' : '❌ FAIL');

  // Verify SaaS Account
  const saasOrders = await orderService.getOrders(saasUser.tenantId, { page: 1, limit: 10 });
  const saasChauffeur = await orderService.getOrders(saasUser.tenantId, { page: 1, limit: 10, orderType: 'CHAUFFEUR' });
  const saasTickets = await supportService.getTickets(saasUser.tenantId, saasUser);
  const saasEvents = await supportService.getEvents(saasUser.tenantId, saasUser);
  const saasInvoices = await invoiceService.getInvoices(saasUser.tenantId, {});

  console.log('\nSaaS Account Data:');
  console.log(' - Orders count:', saasOrders.total, saasOrders.total === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Chauffeur count:', saasChauffeur.total, saasChauffeur.total === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Tickets count:', saasTickets.length, saasTickets.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Events count:', saasEvents.length, saasEvents.length === 0 ? '✅ PASS' : '❌ FAIL');
  console.log(' - Invoices count:', saasInvoices.total || 0, (saasInvoices.total || 0) === 0 ? '✅ PASS' : '❌ FAIL');

  // 4. Create an Order in Personal Account and check Cross-Account Isolation
  console.log('\n--- TESTING NEW ORDER CREATION & ISOLATION ---');
  const createdOrder = await orderService.createOrder({
    orderType: 'CHAUFFEUR',
    totalAmount: 120,
    metadata: {
      user_id: personalUser.id,
      created_by: personalUser.id,
      customer_email: personalUser.email,
      serviceType: 'One Way',
      pickupLocation: 'Airport',
      dropLocation: 'Hotel'
    }
  }, personalUser.id, personalUser.tenantId);
  console.log('Created Chauffeur Order for Personal User, ID:', createdOrder.id);

  // Re-check Personal User: should see 1 order
  const personalAfter = await orderService.getOrders(personalUser.tenantId, {
    page: 1, limit: 10, orderType: 'CHAUFFEUR', user_id: personalUser.id, customer_email: personalUser.email
  });
  console.log('Personal User sees order:', personalAfter.total === 1 ? '✅ PASS (1 order)' : `❌ FAIL (${personalAfter.total})`);

  // Re-check Business User: should see 0 orders
  const bizAfter = await orderService.getOrders(bizUser.tenantId, {
    page: 1, limit: 10, orderType: 'CHAUFFEUR'
  });
  console.log('Business User sees order:', bizAfter.total === 0 ? '✅ PASS (0 orders - Isolated)' : `❌ FAIL (${bizAfter.total})`);

  // Re-check SaaS User: should see 0 orders
  const saasAfter = await orderService.getOrders(saasUser.tenantId, {
    page: 1, limit: 10, orderType: 'CHAUFFEUR'
  });
  console.log('SaaS User sees order:', saasAfter.total === 0 ? '✅ PASS (0 orders - Isolated)' : `❌ FAIL (${saasAfter.total})`);

  // HQ Super Admin: should see it in operational query
  const hqAdmin = await prisma.user.findFirst({ where: { roleId: 1 } });
  const hqAdminOrders = await orderService.getOrders(null, {
    page: 1, limit: 10, orderType: 'CHAUFFEUR'
  });
  console.log('HQ Super Admin sees operational orders across tenants:', hqAdminOrders.total > 0 ? '✅ PASS (Central visibility)' : '❌ FAIL');

  console.log('\n====================================================');
  console.log('ALL MULTI-ACCOUNT ISOLATION TESTS COMPLETE!');
  console.log('====================================================\n');
}

testIsolation()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
