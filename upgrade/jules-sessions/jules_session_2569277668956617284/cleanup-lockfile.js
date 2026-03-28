const fs = require('fs');
const lockfile = 'package-lock.json';

try {
  const data = fs.readFileSync(lockfile, 'utf8');
  const json = JSON.parse(data);

  if (json.dependencies && json.dependencies.cityhash) {
    delete json.dependencies.cityhash;
    console.log('Removed cityhash from dependencies');
  }
  if (json.packages && json.packages['node_modules/cityhash']) {
    delete json.packages['node_modules/cityhash'];
    console.log('Removed cityhash from packages');
  }
  
  // Also check if any package requires it and remove it from their requires
  // This is a naive cleanup, but might help. 
  // Ideally we should just rely on npm uninstall, but if it fails...

  fs.writeFileSync(lockfile, JSON.stringify(json, null, 2) + '\n');
  console.log('Updated package-lock.json');
} catch (e) {
  console.error('Error modifying lockfile:', e);
}
