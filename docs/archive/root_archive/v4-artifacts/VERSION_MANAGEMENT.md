# 🎯 ULTRA-DEX VERSION MANAGEMENT SYSTEM

## 📋 PROJECT STRUCTURE & VERSIONING

### **Central Version Management**
- **Main Package**: `/package.json` - Version `4.3.0` (MASTER VERSION)
- **CLI Package**: `/cli/package.json` - Version `4.3.0` (SYNCHRONIZED)
- **VS Code Extension**: `/extensions/vscode/package.json` - Version `4.3.0` (SYNCHRONIZED)
- **Desktop App**: `/apps/desktop/package.json` - Version `4.3.0` (SYNCHRONIZED)

### **Version Synchronization Strategy**
All components must maintain the same version number to ensure consistency:

```
Ultra-Dex v4.3.0
├── cli/ (Core CLI) - 4.3.0
├── extensions/vscode/ (VS Code Extension) - 4.3.0
├── apps/desktop/ (Desktop App) - 4.3.0
├── web/ (Web Dashboard) - 4.3.0
├── mobile/ (Mobile App) - 0.1.0 (separate)
└── sdk/ (SDK) - 0.1.0 (separate)
```

## 🏗️ VERSION HIERARCHY

### **Primary Components (Versioned Together)**
1. **CLI Core** (`/cli`) - Main engine
2. **VS Code Extension** (`/extensions/vscode`) - IDE integration
3. **Desktop Application** (`/apps/desktop`) - Standalone app
4. **Web Dashboard** (`/web`) - Web interface
5. **Core Libraries** (`/cli/lib/*`) - Shared functionality

### **Secondary Components (Independent Versions)**
1. **Mobile App** (`/mobile`) - Platform-specific
2. **SDK** (`/sdk`) - Development kit
3. **Templates** (`/cli/templates/*`) - Project templates
4. **Examples** (`/examples/*`) - Sample projects
5. **Bots** (`/bots/*`) - Specialized agents

## 🔄 VERSION UPDATE PROCESS

### **Master Version Update**
1. Update `/package.json` version
2. Update `/cli/package.json` to match
3. Update `/extensions/vscode/package.json` to match
4. Update `/apps/desktop/package.json` to match
5. Update `/web/package.json` to match
6. Update version references in documentation

### **Automated Version Sync**
```bash
# Version sync script (to be created)
npm run version:sync --to=4.4.0
```

## 📁 DIRECTORY STRUCTURE

```
Ultra-Dex/
├── package.json ← MASTER VERSION (4.3.0)
├── cli/
│   └── package.json ← SYNCED VERSION (4.3.0)
├── extensions/
│   └── vscode/
│       └── package.json ← SYNCED VERSION (4.3.0)
├── apps/
│   └── desktop/
│       └── package.json ← SYNCED VERSION (4.3.0)
├── web/
│   └── package.json ← SYNCED VERSION (4.3.0)
├── mobile/
│   └── package.json ← INDEPENDENT (0.1.0)
├── sdk/
│   └── package.json ← INDEPENDENT (0.1.0)
├── cli/templates/
│   ├── next15-saas/package.json ← TEMPLATE SPECIFIC
│   ├── sveltekit-saas/package.json ← TEMPLATE SPECIFIC
│   └── ...
└── examples/
    ├── ai-saas/package.json ← EXAMPLE SPECIFIC
    └── ...
```

## 🚀 RELEASE STRATEGY

### **v4.4.0 Development Plan**
- **Master Branch**: Maintains current version (4.3.0)
- **Development Branches**: Feature-specific
- **Release Branches**: Version-specific (release/4.4.0)
- **Tags**: Git tags for each release (v4.4.0)

### **Version Coordination**
- All primary components release together
- Secondary components can release independently
- Breaking changes require major version bump across all
- Minor features can be versioned independently

## 📊 VERSION STATUS

| Component | Version | Status | Notes |
|-----------|---------|--------|-------|
| Core CLI | 4.3.0 | SYNCED | Master version source |
| VS Code Extension | 4.3.0 | SYNCED | IDE integration |
| Desktop App | 4.3.0 | SYNCED | Standalone application |
| Web Dashboard | 4.3.0 | SYNCED | Web interface |
| Mobile App | 0.1.0 | INDEPENDENT | Platform-specific |
| SDK | 0.1.0 | INDEPENDENT | Development kit |
| Templates | 0.1.0-1.0.0 | INDEPENDENT | Project-specific |

## 🔄 AUTOMATION SCRIPTS

### **Version Sync Script** (TO BE CREATED)
```javascript
// scripts/sync-versions.js
const fs = require('fs');
const path = require('path');

function syncVersions(newVersion) {
  const masterPackage = require('../package.json');
  const components = [
    './cli/package.json',
    './extensions/vscode/package.json', 
    './apps/desktop/package.json',
    './web/package.json'
  ];
  
  components.forEach(component => {
    const pkg = require(component);
    pkg.version = newVersion;
    fs.writeFileSync(component, JSON.stringify(pkg, null, 2));
  });
}
```

### **Release Script** (TO BE CREATED)
```bash
#!/bin/bash
# scripts/release.sh
NEW_VERSION=$1

# Update all synchronized packages
npm version $NEW_VERSION --prefix .
npm version $NEW_VERSION --prefix ./cli
npm version $NEW_VERSION --prefix ./extensions/vscode
npm version $NEW_VERSION --prefix ./apps/desktop
npm version $NEW_VERSION --prefix ./web

# Create git tag
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"
git push origin "v$NEW_VERSION"
```

## 🎯 FUTURE VERSIONS

### **v4.4.0 Features**
- AI Agent Training Studio
- Decentralized Orchestration  
- Advanced Analytics
- API Gateway

### **v5.0.0 Vision**
- AI-Powered Debugging
- Predictive Architecture
- Self-Healing Systems
- Quantum-Ready

---

**Version Management Policy**: All primary components maintain synchronized versions. Secondary components maintain independent versions based on their specific needs and release cycles.