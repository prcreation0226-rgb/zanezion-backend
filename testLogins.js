const roles = [
  'superadmin', 'admin', 'operations', 'procurement', 'logistics',
  'inventory', 'concierge', 'businessclient', 'fieldstaff'
];

async function testLogins() {
  for (const role of roles) {
    try {
      const email = `${role}@zanezion.com`;
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: 'password123' })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      const { user, token } = data.data;
      console.log(`\n=== LOGIN SUCCESS: ${email} ===`);
      console.log(`Role Assigned: ${user.role.name}`);
      const menus = user.role.roleMenus || user.menuPermissions || [];
      console.log(`Menus Loaded: ${menus.length}`);
      if (menus.length > 0) {
        console.log(`Granted Paths: ${menus.map(m => m.menu ? m.menu.path : m.path).join(', ')}`);
      } else {
        console.warn('WARNING: 0 menus loaded! Sidebar will be empty.');
      }
      
    } catch (err) {
      console.error(`\n=== LOGIN FAILED: ${role}@zanezion.com ===`);
      console.error(err.message);
    }
  }
}

testLogins();
