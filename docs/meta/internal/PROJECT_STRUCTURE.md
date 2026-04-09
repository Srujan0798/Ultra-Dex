# 🏗️ ULTRA-DEX PROJECT STRUCTURE & ORGANIZATION

## 📋 COMPLETE PROJECT MAP

### **ROOT LEVEL STRUCTURE**

```
Ultra-Dex/
├── package.json ← MASTER VERSION (4.3.0)
├── README.md
├── CHANGELOG.md
├── LICENSE
├── .gitignore
├── .env.example
├── mcp-config.json
├── vitest.config.js
├── router.json
└── task.md
```

### **MAIN COMPONENTS**

#### **CLI ENGINE** (`/cli`)

```
cli/
├── package.json ← SYNCED VERSION (4.3.0)
├── bin/
│   └── ultra-dex.js ← MAIN ENTRY POINT
├── lib/
│   ├── agents/ ← AI AGENTS
│   ├── auth/ ← AUTHENTICATION
│   ├── commands/ ← CLI COMMANDS
│   ├── commerce/ ← BILLING & COMMERCE
│   ├── config/ ← CONFIGURATION
│   ├── context/ ← CONTEXT MANAGEMENT
│   ├── governance/ ← GOVERNANCE SYSTEM
│   ├── ide/ ← CLOUD IDE
│   ├── memory/ ← MEMORY SYSTEM
│   ├── mcp/ ← MODEL CONTEXT PROTOCOL
│   ├── mobile/ ← MOBILE INTEGRATION
│   ├── providers/ ← AI PROVIDERS
│   ├── router/ ← ROUTING SYSTEM
│   ├── sandbox/ ← SANDBOX SYSTEM
│   ├── swarm/ ← SWARM ORCHESTRATION
│   ├── utils/ ← UTILITIES
│   └── white-label/ ← WHITE-LABEL SYSTEM
├── assets/
│   └── ide/ ← IDE ASSETS
├── templates/ ← PROJECT TEMPLATES
│   ├── next15-saas/
│   ├── sveltekit-saas/
│   ├── fastapi-api/
│   └── ...
└── test/ ← TEST SUITES
```

#### **EXTENSIONS** (`/extensions`)

```
extensions/
└── vscode/
    ├── package.json ← SYNCED VERSION (4.3.0)
    ├── src/
    │   ├── extension.ts
    │   ├── sidebar/
    │   └── commands/
    └── media/
```

#### **APPLICATIONS** (`/apps`)

```
apps/
└── desktop/
    ├── package.json ← SYNCED VERSION (4.3.0)
    ├── src/
    ├── electron/
    └── build/
```

#### **WEB DASHBOARD** (`/web`)

```
web/
├── package.json ← SYNCED VERSION (4.3.0)
├── src/
├── public/
├── components/
└── pages/
```

#### **MOBILE APP** (`/mobile`)

```
mobile/
├── package.json ← INDEPENDENT VERSION (0.1.0)
├── ios/
├── android/
└── src/
```

#### **SDK** (`/sdk`)

```
sdk/
├── package.json ← INDEPENDENT VERSION (0.1.0)
├── src/
├── lib/
└── examples/
```

## 🎯 VERSION COORDINATION SYSTEM

### **MASTER VERSION SOURCE**

- **File**: `/package.json`
- **Version**: `4.3.0`
- **Purpose**: Central version authority

### **SYNCED COMPONENTS** (Must match master)

1. `/cli/package.json` - Core CLI engine
2. `/extensions/vscode/package.json` - VS Code extension
3. `/apps/desktop/package.json` - Desktop application
4. `/web/package.json` - Web dashboard
5. `/dashboard/package.json` - Dashboard app

### **INDEPENDENT COMPONENTS** (Version separately)

1. `/mobile/package.json` - Mobile app (platform-specific)
2. `/sdk/package.json` - SDK (development kit)
3. `/cli/templates/*/package.json` - Project templates
4. `/examples/*/package.json` - Example projects
5. `/bots/*/package.json` - Specialized bots

## 🔄 VERSION UPDATE WORKFLOW

### **Manual Update Process**

```bash
# 1. Update master version
npm version 4.4.0 --prefix .

# 2. Update all synced components
npm version 4.4.0 --prefix ./cli
npm version 4.4.0 --prefix ./extensions/vscode
npm version 4.4.0 --prefix ./apps/desktop
npm version 4.4.0 --prefix ./web
npm version 4.4.0 --prefix ./dashboard

# 3. Update version in documentation
# (Will be automated with scripts)
```

### **Automated Version Sync Script** (TO BE IMPLEMENTED)

```javascript
// scripts/version-sync.js
const fs = require('fs');
const path = require('path');

const MASTER_VERSION_FILE = './package.json';
const SYNCED_COMPONENTS = [
  './cli/package.json',
  './extensions/vscode/package.json',
  './apps/desktop/package.json',
  './web/package.json',
  './dashboard/package.json',
];

function syncVersions() {
  const masterPkg = JSON.parse(fs.readFileSync(MASTER_VERSION_FILE, 'utf8'));
  const newVersion = masterPkg.version;

  SYNCED_COMPONENTS.forEach((component) => {
    const pkg = JSON.parse(fs.readFileSync(component, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(component, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${component} to ${newVersion}`);
  });
}

syncVersions();
```

## 📁 DIRECTORY PURPOSES

### **Core Directories**

- `/cli` - Main Ultra-Dex engine and commands
- `/extensions` - IDE integrations
- `/apps` - Standalone applications
- `/web` - Web-based interfaces
- `/docs` - Documentation
- `/examples` - Sample projects
- `/templates` - Project templates

### **Support Directories**

- `/assets` - Static assets
- `/config` - Configuration files
- `/scripts` - Build and deployment scripts
- `/test` - Test suites
- `/node_modules` - Dependencies

### **Special Directories**

- `/@ ultra-dex` - Special project directories
- `/00-START` - Getting started guides
- `/certification` - Certification materials
- `/university` - Educational content

## 🚀 RELEASE PREPARATION

### **Pre-Release Checklist**

- [ ] All synced components have matching versions
- [ ] Independent components have appropriate versions
- [ ] Documentation reflects new version
- [ ] Tests pass across all components
- [ ] Dependencies are up-to-date
- [ ] Security scans pass

### **Release Process**

1. Update master version in `/package.json`
2. Run version sync script
3. Update documentation
4. Run comprehensive tests
5. Create git tag
6. Publish to npm
7. Update GitHub releases

## 🏗️ ARCHITECTURE PRINCIPLES

### **Version Consistency**

- Primary components (CLI, Extension, Desktop, Web) must have identical versions
- Secondary components can have independent versions
- Version changes propagate from master to synced components

### **Component Independence**

- Each component can be developed independently
- Components can be released independently when appropriate
- Breaking changes require coordinated releases

### **Future Scalability**

- Version system supports new component types
- Automated tools can be added for version management
- Documentation system scales with version changes

---

**Organization Strategy**: Centralized version control for primary components, independent versioning for specialized components. All changes flow from master version file to synchronized components.
