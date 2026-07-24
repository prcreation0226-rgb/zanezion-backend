const fs = require('fs');
const frontendApi = fs.readFileSync('../frontend/src/utils/api.js', 'utf-8');
let newApi = frontendApi.replace(/localStorage\.getItem\(([^)]+)\)/g, 'global.__mockDB__[String($1)]')
                        .replace(/localStorage\.setItem\(([^,]+),\s*(.+)\)/g, 'global.__mockDB__[String($1)] = $2')
                        .replace(/localStorage\.removeItem\(([^)]+)\)/g, 'delete global.__mockDB__[String($1)]')
                        .replace(/if\s*\(typeof window !== "undefined"\)\s*\{/g, 'if (true) {');
newApi = 'global.__mockDB__ = global.__mockDB__ || {};\n' + newApi;

// we need to export handleRequest instead of whatever is exported
newApi += '\nexport const handleMockRequest = handleRequest;\n';

fs.writeFileSync('src/utils/mockApi.js', newApi);
console.log('Done!');
