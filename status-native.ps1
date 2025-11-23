#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check the status of all services
.DESCRIPTION
    This script checks the status of infrastructure containers and microservices
.EXAMPLE
    .\status-native.ps1
#>

function Write-Header {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host " $Message" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta
}

Write-Header "Service Status Check"

# Check infrastructure containers
Write-Host "Infrastructure Services (Docker):" -ForegroundColor Cyan
Write-Host "----------------------------------------`n" -ForegroundColor Cyan

$containers = @("tiktok_postgres", "tiktok_redis", "tiktok_kafka", "tiktok_zookeeper", "tiktok_rabbitmq")

foreach ($container in $containers) {
    $status = docker inspect --format='{{.State.Status}}' $container 2>$null
    $health = docker inspect --format='{{.State.Health.Status}}' $container 2>$null
    
    if ($status) {
        $statusColor = if ($status -eq "running") { "Green" } else { "Red" }
        $healthInfo = if ($health) { " (Health: $health)" } else { "" }
        Write-Host "  $container : " -NoNewline
        Write-Host "$status$healthInfo" -ForegroundColor $statusColor
    } else {
        Write-Host "  $container : " -NoNewline
        Write-Host "Not Running" -ForegroundColor Gray
    }
}

# Check microservices
Write-Host "`nMicroservices (Native):" -ForegroundColor Cyan
Write-Host "----------------------------------------`n" -ForegroundColor Cyan

$ports = @{
    "Auth Service (3001)" = 3001
    "Video Service (3002)" = 3002
    "Interaction Service (3003)" = 3003
    "Notification Service (3004)" = 3004
    "API Gateway (3000)" = 3000
}

foreach ($service in $ports.GetEnumerator()) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $service.Value -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($connection) {
            Write-Host "  $($service.Key) : " -NoNewline
            Write-Host "Running ✓" -ForegroundColor Green
        } else {
            Write-Host "  $($service.Key) : " -NoNewline
            Write-Host "Not Running ✗" -ForegroundColor Red
        }
    } catch {
        Write-Host "  $($service.Key) : " -NoNewline
        Write-Host "Not Running ✗" -ForegroundColor Red
    }
}

# Check Node.js processes
Write-Host "`nNode.js Processes:" -ForegroundColor Cyan
Write-Host "----------------------------------------`n" -ForegroundColor Cyan

$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "  Total Node.js processes: $($nodeProcesses.Count)" -ForegroundColor Green
    $nodeProcesses | Select-Object Id, ProcessName, StartTime, @{Name='Memory(MB)';Expression={[math]::Round($_.WorkingSet64/1MB,2)}} | Format-Table -AutoSize
} else {
    Write-Host "  No Node.js processes running" -ForegroundColor Gray
}

# Check frontend
Write-Host "`nFrontend:" -ForegroundColor Cyan
Write-Host "----------------------------------------`n" -ForegroundColor Cyan

try {
    $frontendConnection = Test-NetConnection -ComputerName localhost -Port 3001 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($frontendConnection) {
        Write-Host "  Next.js Frontend (3001) : " -NoNewline
        Write-Host "Running ✓" -ForegroundColor Green
    } else {
        Write-Host "  Next.js Frontend (3001) : " -NoNewline
        Write-Host "Not Running ✗" -ForegroundColor Red
    }
} catch {
    Write-Host "  Next.js Frontend (3001) : " -NoNewline
    Write-Host "Not Running ✗" -ForegroundColor Red
}

Write-Host "`n========================================`n" -ForegroundColor Magenta
