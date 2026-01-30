#!/bin/bash
# Ultra-Dex Project Cleanup Script
# Cleans up temporary files and ensures proper organization

echo "🧹 Ultra-Dex Project Cleanup Script"
echo "=================================="

# Remove any temporary files
echo "Removing temporary files..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.bak" -delete 2>/dev/null || true
find . -name "*.backup" -delete 2>/dev/null || true
find . -name "*~" -delete 2>/dev/null || true

# Remove any .DS_Store files
echo "Removing .DS_Store files..."
find . -name ".DS_Store" -delete 2>/dev/null || true

# Clean up any corrupted files
echo "Cleaning up corrupted files..."
rm -f .\!*\! 2>/dev/null || true

# Verify directory structure
echo "Verifying directory structure..."
if [ ! -d "docs/completion-reports" ]; then
    mkdir -p docs/completion-reports
fi
if [ ! -d "docs/security" ]; then
    mkdir -p docs/security
fi
if [ ! -d "docs/performance" ]; then
    mkdir -p docs/performance
fi
if [ ! -d "docs/testing" ]; then
    mkdir -p docs/testing
fi
if [ ! -d "docs/demos" ]; then
    mkdir -p docs/demos
fi
if [ ! -d "docs/guides" ]; then
    mkdir -p docs/guides
fi
if [ ! -d "docs/reference" ]; then
    mkdir -p docs/reference
fi
if [ ! -d "docs/architecture" ]; then
    mkdir -p docs/architecture
fi
if [ ! -d "docs/agents" ]; then
    mkdir -p docs/agents
fi
if [ ! -d "docs/validation" ]; then
    mkdir -p docs/validation
fi

echo "✅ Cleanup completed!"
echo ""
echo "📁 Current Directory Structure:"
echo "├── cli/                    # Core CLI implementation"
echo "├── agents/                 # AI agent definitions"
echo "├── cursor-rules/           # Cursor AI rules"
echo "├── docs/                   # Documentation (organized)"
echo "│   ├── completion-reports/ # Project completion reports"
echo "│   ├── demos/              # Demo scripts and tutorials"
echo "│   ├── guides/             # User guides"
echo "│   ├── reference/          # Technical reference"
echo "│   ├── architecture/       # System architecture docs"
echo "│   ├── agents/             # Agent documentation"
echo "│   ├── performance/        # Performance reports"
echo "│   ├── security/           # Security assessments"
echo "│   ├── testing/            # Test reports"
echo "│   └── validation/         # Validation tools"
echo "├── templates/              # Project templates"
echo "├── vscode-extension/       # VS Code extension"
echo "├── website/                # Web interface"
echo "├── CONTEXT.md              # Project context"
echo "├── IMPLEMENTATION-PLAN.md  # Implementation plan"
echo "├── QUICK-START.md          # Quick start guide"
echo "├── README.md               # Main documentation"
echo "└── package.json            # Project configuration"
echo ""
echo "🚀 Ultra-Dex v3.4.2 - Clean and Organized!"