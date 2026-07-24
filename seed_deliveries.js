import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting dummy delivery and order seeder...');

  // 1. Get Tenant
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.log('Creating organization and tenant...');
    const org = await prisma.organization.create({
      data: {
        name: 'Zanezion Dummy Org',
        email: 'dummyorg@test.com',
        status: 'active'
      }
    });
    tenant = await prisma.tenant.create({
      data: {
        organizationId: org.id,
        tenantCode: 'DMY-TN-' + Date.now(),
        status: 'active'
      }
    });
  }

  // 2. Get Employee to create the order
  const employee = await prisma.employee.findFirst({
    where: { tenantId: tenant.id }
  });
  if (!employee) {
    throw new Error('No employee found. Please run seed_employees.js first.');
  }

  // 3. Create or get Warehouse
  let warehouse = await prisma.warehouse.findFirst({
    where: { tenantId: tenant.id }
  });
  if (!warehouse) {
    console.log('Creating warehouse...');
    warehouse = await prisma.warehouse.create({
      data: {
        tenantId: tenant.id,
        name: 'Nassau Main Depot',
        location: '123 Harbour Road, Nassau',
        capacity: 1000,
        status: 'active'
      }
    });
  }

  // 4. Create or get Client
  let client = await prisma.client.findFirst({
    where: { tenantId: tenant.id }
  });
  if (!client) {
    console.log('Creating client...');
    client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        clientCode: 'CLI-GOLD-01',
        companyName: 'Goldwynn Residences',
        contactPerson: 'Jane Adderley',
        email: 'jane@goldwynn.com',
        phone: '+1-242-555-0199',
        address: 'Cable Beach, Nassau',
        status: 'active'
      }
    });
  }

  // 5. Create or get Category & Unit
  let category = await prisma.itemCategory.findFirst({
    where: { tenantId: tenant.id }
  });
  if (!category) {
    category = await prisma.itemCategory.create({
      data: {
        tenantId: tenant.id,
        name: 'Beverages',
        status: 'active'
      }
    });
  }

  let unit = await prisma.itemUnit.findFirst({
    where: { tenantId: tenant.id }
  });
  if (!unit) {
    unit = await prisma.itemUnit.create({
      data: {
        tenantId: tenant.id,
        name: 'Pieces',
        shortName: 'pcs',
        status: 'active'
      }
    });
  }

  // 6. Create or get Item
  let item = await prisma.item.findFirst({
    where: { tenantId: tenant.id }
  });
  if (!item) {
    console.log('Creating item...');
    item = await prisma.item.create({
      data: {
        tenantId: tenant.id,
        categoryId: category.id,
        unitId: unit.id,
        sku: 'BEV-CHAMP-01',
        name: 'Premium Champagne',
        description: 'Veuve Clicquot Brut Champagne',
        status: 'active'
      }
    });
  }

  // 7. Create Orders & Deliveries
  const timestamp = Date.now().toString().slice(-4);
  
  console.log('Creating Order 1...');
  const order1 = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: `ORD-2026-${timestamp}-1`,
      clientId: client.id,
      createdById: employee.id,
      status: 'approved',
      priority: 'high',
      orderType: 'Delivery',
      totalAmount: 750.00
    }
  });

  const orderItem1 = await prisma.orderItem.create({
    data: {
      tenantId: tenant.id,
      orderId: order1.id,
      itemId: item.id,
      warehouseId: warehouse.id,
      quantity: 5,
      unitPrice: 150.00,
      totalPrice: 750.00
    }
  });

  console.log('Creating Delivery 1...');
  const delivery1 = await prisma.delivery.create({
    data: {
      tenantId: tenant.id,
      deliveryNumber: `DEL-2026-${timestamp}-1`,
      orderId: order1.id,
      clientId: client.id,
      warehouseId: warehouse.id,
      status: 'pending',
      missionType: 'Delivery',
      transportMode: 'Road',
      pickupLocation: warehouse.location || 'Nassau Main Depot',
      dropLocation: 'Cable Beach, Nassau',
      routeDistance: 12.5, // 12.5 km
      staffPayRate: 2.50, // $2.50 per km
      deliveryFee: 45.00
    }
  });

  await prisma.deliveryItem.create({
    data: {
      tenantId: tenant.id,
      deliveryId: delivery1.id,
      orderItemId: orderItem1.id,
      itemId: item.id,
      quantity: 5
    }
  });

  console.log('Creating Order 2...');
  const order2 = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: `ORD-2026-${timestamp}-2`,
      clientId: client.id,
      createdById: employee.id,
      status: 'approved',
      priority: 'normal',
      orderType: 'Delivery',
      totalAmount: 300.00
    }
  });

  const orderItem2 = await prisma.orderItem.create({
    data: {
      tenantId: tenant.id,
      orderId: order2.id,
      itemId: item.id,
      warehouseId: warehouse.id,
      quantity: 2,
      unitPrice: 150.00,
      totalPrice: 300.00
    }
  });

  console.log('Creating Delivery 2...');
  const delivery2 = await prisma.delivery.create({
    data: {
      tenantId: tenant.id,
      deliveryNumber: `DEL-2026-${timestamp}-2`,
      orderId: order2.id,
      clientId: client.id,
      warehouseId: warehouse.id,
      status: 'pending',
      missionType: 'Delivery',
      transportMode: 'Road',
      pickupLocation: warehouse.location || 'Nassau Main Depot',
      dropLocation: 'Lyford Cay, Nassau',
      routeDistance: 24.8, // 24.8 km
      staffPayRate: 3.00, // $3.00 per km
      deliveryFee: 75.00
    }
  });

  await prisma.deliveryItem.create({
    data: {
      tenantId: tenant.id,
      deliveryId: delivery2.id,
      orderItemId: orderItem2.id,
      itemId: item.id,
      quantity: 2
    }
  });

  console.log('🎉 Successfully seeded dummy deliveries and orders!');
}

main()
  .catch((e) => {
    console.error('❌ Seeder failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
