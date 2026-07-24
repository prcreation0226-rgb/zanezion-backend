import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import prisma from '../src/config/db.js';

async function test() {
  console.log("=== STARTING B2B CLIENT LEAVE REQUEST VERIFICATION ===");

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

  // Target employee: Business_001 (ID: 60)
  const employee = await prisma.user.findUnique({
    where: { email: 'business001@gmail.com' }
  });

  if (!employee) {
     console.error("Target employee business001@gmail.com not found!");
     return;
  }

  // 1. Submit a leave request for the employee
  console.log(`1. Submitting leave request for ${employee.name} (ID: ${employee.id})...`);
  const payload = {
    user_id: employee.id,
    company_id: employee.tenantId || user.tenantId,
    leave_type: 'Vacation',
    start_date: '2026-08-01',
    end_date: '2026-08-10',
    hours: 80,
    reason: 'Family holiday trip'
  };

  let createdId = null;
  try {
    const res = await fetch('http://127.0.0.1:8000/api/v1/staff/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("POST /staff/leave Response status:", res.status);
    console.log("Response data:", JSON.stringify(data, null, 2));

    if (res.status === 201) {
      createdId = data.data.id;
      console.log("SUCCESS: Leave request created successfully under tenant 8!");
    } else {
      console.error("FAILURE: Leave request creation failed.");
    }
  } catch (err) {
    console.error("Error making POST request:", err.message);
  }

  // 2. Fetch leave requests to verify it appears in the B2B Client's dashboard list
  if (createdId) {
    console.log("\n2. Fetching Leave Requests for B2B Client dashboard...");
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/staff/leave', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("GET /staff/leave Response status:", res.status);
      
      const found = (data.data || []).find(r => r.id === createdId);
      if (found) {
        console.log("SUCCESS: Created leave request verified in fetched dashboard data:", JSON.stringify(found, null, 2));
      } else {
        console.error("FAILURE: Created leave request NOT found in fetched dashboard data.");
      }

      // Cleanup
      await prisma.leaveRequest.delete({ where: { id: createdId } });
      console.log("\nCleanup of test leave request complete.");
    } catch (err) {
      console.error("Error during GET / cleanup:", err.message);
    }
  }
}

test().catch(console.error).finally(() => prisma.$disconnect());
