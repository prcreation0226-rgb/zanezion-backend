import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import prisma from '../src/config/db.js';

async function test() {
  console.log("=== STARTING B2B CLIENT CHAUFFEUR VERIFICATION ===");

  const user = await prisma.user.findUnique({
    where: { email: 'business00@gmail.com' },
    include: { role: true }
  });

  if (!user) {
    console.error("User business00@gmail.com not found!");
    return;
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role.name, tenantId: user.tenantId },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  // 1. Fetch chauffeur bookings
  console.log("1. Fetching Chauffeur Bookings...");
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/orders?orderType=CHAUFFEUR', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("GET /orders Response status:", res.status);
    console.log("Total chauffeur bookings fetched:", data.data?.orders?.length || data.data?.length || 0);
  } catch (err) {
    console.error("Error fetching chauffeur bookings:", err.message);
  }

  // 2. Book a Chauffeur
  console.log("\n2. Booking a Chauffeur...");
  const payload = {
    orderType: 'CHAUFFEUR',
    clientId: 43, // Web Korps client ID from our database
    dueDate: '2026-07-15',
    pickupTime: '14:30',
    pickupLocation: 'Nassau Airport (NAS)',
    dropLocation: 'Goldwynn Resort',
    serviceType: 'One Way',
    numberOfPassengers: 2,
    luggage: 'Yes',
    bags: 3,
    stops: 'No',
    amenities: ['Refreshments'],
    chauffeurFee: 120,
    status: 'pending'
  };

  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("POST /orders Response status:", res.status);
    console.log("Created Booking details:", JSON.stringify(data, null, 2));

    if (res.status === 201) {
      console.log("SUCCESS: B2B client booked a chauffeur successfully under master tenant!");
      // Clean up the created booking
      const createdId = data.data.id;
      if (createdId) {
        await prisma.orderItem.deleteMany({ where: { orderId: createdId } });
        await prisma.order.delete({ where: { id: createdId } });
        console.log("Cleanup of test chauffeur booking complete.");
      }
    } else {
      console.error("FAILURE: Booking response was not 201.");
    }
  } catch (err) {
     console.error("Error making POST request:", err.message);
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
