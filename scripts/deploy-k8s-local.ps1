# =============================================================================
# TikTok Clone - Deploy to Local K8s (Docker Desktop/Minikube)
# =============================================================================
# Script này deploy ứng dụng lên K8s local với Helm
# Dành cho: Docker Desktop hoặc Minikube
# =============================================================================

param(
    [Parameter()]
    [ValidateSet('install', 'upgrade', 'uninstall', 'status', 'logs', 'restart', 'rollback')]
    [string]$Action = 'install',

    [Parameter()]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment = 'dev',

    [Parameter()]
    [string]$Service = 'all',

    [Parameter()]
    [switch]$SkipBuild,

    [Parameter()]
    [switch]$Watch,

    [Parameter()]
    [switch]$UseKubectl
)

$ErrorActionPreference = 'Stop'
$namespace = 'tiktok-clone'
$releaseName = 'tiktok-clone'
# Resolve chart path relative to the script location to avoid issues when running from other CWDs
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
$chartPath = [System.IO.Path]::GetFullPath((Join-Path $scriptRoot '..\helm\tiktok-clone'))
# Repository root (one level above scripts)
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptRoot '..'))

# Colors
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Info { Write-Host $args -ForegroundColor Cyan }
function Write-Warning { Write-Host $args -ForegroundColor Yellow }
function Write-Error { Write-Host $args -ForegroundColor Red }

# Banner
Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "     TikTok Clone - K8s Local Deployment (Helm)         " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Info "Environment: $Environment"
Write-Info "Method: $(if ($UseKubectl) { 'kubectl' } else { 'Helm' })"
Write-Host ""

# Check prerequisites
function Test-Prerequisites {
    Write-Info "Checking prerequisites..."

    # Check kubectl
    try {
        $null = kubectl version --client 2>$null
        Write-Success "kubectl is installed"
    } catch {
        Write-Error "kubectl not found. Please install kubectl first."
        exit 1
    }

    # Check Helm (if not using kubectl)
    if (-not $UseKubectl) {
        try {
            $null = helm version --short 2>$null
            Write-Success "Helm is installed"
        } catch {
            Write-Error "Helm not found. Please install Helm first."
            Write-Info "  Install: choco install kubernetes-helm"
            Write-Info "  Or use -UseKubectl flag to deploy without Helm"
            exit 1
        }
    }

    # Check K8s cluster
    try {
        $null = kubectl cluster-info 2>$null
        Write-Success "Kubernetes cluster is accessible"
    } catch {
        Write-Error "Cannot connect to Kubernetes cluster."
        Write-Warning "  Make sure Docker Desktop Kubernetes is enabled or Minikube is running."
        exit 1
    }

    # Check context
    $context = kubectl config current-context
    Write-Info "Current context: $context"
}

# Build Docker images
function Build-Images {
    if ($SkipBuild) {
        Write-Warning "Skipping image build..."
        return
    }

    Write-Info "Building Docker images..."

    $services = @('api-gateway', 'auth-service', 'video-service', 'interaction-service', 'notification-service')

    foreach ($svc in $services) {
        Write-Info "  Building $svc..."
        $dockerfile = Join-Path $repoRoot ("apps/$svc/Dockerfile")
        $context = $repoRoot
        Write-Info "    Dockerfile: $dockerfile"
        docker build -t "tiktok-${svc}:latest" -f "$dockerfile" "$context"
        if ($LASTEXITCODE -eq 0) {
            Write-Success "  Built $svc"
        } else {
            Write-Error "  Failed to build $svc"
            exit 1
        }
    }
}

