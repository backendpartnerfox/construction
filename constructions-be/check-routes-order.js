const fs = require('fs');
const path = require('path');

console.log('Checking clients_route.js file...\n');

const routeFile = path.join(__dirname, 'routes', 'clients_route.js');
const content = fs.readFileSync(routeFile, 'utf8');

// Find all route definitions
const routePattern = /router\.(get|post|put|delete)\(['"]([^'"]+)['"]/g;
const routes = [];
let match;

while ((match = routePattern.exec(content)) !== null) {
  routes.push({
    method: match[1].toUpperCase(),
    path: match[2],
    line: content.substring(0, match.index).split('\n').length
  });
}

console.log('Routes found in order:');
routes.forEach((route, index) => {
  console.log(`${index + 1}. ${route.method} ${route.path} (line ${route.line})`);
});

// Check for problematic ordering
console.log('\n⚠️  Checking for route conflicts:');
const hasSearchBeforeId = routes.findIndex(r => r.path === '/clients/search') < routes.findIndex(r => r.path === '/clients/:id');
const hasActiveBeforeId = routes.findIndex(r => r.path === '/clients/active') < routes.findIndex(r => r.path === '/clients/:id');

console.log(`/clients/search before /clients/:id: ${hasSearchBeforeId ? '✓' : '✗'}`);
console.log(`/clients/active before /clients/:id: ${hasActiveBeforeId ? '✓' : '✗'}`);

if (!hasSearchBeforeId || !hasActiveBeforeId) {
  console.log('\n❌ Routes are still in wrong order!');
  console.log('The file might not have been saved properly.');
} else {
  console.log('\n✅ Routes are in correct order!');
  console.log('The issue might be elsewhere.');
}
