const fs = require('fs');
const file = 'c:/kiaan project/zanzoin-new/backend/prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

// Insert into User
if (!content.includes('leaveRequests   LeaveRequest[]')) {
    content = content.replace('employee        Employee?', 'employee        Employee?\n  leaveRequests   LeaveRequest[]');
}

// Insert into Tenant
if (!content.includes('leaveRequests  LeaveRequest[]')) {
    content = content.replace('vehicles       Vehicle[]', 'vehicles       Vehicle[]\n  leaveRequests  LeaveRequest[]');
}

// Append model
if (!content.includes('model LeaveRequest')) {
    content += `\n// ------------------------------------------------------\n// LEAVE MANAGEMENT\n// ------------------------------------------------------\n\nmodel LeaveRequest {\n  id          Int      @id @default(autoincrement())\n  tenantId    Int?\n  userId      Int\n  leaveType   String\n  startDate   DateTime\n  endDate     DateTime\n  reason      String?  @db.Text\n  status      String   @default("pending") // pending, approved, rejected\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  tenant      Tenant?  @relation(fields: [tenantId], references: [id])\n  user        User     @relation(fields: [userId], references: [id])\n\n  @@index([tenantId])\n  @@index([userId])\n  @@index([status])\n  @@map("leave_requests")\n}\n`;
}

fs.writeFileSync(file, content);
console.log("Updated schema.prisma");
