/**
 * Final cleanup: Fix remaining tenant bypass patterns in:
 * - vendor.controller.js
 * - warehouse.controller.js (update + delete)
 * - mission.controller.js (updateMissionStatus)
 * - item.controller.js (getItems)
 */
import fs from 'fs';
import path from 'path';

const controllersDir = path.resolve('src/controllers');
const importLine = `import { resolveTenantId } from '../utils/tenantResolver.js';`;

function fixFile(filename, replacements) {
  const filePath = path.join(controllersDir, filename);
  let content = fs.readFileSync(filePath, 'utf-8');
  let count = 0;

  // Add import if not present
  if (!content.includes('tenantResolver')) {
    // Add after last import line
    const lastImportIdx = content.lastIndexOf('import ');
    const nextNewline = content.indexOf('\n', lastImportIdx);
    content = content.slice(0, nextNewline + 1) + importLine + '\n' + content.slice(nextNewline + 1);
    console.log(`  Added import to ${filename}`);
  }

  for (const [search, replace] of replacements) {
    if (content.includes(search)) {
      content = content.replace(search, replace);
      count++;
    } else {
      console.log(`  ⚠️  Pattern not found in ${filename}: "${search.slice(0, 60)}..."`);
    }
  }

  if (count > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${filename}: ${count} replacement(s)`);
  }
}

// vendor.controller.js — getVendors has multi-line pattern
fixFile('vendor.controller.js', [
  [
    `    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';\r\n    const isBusinessClient = req.user.role?.name === 'BUSINESS_CLIENT';\r\n    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null :\r\n                             isBusinessClient ? 1 :\r\n                             (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);`,
    `    const tenantIdToFilter = resolveTenantId(req);`
  ]
]);

// warehouse.controller.js — updateWarehouse + deleteWarehouse
fixFile('warehouse.controller.js', [
  // Pattern occurs twice — fix both
  [
    `    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';\r\n    const isBusinessClient = req.user.role?.name === 'BUSINESS_CLIENT';\r\n    const tenantIdToFilter = isSuperAdmin ? null : isBusinessClient ? 1 : (req.user.tenantId || 1);`,
    `    const tenantIdToFilter = resolveTenantId(req);`
  ]
]);

// mission.controller.js — updateMissionStatus
fixFile('mission.controller.js', [
  [
    `    const isSuperAdmin = req.user?.role?.name === 'SUPER_ADMIN';\r\n    const tenantIdToFilter = isSuperAdmin ? null : req.user?.tenantId || null;`,
    `    const tenantIdToFilter = resolveTenantId(req);`
  ]
]);

// item.controller.js — getItems has multi-line pattern
fixFile('item.controller.js', [
  [
    `    const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';\r\n    const isBusinessClient = req.user.role?.name === 'BUSINESS_CLIENT' || req.user.role?.name === 'CLIENT';\r\n    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null :\r\n                             isBusinessClient ? 1 :\r\n                             (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);`,
    `    const tenantIdToFilter = resolveTenantId(req);`
  ]
]);

console.log('\n=== DONE ===');
