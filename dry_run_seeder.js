import fs from 'fs';

const backupData = JSON.parse(fs.readFileSync('ROLE_MENU_BACKUP.json', 'utf8'));

// We only process specific roles to avoid over-complicating the report. 
// Super admin / admin are simple (all true).
const diffs = [];

function getProposed(roleName, menuName, menuModule) {
  // Base defaults (same as current if not overridden)
  let view = true;
  let add = false;
  let edit = false;
  let del = false;

  if (roleName === 'SUPER_ADMIN' || roleName === 'ADMIN') {
    return { view: true, add: true, edit: true, del: true };
  }

  if (roleName === 'OPERATIONS') {
    if (['Orders', 'Projects', 'Missions', 'Deliveries'].includes(menuName) || menuModule === 'Operations') {
      add = true; edit = true; del = false;
    }
  }

  if (roleName === 'PROCUREMENT') {
    if (menuModule === 'Procurement') {
      add = true; edit = true; del = false;
    }
  }

  if (roleName === 'INVENTORY') {
    if (menuModule === 'Inventory') {
      add = true; edit = true; del = true;
    }
  }

  if (roleName === 'CONCIERGE') {
    if (menuModule === 'Concierge') {
      add = true; edit = true; del = true;
    }
  }

  if (roleName === 'BUSINESS_CLIENT') {
    // Should NOT have missions.
    if (menuName === 'Missions' || menuName === 'Deliveries') {
      view = false; add = false; edit = false; del = false;
    } else if (menuName === 'My Orders' || menuName === 'Marketplace') {
      add = true; edit = false; del = false;
    }
  }

  if (roleName === 'FIELD_STAFF') {
    if (menuName === 'Assignments' || menuName === 'Field Map') {
      add = false; edit = true; del = false;
    } else if (menuName === 'Staff Terminal') {
      add = false; edit = false; del = false;
    } else {
      // should not see other things
      view = false; add = false; edit = false; del = false;
    }
  }

  return { view, add, edit, del };
}

let report = '# CRUD DIFF REPORT\n\nThis report compares the current database state of `role_menus` against the proposed Phase 3 state based on the matrix.\n\n';

for (const rm of backupData) {
  const roleName = rm.role.name;
  const menuName = rm.menu.name;
  const menuModule = rm.menu.module;
  
  // We only care about reporting meaningful differences for key roles
  const current = { view: rm.can_view, add: rm.can_add, edit: rm.can_edit, del: rm.can_delete };
  const proposed = getProposed(roleName, menuName, menuModule);

  // If there's a difference, report it
  if (current.add !== proposed.add || current.edit !== proposed.edit || current.del !== proposed.del || current.view !== proposed.view) {
    report += `Role: ${roleName}\n`;
    report += `Menu: ${menuName}\n`;
    report += `Current:\nview=${current.view}\nadd=${current.add}\nedit=${current.edit}\ndelete=${current.del}\n\n`;
    report += `Proposed:\nview=${proposed.view}\nadd=${proposed.add}\nedit=${proposed.edit}\ndelete=${proposed.del}\n\n`;
    report += `---\n\n`;
  }
}

const reportPath = '../C:/Users/pcc/.gemini/antigravity-ide/brain/427134a9-437f-4210-91a1-8b78e69c3c34/CRUD_DIFF_REPORT.md';
// Using absolute path for artifact
fs.writeFileSync('C:/Users/pcc/.gemini/antigravity-ide/brain/427134a9-437f-4210-91a1-8b78e69c3c34/CRUD_DIFF_REPORT.md', report);
console.log('CRUD_DIFF_REPORT.md generated.');
