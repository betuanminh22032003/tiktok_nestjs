# 🚀 TikTok Clone - Helm Deployment Guide

## ✨ Why Helm?

Helm provides:

- **Templating:** Reuse configurations across environments
- **Versioning:** Track deployment history and rollback easily
- **Package Management:** Bundle all resources together
- **Values Management:** Environment-specific configurations

---

## 🎯 Quick Start

### Install with Helm (Recommended)

```powershell
# Deploy to dev environment (default)
.\scripts\deploy-k8s-local.ps1

# Or explicitly specify environment
.\scripts\deploy-k8s-local.ps1 -Action install -Environment dev

# Deploy to staging/prod
.\scripts\deploy-k8s-local.ps1 -Action install -Environment staging
.\scripts\deploy-k8s-local.ps1 -Action install -Environment prod
```

### Upgrade Deployment

```powershell
# After making changes, upgrade the release
.\scripts\deploy-k8s-local.ps1 -Action upgrade

# Skip image rebuild if not needed
.\scripts\deploy-k8s-local.ps1 -Action upgrade -SkipBuild
```

### Check Status

```powershell
# View Helm release and pod status
.\scripts\deploy-k8s-local.ps1 -Action status
```

### Rollback

```powershell
# View history and rollback to previous version
.\scripts\deploy-k8s-local.ps1 -Action rollback
```

### Uninstall

```powershell
# Remove all resources
.\scripts\deploy-k8s-local.ps1 -Action uninstall
```

---

## 📋 Script Parameters

| Parameter      | Values                                                                     | Default   | Description                 |
| -------------- | -------------------------------------------------------------------------- | --------- | --------------------------- |
| `-Action`      | `install`, `upgrade`, `uninstall`, `status`, `logs`, `restart`, `rollback` | `install` | Action to perform           |
| `-Environment` | `dev`, `staging`, `prod`                                                   | `dev`     | Target environment          |
| `-Service`     | Service name or `all`                                                      | `all`     | For logs/restart            |
| `-SkipBuild`   | Switch                                                                     | -         | Skip Docker image build     |
| `-Watch`       | Switch                                                                     | -         | Follow logs (tail -f)       |
| `-UseKubectl`  | Switch                                                                     | -         | Use kubectl instead of Helm |

---

## 🎨 Complete Examples

### Basic Workflows

```powershell
# 1. First time deployment
.\scripts\deploy-k8s-local.ps1 -Action install -Environment dev

# 2. Check everything is running
.\scripts\deploy-k8s-local.ps1 -Action status

# 3. View API Gateway logs
.\scripts\deploy-k8s-local.ps1 -Action logs -Service api-gateway -Watch

# 4. Update code and upgrade
# ... make code changes ...
.\scripts\deploy-k8s-local.ps1 -Action upgrade

# 5. If something goes wrong, rollback
.\scripts\deploy-k8s-local.ps1 -Action rollback

# 6. Clean up when done
.\scripts\deploy-k8s-local.ps1 -Action uninstall
```

### Advanced Usage

```powershell
# Deploy without building images (if already built)
.\scripts\deploy-k8s-local.ps1 -Action install -SkipBuild

# Upgrade specific environment
.\scripts\deploy-k8s-local.ps1 -Action upgrade -Environment staging

# View logs of specific service
.\scripts\deploy-k8s-local.ps1 -Action logs -Service auth-service

# Restart specific service
.\scripts\deploy-k8s-local.ps1 -Action restart -Service video-service

# Use kubectl method (legacy)
.\scripts\deploy-k8s-local.ps1 -Action install -UseKubectl
```

---

## 🎛️ Direct Helm Commands

### Installation

```powershell
# Install with default values (dev)
helm install tiktok-clone ./helm/tiktok-clone -n tiktok-clone --create-namespace

# Install with specific environment
helm install tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone --create-namespace `
  -f helm/tiktok-clone/values-dev.yaml

# Install for production
helm install tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone --create-namespace `
  -f helm/tiktok-clone/values-prod.yaml
```

### Upgrade

```powershell
# Upgrade release
helm upgrade tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone `
  -f helm/tiktok-clone/values-dev.yaml

# Upgrade with wait
helm upgrade tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone `
  -f helm/tiktok-clone/values-dev.yaml `
  --wait --timeout 5m
```

### Status & History

```powershell
# List releases
helm list -n tiktok-clone

# Show release status
helm status tiktok-clone -n tiktok-clone

# Show release history
helm history tiktok-clone -n tiktok-clone

# Get values
helm get values tiktok-clone -n tiktok-clone

# Get all manifests
helm get manifest tiktok-clone -n tiktok-clone
```

### Rollback

```powershell
# Rollback to previous version
helm rollback tiktok-clone -n tiktok-clone

# Rollback to specific revision
helm rollback tiktok-clone 2 -n tiktok-clone

# Rollback with wait
helm rollback tiktok-clone 2 -n tiktok-clone --wait
```

### Uninstall

```powershell
# Uninstall release
helm uninstall tiktok-clone -n tiktok-clone

