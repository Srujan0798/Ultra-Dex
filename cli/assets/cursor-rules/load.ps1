# Ultra-Dex Cursor Rules Loader for Windows
# Usage: .\load.ps1 [domain|core|all]

param(
    [Parameter(Position=0)]
    [string]$Selection = "core"
)

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$TARGET_DIR = ".cursor\rules"

# Create target directory if it doesn't exist
if (!(Test-Path $TARGET_DIR)) {
    New-Item -ItemType Directory -Path $TARGET_DIR -Force | Out-Null
}

function Copy-Rules {
    param([string[]]$Files)
    foreach ($file in $Files) {
        $sourcePath = Join-Path $SCRIPT_DIR $file
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath -Destination $TARGET_DIR -Force
            Write-Host "  Copied: $file" -ForegroundColor Green
        } else {
            Write-Host "  Not found: $file" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Ultra-Dex Cursor Rules Loader" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

switch ($Selection.ToLower()) {
    "core" {
        Write-Host "Loading core rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc")
    }
    "database" {
        Write-Host "Loading database rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "01-database.mdc")
    }
    "api" {
        Write-Host "Loading API rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "02-api.mdc")
    }
    "auth" {
        Write-Host "Loading auth rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "03-auth.mdc")
    }
    "frontend" {
        Write-Host "Loading frontend rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "04-frontend.mdc")
    }
    "payments" {
        Write-Host "Loading payments rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "05-payments.mdc")
    }
    "testing" {
        Write-Host "Loading testing rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "06-testing.mdc")
    }
    "security" {
        Write-Host "Loading security rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "07-security.mdc")
    }
    "deployment" {
        Write-Host "Loading deployment rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "08-deployment.mdc")
    }
    "errors" {
        Write-Host "Loading error handling rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "09-error-handling.mdc")
    }
    "performance" {
        Write-Host "Loading performance rules..." -ForegroundColor White
        Copy-Rules @("00-ultra-dex-core.mdc", "10-performance.mdc")
    }
    "all" {
        Write-Host "Loading ALL rules..." -ForegroundColor White
        $allFiles = Get-ChildItem -Path $SCRIPT_DIR -Filter "*.mdc" | Select-Object -ExpandProperty Name
        Copy-Rules $allFiles
    }
    default {
        Write-Host "Usage: .\load.ps1 [option]" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Options:" -ForegroundColor White
        Write-Host "  core        Load core rules only (default)"
        Write-Host "  database    Load core + database rules"
        Write-Host "  api         Load core + API rules"
        Write-Host "  auth        Load core + auth rules"
        Write-Host "  frontend    Load core + frontend rules"
        Write-Host "  payments    Load core + payments rules"
        Write-Host "  testing     Load core + testing rules"
        Write-Host "  security    Load core + security rules"
        Write-Host "  deployment  Load core + deployment rules"
        Write-Host "  errors      Load core + error handling rules"
        Write-Host "  performance Load core + performance rules"
        Write-Host "  all         Load ALL rules"
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "Rules loaded to: $TARGET_DIR" -ForegroundColor Green
Write-Host ""
