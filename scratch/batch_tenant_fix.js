/**
 * This script batch-updates all controllers to use resolveTenantId.
 * It reads each file, replaces patterns, and writes back.
 */
import fs from 'fs';
import path from 'path';

const controllersDir = path.resolve('src/controllers');
const importLine = `import { resolveTenantId } from '../utils/tenantResolver.js';`;
// For saas.controller.js, we use the SaaS management variant
const saasImportLine = `import { resolveTenantId, resolveTenantIdForSaasManagement } from '../utils/tenantResolver.js';`;

// Controllers that have ALREADY been updated (skip them)
const alreadyUpdated = ['client.controller.js', 'user.controller.js'];
// SaaS controller needs special handling
const saasController = 'saas.controller.js';

const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.controller.js') && !alreadyUpdated.includes(f));

let totalReplacements = 0;

for (const file of files) {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  const original = content;
  let fileReplacements = 0;
  const isSaas = file === saasController;

  // Pattern 1: "const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';\n    const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null : (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);"
  // Replace with: "const tenantIdToFilter = resolveTenantId(req);"
  const pattern1 = /const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\s*\n\s*const tenantIdToFilter = isSuperAdmin && !req\.query\.tenantId \? null : \(req\.query\.tenantId \? Number\(req\.query\.tenantId\) : req\.user\.tenantId\);/g;
  const replacement1 = isSaas ? `const tenantIdToFilter = resolveTenantIdForSaasManagement(req);` : `const tenantIdToFilter = resolveTenantId(req);`;
  const matches1 = content.match(pattern1);
  if (matches1) fileReplacements += matches1.length;
  content = content.replace(pattern1, replacement1);

  // Pattern 2: "const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';\n    const tenantIdToFilter = isSuperAdmin ? null : (req.user.tenantId || 1);"
  const pattern2 = /const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\s*\n\s*const tenantIdToFilter = isSuperAdmin \? null : \(req\.user\.tenantId \|\| 1\);/g;
  const replacement2 = `const tenantIdToFilter = resolveTenantId(req);`;
  const matches2 = content.match(pattern2);
  if (matches2) fileReplacements += matches2.length;
  content = content.replace(pattern2, replacement2);

  // Pattern 3: "const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';\n    const tenantId = isSuperAdmin ? null : (req.user.tenantId || 1);"
  const pattern3 = /const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\s*\n\s*const tenantId = isSuperAdmin \? null : \(req\.user\.tenantId \|\| 1\);/g;
  const replacement3 = `const tenantId = resolveTenantId(req);`;
  const matches3 = content.match(pattern3);
  if (matches3) fileReplacements += matches3.length;
  content = content.replace(pattern3, replacement3);

  // Pattern 4: "const isSuperAdmin = req.user.role?.name === 'SUPER_ADMIN';\n    const tenantIdToUse = isSuperAdmin ? null : req.user.tenantId;"
  const pattern4 = /const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\s*\n\s*const tenantIdToUse = isSuperAdmin \? null : req\.user\.tenantId;/g;
  const replacement4 = `const tenantIdToUse = resolveTenantId(req);`;
  const matches4 = content.match(pattern4);
  if (matches4) fileReplacements += matches4.length;
  content = content.replace(pattern4, replacement4);

  // Pattern 5: Concierge-style inline: "tenantId = isSuperAdmin && !req.query.tenantId ? null : ..."
  const pattern5 = /tenantId = isSuperAdmin && !req\.query\.tenantId \? null : \(req\.query\.tenantId \? Number\(req\.query\.tenantId\) : req\.user\.tenantId\);/g;
  const replacement5 = `tenantId = resolveTenantId(req);`;
  const matches5 = content.match(pattern5);
  if (matches5) fileReplacements += matches5.length;
  content = content.replace(pattern5, replacement5);

  // Pattern 6: "tenantId = isSuperAdmin ? null : req.user.tenantId;"
  const pattern6 = /tenantId = isSuperAdmin \? null : req\.user\.tenantId;/g;
  const replacement6 = `tenantId = resolveTenantId(req);`;
  const matches6 = content.match(pattern6);
  if (matches6) fileReplacements += matches6.length;
  content = content.replace(pattern6, replacement6);

  // Pattern 7: Variations with "let" instead of "const" for tenantIdToFilter
  const pattern7 = /const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\s*\n\s*let tenantIdToFilter = isSuperAdmin \? null : \(req\.user\.tenantId \|\| 1\);/g;
  const replacement7 = `let tenantIdToFilter = resolveTenantId(req);`;
  const matches7 = content.match(pattern7);
  if (matches7) fileReplacements += matches7.length;
  content = content.replace(pattern7, replacement7);

  // Pattern 8: order controller pattern with more complex ternary
  const pattern8 = /const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\s*\n\s*const tenantIdToFilter = isSuperAdmin \? null : req\.user\.tenantId;/g;
  const replacement8 = `const tenantIdToFilter = resolveTenantId(req);`;
  const matches8 = content.match(pattern8);
  if (matches8) fileReplacements += matches8.length;
  content = content.replace(pattern8, replacement8);

  // Pattern for item.controller.js multi-line:
  // const tenantIdToFilter = isSuperAdmin && !req.query.tenantId ? null :
  //   (req.query.tenantId ? Number(req.query.tenantId) : req.user.tenantId);
  const pattern9 = /const isSuperAdmin = req\.user\.role\?\.name === 'SUPER_ADMIN';\s*\n\s*const tenantIdToFilter = isSuperAdmin && !req\.query\.tenantId \? null :\s*\n\s*\(req\.query\.tenantId \? Number\(req\.query\.tenantId\) : req\.user\.tenantId\);/g;
  const replacement9 = `const tenantIdToFilter = resolveTenantId(req);`;
  const matches9 = content.match(pattern9);
  if (matches9) fileReplacements += matches9.length;
  content = content.replace(pattern9, replacement9);

  // Clean up leftover standalone isSuperAdmin declarations that are no longer needed
  // But ONLY if they're not used elsewhere in the function
  // We'll be conservative and leave them — they don't hurt anything

  if (fileReplacements > 0) {
    // Add import if not already present
    if (!content.includes('tenantResolver')) {
      if (isSaas) {
        // Add after the last existing import
        content = content.replace(
          /(import .+? from .+?;\s*\n)(?!import)/,
          `$1${saasImportLine}\n`
        );
      } else {
        content = content.replace(
          /(import .+? from .+?;\s*\n)(?!import)/,
          `$1${importLine}\n`
        );
      }
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ ${file}: ${fileReplacements} replacement(s)`);
    totalReplacements += fileReplacements;
  } else {
    // Check if there are still any isSuperAdmin ? null patterns we missed
    if (content.includes('isSuperAdmin') && content.includes('null')) {
      console.log(`⚠️  ${file}: Has isSuperAdmin patterns but no regex matched — needs manual review`);
    } else {
      console.log(`⏭️  ${file}: No matching patterns found`);
    }
  }
}

console.log(`\n=== DONE: ${totalReplacements} total replacements across ${files.length} files ===`);
