const fs = require('fs');
const { execSync } = require('child_process');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
const broken = [];

console.log('Checking ' + Object.keys(deps).length + ' dependencies...');

for (const [pkg, ver] of Object.entries(deps)) {
  if (ver.startsWith('file:') || ver.startsWith('workspace:')) continue;
  try {
    // Check if the specific version exists
    execSync(`npm view "${pkg}@${ver}" version --json`, { stdio: 'ignore', timeout: 3000 });
  } catch (e) {
    try {
        // if specific version fails, check if package exists at all and get latest
        const latest = execSync(`npm view "${pkg}" version`, { encoding: 'utf8', timeout: 3000 }).trim();
        console.log(`❌ ${pkg}@${ver} failed. Latest is ${latest}`);
        broken.push({ pkg, ver, latest });
    } catch (e2) {
        console.log(`💀 ${pkg} does not exist on npm`);
    }
  }
}

console.log('Done.');
