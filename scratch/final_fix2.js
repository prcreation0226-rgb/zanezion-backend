import fs from 'fs';
import path from 'path';

const controllersDir = path.resolve('src/controllers');

function fixAll(filename) {
  const filePath = path.join(controllersDir, filename);
  let content = fs.readFileSync(filePath, 'utf-8');
  let count = 0;

  // Pattern A: const isSuperAdmin...\n    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);
  const patA = /    const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\r?\n    const tenantIdToFilter = isSuperAdmin \? null : \(req\.user\.tenantId \|\| 1\);/g;
  const m = content.match(patA);
  if (m) count += m.length;
  content = content.replace(patA, '    const tenantIdToFilter = resolveTenantId(req);');

  // Pattern B: isSuperAdmin + isBusinessClient + ternary
  const patB = /    const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\r?\n    const isBusinessClient = req\.user\.role\?\.name === 'BUSINESS_CLIENT';\r?\n    const tenantIdToFilter = isSuperAdmin \? null : isBusinessClient \? 1 : \(req\.user\.tenantId \|\| 1\);/g;
  const m2 = content.match(patB);
  if (m2) count += m2.length;
  content = content.replace(patB, '    const tenantIdToFilter = resolveTenantId(req);');

  // Pattern C: vendor createVendor pattern
  const patC = /    const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\r?\n    const tenantIdToUse = isSuperAdmin \? \(req\.body\.tenantId \|\| req\.user\.tenantId \|\| 1\) : \(req\.user\.tenantId \|\| 1\);/g;
  const m3 = content.match(patC);
  if (m3) count += m3.length;
  content = content.replace(patC, '    const tenantIdToUse = req.body.tenantId ? Number(req.body.tenantId) : resolveTenantId(req);');

  if (count > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  console.log(`${filename}: ${count} fix(es)`);
}

fixAll('vendor.controller.js');
fixAll('warehouse.controller.js');

console.log('DONE');
