#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop all native microservices and infrastructure containers
.DESCRIPTION
    This script stops all running microservices and infrastructure Docker containers
.EXAMPLE
    .\stop-native.ps1
    Stops all services
.EXAMPLE
    .\stop-native.ps1 -InfraOnly
    Only stops infrastructure containers
.EXAMPLE
    .\stop-native.ps1 -ServicesOnly
    Only stops microservices
#>

param(
    [switch]$InfraOnly,
    [switch]$ServicesOnly
)

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host " Stopping TikTok Clone Services" -ForegroundColor Magenta
Write-Host "========================================`n" -ForegroundColor Magenta

# Stop microservices
if (-not $InfraOnly) {
    Write-Info "Stopping Node.js microservices..."
    
    # Get all Node.js processes
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    
    if ($nodeProcesses) {
        foreach ($proc in $nodeProcesses) {
            try {
                $proc | Stop-Process -Force
                Write-Success "Stopped process: $($proc.Id)"
            } catch {
                Write-Host "[WARNING] Could not stop process: $($proc.Id)" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Info "No Node.js processes found"
    }
    
    Write-Success "Microservices stopped"
}

# Stop infrastructure
if (-not $ServicesOnly) {
    Write-Info "Stopping infrastructure containers..."
    
    if (Test-Path "docker-compose.infra.yml") {
        docker-compose -f docker-compose.infra.yml down
    } else {
        docker-compose down
    }
    
    Write-Success "Infrastructure containers stopped"
}

Write-Success "`nAll services stopped successfully!"