# Deploy to K8s with Helm
function Deploy-WithHelm {
    Write-Info "Deploying with Helm..."

    # Determine values file
    $valuesFile = Join-Path $chartPath ("values-$Environment.yaml")
    Write-Info "Using values file: $valuesFile"

    # Check if release exists
    $releaseExists = $false
    try {
        $null = helm status $releaseName -n $namespace 2>$null
        $releaseExists = $true
        Write-Info "Release '$releaseName' already exists, will upgrade"
    } catch {
        Write-Info "Release '$releaseName' not found, will install"
    }

    # Install or upgrade
    if ($releaseExists) {
        Write-Info "Upgrading Helm release..."
        helm upgrade $releaseName $chartPath `
            -n $namespace `
            -f $valuesFile `
            --set global.imagePullPolicy=IfNotPresent `
            --wait `
            --timeout 5m
    } else {
        Write-Info "Installing Helm release..."
        helm install $releaseName $chartPath `
            -n $namespace `
            --create-namespace `
            -f $valuesFile `
            --set global.imagePullPolicy=IfNotPresent `
            --wait `
            --timeout 5m
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Helm deployment completed!"
        Write-Info ""
        Write-Info "Release Info:"
        helm status $releaseName -n $namespace
    } else {
        Write-Error "Helm deployment failed!"
        exit 1
    }
}

# Deploy to K8s with kubectl (legacy)
function Deploy-WithKubectl {
    Write-Info "Deploying with kubectl..."

    # Create namespace
    Write-Info "  Creating namespace..."
    kubectl apply -f k8s/infrastructure/namespace.yaml 2>&1 | Out-Null
    Write-Success "  Namespace created/updated"

    # Apply secrets
    Write-Info "  Applying secrets..."
    kubectl apply -f k8s/infrastructure/secrets.yaml
    Write-Success "  Secrets applied"

    # Apply configmaps
    Write-Info "  Applying configmaps..."
    kubectl apply -f k8s/infrastructure/configmap.yaml
    Write-Success "  ConfigMaps applied"

    # Deploy infrastructure
    Write-Info "  Deploying infrastructure..."
    kubectl apply -f k8s/infrastructure/postgres.yaml
    kubectl apply -f k8s/infrastructure/redis.yaml
    kubectl apply -f k8s/infrastructure/kafka.yaml
    Write-Success "  Infrastructure deployed"

    # Wait for infrastructure
    Write-Info "  Waiting for infrastructure to be ready..."
    Start-Sleep -Seconds 10

    # Deploy services
    Write-Info "  Deploying services..."
    kubectl apply -f k8s/services/auth-service.yaml
    kubectl apply -f k8s/services/video-service.yaml
    kubectl apply -f k8s/services/interaction-service.yaml
    kubectl apply -f k8s/services/notification-service.yaml
    kubectl apply -f k8s/services/api-gateway.yaml
    Write-Success "  Services deployed"

    Write-Success ""
    Write-Success "Deployment completed!"
}

# Delete all resources
function Remove-Deployment {
    Write-Warning "Deleting all resources..."

    $confirm = Read-Host "Are you sure you want to delete all resources? (yes/no)"
    if ($confirm -ne 'yes') {
        Write-Info "Cancelled."
        return
    }

    if ($UseKubectl) {
        kubectl delete namespace $namespace --ignore-not-found=true
    } else {
        # Uninstall Helm release
        Write-Info "Uninstalling Helm release..."
        helm uninstall $releaseName -n $namespace 2>$null

        # Delete namespace
        kubectl delete namespace $namespace --ignore-not-found=true 2>$null
    }

    Write-Success "Resources deleted"
}

# Show status
function Show-Status {
    Write-Info "Deployment Status"
    Write-Info ""

    if (-not $UseKubectl) {
        # Show Helm release info
        Write-Info "Helm Release:"
        helm list -n $namespace
        Write-Info ""

        Write-Info "Release Status:"
        helm status $releaseName -n $namespace 2>$null
        Write-Info ""
    }

    # Check namespace
    Write-Info "Namespace:"
    kubectl get namespace $namespace 2>&1
    Write-Info ""

    # Check pods
    Write-Info "Pods:"
    kubectl get pods -n $namespace -o wide
    Write-Info ""

    # Check services
    Write-Info "Services:"
    kubectl get svc -n $namespace
    Write-Info ""

    # Check deployments
    Write-Info "Deployments:"
    kubectl get deployments -n $namespace
    Write-Info ""

    # Check PVCs
    Write-Info "PersistentVolumeClaims:"
    kubectl get pvc -n $namespace
}

# Rollback deployment
function Rollback-Deployment {
    if ($UseKubectl) {
        Write-Error "Rollback is only available with Helm deployment"
        Write-Info "Use: .\scripts\deploy-k8s-local.ps1 -Action rollback"
        exit 1
    }

    Write-Info "Helm Release History:"
    helm history $releaseName -n $namespace
    Write-Info ""

    $revision = Read-Host "Enter revision number to rollback to (or 'cancel')"
    if ($revision -eq 'cancel') {
        Write-Info "Cancelled."
        return
    }

    Write-Info "Rolling back to revision $revision..."
    helm rollback $releaseName $revision -n $namespace --wait

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Rollback completed!"
        helm status $releaseName -n $namespace
    } else {
        Write-Error "Rollback failed!"
        exit 1
    }
}

# Show logs
function Show-Logs {
    if ($Service -eq 'all') {
        Write-Info "Available services:"
        Write-Info "  - api-gateway"
        Write-Info "  - auth-service"
        Write-Info "  - video-service"
        Write-Info "  - interaction-service"
        Write-Info "  - notification-service"
        Write-Info "  - postgres"
        Write-Info "  - redis"
        Write-Info "  - kafka"
        Write-Info ""
        Write-Warning "Please specify a service with -Service parameter"
        return
    }

    Write-Info "Logs for $Service..."

    if ($Watch) {
        kubectl logs -f deployment/$Service -n $namespace
    } else {
        kubectl logs deployment/$Service -n $namespace --tail=100
    }
}

# Restart deployment
function Restart-Deployment {
    if ($Service -eq 'all') {
        Write-Info "Restarting all services..."
        kubectl rollout restart deployment -n $namespace
    } else {
        Write-Info "Restarting $Service..."
        kubectl rollout restart deployment/$Service -n $namespace
    }
    Write-Success "Restart initiated"
}

# Main execution
try {
    Test-Prerequisites

    switch ($Action) {
        'install' {
            Build-Images
            if ($UseKubectl) {
                Deploy-WithKubectl
            } else {
                Deploy-WithHelm
            }
            Write-Info ""
            Write-Info "Waiting for pods to be ready..."
            Start-Sleep -Seconds 5
            Show-Status
        }
        'upgrade' {
            Build-Images
            if ($UseKubectl) {
                Write-Warning "Upgrade with kubectl - will reapply manifests"
                Deploy-WithKubectl
            } else {
                Deploy-WithHelm
            }
            Show-Status
        }
        'uninstall' {
            Remove-Deployment
        }
        'status' {
            Show-Status
        }
        'logs' {
            Show-Logs
        }
        'restart' {
            Restart-Deployment
        }
        'rollback' {
            Rollback-Deployment
        }
    }

    Write-Success ""
    Write-Success "Action '$Action' completed successfully!"
    Write-Info ""
    Write-Info "Quick commands:"
    if ($UseKubectl) {
        Write-Info "  Status:   .\scripts\deploy-k8s-local.ps1 -Action status -UseKubectl"
        Write-Info "  Logs:     .\scripts\deploy-k8s-local.ps1 -Action logs -Service api-gateway -UseKubectl"
        Write-Info "  Delete:   .\scripts\deploy-k8s-local.ps1 -Action uninstall -UseKubectl"
    } else {
        Write-Info "  Status:   .\scripts\deploy-k8s-local.ps1 -Action status"
        Write-Info "  Upgrade:  .\scripts\deploy-k8s-local.ps1 -Action upgrade"
        Write-Info "  Rollback: .\scripts\deploy-k8s-local.ps1 -Action rollback"
        Write-Info "  Logs:     .\scripts\deploy-k8s-local.ps1 -Action logs -Service api-gateway"
    }

} catch {
    Write-Error "Error: $_"
    Write-Error $_.ScriptStackTrace
    exit 1
}
