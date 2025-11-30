#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick development setup for TikTok Clone
.DESCRIPTION
    This script provides shortcuts for common development tasks.
    It's a wrapper around run-native.ps1 with simplified commands.
.EXAMPLE
    .\dev.ps1
    Start everything (infrastructure + all services + frontend)
.EXAMPLE
    .\dev.ps1 infra
    Start only infrastructure
.EXAMPLE
    .\dev.ps1 services
    Start services only (skip infrastructure)
.EXAMPLE
    .\dev.ps1 stop
    Stop everything
#>

param(
    [string]$Action = "all"
)

# Color output functions
function Write-Dev-Info {
    param([string]$Message)
    Write-Host "[DEV] $Message" -ForegroundColor Cyan
}

function Write-Dev-Success {
    param([string]$Message)
    Write-Host "[DEV] $Message" -ForegroundColor Green
}

function Write-Dev-Error {
    param([string]$Message)
    Write-Host "[DEV] $Message" -ForegroundColor Red
}

Write-Host @"

╔══════════════════════════════════════════════════════════════╗
║                    🚀 TikTok Clone Dev Tool                  ║
║                                                              ║
║  Quick commands for development:                             ║
║    .\dev.ps1          - Start everything                    ║
║    .\dev.ps1 infra    - Infrastructure only                 ║
║    .\dev.ps1 services - Services only (skip infra)          ║
║    .\dev.ps1 stop     - Stop everything                     ║
╚══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Magenta

switch ($Action.ToLower()) {
    "all" {
        Write-Dev-Info "Starting complete development environment..."
        .\scripts\run-native.ps1
    }
    "infra" {
        Write-Dev-Info "Starting infrastructure only..."
        .\scripts\run-native.ps1 -InfraOnly
    }
    "services" {
        Write-Dev-Info "Starting services only (skipping infrastructure)..."
        .\scripts\run-native.ps1 -SkipInfra
    }
    "backend" {
        Write-Dev-Info "Starting backend services only (no frontend)..."
        .\scripts\run-native.ps1 -SkipFrontend
    }
    "stop" {
        Write-Dev-Info "Stopping all services..."
        .\scripts\run-native.ps1 -StopOnly
    }
    "status" {
        Write-Dev-Info "Checking service status..."
        if (Test-Path "scripts\status-native.ps1") {
            .\scripts\status-native.ps1
        } else {
            Write-Dev-Info "Checking Docker containers..."
            docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | Where-Object { $_ -match "tiktok_|NAME" }

            Write-Dev-Info "`nChecking Node.js processes..."
            Get-Process -Name node -ErrorAction SilentlyContinue | ForEach-Object {
                Write-Host "Node.js process running (PID: $($_.Id))" -ForegroundColor Yellow
            }
        }
    }
    "help" {
        Write-Host @"

Available commands:
  all      - Start infrastructure + services + frontend (default)
  infra    - Start only infrastructure (Docker containers)
  services - Start only services (skip infrastructure)
  backend  - Start services without frontend
  stop     - Stop all services and infrastructure
  status   - Check current service status
  help     - Show this help message

Examples:
  .\dev.ps1                # Full development setup
  .\dev.ps1 infra         # Just start databases/messaging
  .\dev.ps1 services      # Start microservices (infra must be running)
  .\dev.ps1 backend       # Backend services only
  .\dev.ps1 stop          # Stop everything

"@ -ForegroundColor White
    }
    default {
        Write-Dev-Error "Unknown action: $Action"
        Write-Dev-Info "Use .\dev.ps1 help to see available commands"
        exit 1
    }
}