# Keep history
helm uninstall tiktok-clone -n tiktok-clone --keep-history
```

---

## 📁 Helm Chart Structure

```
helm/tiktok-clone/
├── Chart.yaml                    # Chart metadata
├── values.yaml                   # Default values
├── values-dev.yaml              # Dev environment overrides
├── values-staging.yaml          # Staging environment overrides
├── values-prod.yaml             # Production environment overrides
└── templates/                    # K8s resource templates
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secrets.yaml
    ├── postgres.yaml
    ├── redis.yaml
    ├── kafka.yaml
    ├── auth-service.yaml
    ├── video-service.yaml
    ├── interaction-service.yaml
    ├── notification-service.yaml
    └── api-gateway.yaml
```

---

## 🔧 Customizing Values

### Override via Command Line

```powershell
# Override specific values
helm install tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone --create-namespace `
  --set postgresql.auth.password=MySecretPassword `
  --set services.auth.replicas=3

# Override from file
helm install tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone --create-namespace `
  -f helm/tiktok-clone/values-dev.yaml `
  -f my-custom-values.yaml
```

### Environment-Specific Values

**values-dev.yaml:**

```yaml
services:
  auth:
    replicas: 1
  video:
    replicas: 1
```

**values-prod.yaml:**

```yaml
services:
  auth:
    replicas: 3
    autoscaling:
      minReplicas: 3
      maxReplicas: 10
  video:
    replicas: 3
    autoscaling:
      minReplicas: 3
      maxReplicas: 10
```

---

## 🧪 Testing Before Install

### Dry Run

```powershell
# Preview what will be installed
helm install tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone `
  -f helm/tiktok-clone/values-dev.yaml `
  --dry-run --debug

# Or with upgrade
helm upgrade tiktok-clone ./helm/tiktok-clone `
  -n tiktok-clone `
  -f helm/tiktok-clone/values-dev.yaml `
  --dry-run --debug
```

### Template Rendering

```powershell
# Render templates locally
helm template tiktok-clone ./helm/tiktok-clone `
  -f helm/tiktok-clone/values-dev.yaml

# Save rendered templates to file
helm template tiktok-clone ./helm/tiktok-clone `
  -f helm/tiktok-clone/values-dev.yaml > rendered.yaml
```

### Lint

```powershell
# Validate chart
helm lint ./helm/tiktok-clone

# Lint with values
helm lint ./helm/tiktok-clone -f helm/tiktok-clone/values-dev.yaml
```

---

## 🐛 Troubleshooting

### Helm Not Found

```powershell
# Install Helm
choco install kubernetes-helm

# Or download from: https://helm.sh/docs/intro/install/
```

### Release Already Exists

```powershell
# Use upgrade instead
.\scripts\deploy-k8s-local.ps1 -Action upgrade

# Or delete first
helm uninstall tiktok-clone -n tiktok-clone
.\scripts\deploy-k8s-local.ps1 -Action install
```

### Failed Install

```powershell
# Check release status
helm status tiktok-clone -n tiktok-clone

# View events
kubectl get events -n tiktok-clone --sort-by='.lastTimestamp'

# Check pod logs
kubectl logs -n tiktok-clone -l app=api-gateway

# Uninstall and retry
helm uninstall tiktok-clone -n tiktok-clone
.\scripts\deploy-k8s-local.ps1 -Action install
```

### Rollback Issues

```powershell
# View history
helm history tiktok-clone -n tiktok-clone

# Force rollback
helm rollback tiktok-clone 1 -n tiktok-clone --force

# Or uninstall and reinstall
helm uninstall tiktok-clone -n tiktok-clone
.\scripts\deploy-k8s-local.ps1 -Action install
```

---

## 📊 Comparison: Helm vs kubectl

| Feature        | Helm                      | kubectl                    |
| -------------- | ------------------------- | -------------------------- |
| **Deployment** | `helm install`            | `kubectl apply -f`         |
| **Update**     | `helm upgrade`            | `kubectl apply -f`         |
| **Rollback**   | ✅ `helm rollback`        | ❌ Manual                  |
| **History**    | ✅ `helm history`         | ❌ No built-in             |
| **Templating** | ✅ Yes                    | ❌ No                      |
| **Multi-env**  | ✅ Easy with values files | ⚠️ Need multiple manifests |
| **Package**    | ✅ Single chart           | ❌ Multiple files          |
| **Version**    | ✅ Automatic              | ❌ Manual                  |

---

## 🎯 Best Practices

1. **Use values files for environments**

   ```powershell
   # Don't hardcode in templates
   helm install ... -f values-prod.yaml
   ```

2. **Always use --wait for critical deployments**

   ```powershell
   helm install ... --wait --timeout 5m
   ```

3. **Test before deploying**

   ```powershell
   helm lint ./helm/tiktok-clone
   helm install ... --dry-run --debug
   ```

4. **Keep history for rollbacks**

   ```powershell
   # Don't use --keep-history=false
   helm uninstall tiktok-clone -n tiktok-clone
   ```

5. **Use semantic versioning in Chart.yaml**
   ```yaml
   version: 1.2.3
   appVersion: '2026.01.13'
   ```

---

## 📚 Additional Resources

- **Helm Documentation:** https://helm.sh/docs/
- **Helm Charts Best Practices:** https://helm.sh/docs/chart_best_practices/
- **Chart Template Guide:** https://helm.sh/docs/chart_template_guide/

---

**Quick Reference:** See [K8S_LOCAL_CHEATSHEET.txt](K8S_LOCAL_CHEATSHEET.txt)
**Setup Guide:** See [K8S_SETUP_DOCKER_DESKTOP.md](K8S_SETUP_DOCKER_DESKTOP.md)
