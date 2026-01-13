# TikTok Clone - K8s Local Deployment Quick Guide

## 🚀 Quick Start

### Option 1: Sử dụng Script (Recommended)

```powershell
# Deploy tất cả
.\scripts\deploy-k8s-local.ps1

# Xóa tất cả
.\scripts\deploy-k8s-local.ps1 -Action delete

# Check status
.\scripts\deploy-k8s-local.ps1 -Action status

# Xem logs
.\scripts\deploy-k8s-local.ps1 -Action logs -Service api-gateway -Watch

# Restart service
.\scripts\deploy-k8s-local.ps1 -Action restart -Service api-gateway

# Deploy nhưng skip build (nếu đã build images)
.\scripts\deploy-k8s-local.ps1 -SkipBuild
```

### Option 2: Manual Commands

```powershell
# 1. Build Docker images
docker build -t tiktok-api-gateway:latest -f apps/api-gateway/Dockerfile .
docker build -t tiktok-auth-service:latest -f apps/auth-service/Dockerfile .
docker build -t tiktok-video-service:latest -f apps/video-service/Dockerfile .
docker build -t tiktok-interaction-service:latest -f apps/interaction-service/Dockerfile .
docker build -t tiktok-notification-service:latest -f apps/notification-service/Dockerfile .

# 2. Deploy infrastructure
kubectl apply -f k8s/infrastructure/namespace.yaml
kubectl apply -f k8s/infrastructure/secrets.yaml
kubectl apply -f k8s/infrastructure/configmap.yaml
kubectl apply -f k8s/infrastructure/postgres.yaml
kubectl apply -f k8s/infrastructure/redis.yaml
kubectl apply -f k8s/infrastructure/kafka.yaml

# 3. Deploy services
kubectl apply -f k8s/services/auth-service.yaml
kubectl apply -f k8s/services/video-service.yaml
kubectl apply -f k8s/services/interaction-service.yaml
kubectl apply -f k8s/services/notification-service.yaml
kubectl apply -f k8s/services/api-gateway.yaml

# 4. Check status
kubectl get pods -n tiktok-clone
kubectl get svc -n tiktok-clone
```

## 🔐 Updated Credentials

**Database:**

- Username: `postgres`
- Password: `TikTok@DB#2026!Secure`

**Grafana:**

- Password: `Grafana@Admin#2026!`

**PgAdmin:**

- Password: `PgAdmin@2026!Secure`

**JWT Secrets:**

- Access: `TikTok-JWT-Access-2026-a9f8d7c6b5e4d3c2b1a0987654321fed`
- Refresh: `TikTok-JWT-Refresh-2026-1234567890abcdef1234567890abcdef`

## 📝 Useful Commands

```powershell
# Get all resources
kubectl get all -n tiktok-clone

# Describe pod
kubectl describe pod <pod-name> -n tiktok-clone

# Logs
kubectl logs -f deployment/api-gateway -n tiktok-clone
kubectl logs -f deployment/auth-service -n tiktok-clone

# Port forward API Gateway
kubectl port-forward svc/api-gateway 4000:4000 -n tiktok-clone

# Port forward PostgreSQL
kubectl port-forward svc/postgres 5432:5432 -n tiktok-clone

# Execute into pod
kubectl exec -it deployment/api-gateway -n tiktok-clone -- /bin/sh

# Delete specific deployment
kubectl delete deployment api-gateway -n tiktok-clone

# Restart deployment
kubectl rollout restart deployment/api-gateway -n tiktok-clone

# Scale deployment
kubectl scale deployment api-gateway --replicas=3 -n tiktok-clone

# Check events
kubectl get events -n tiktok-clone --sort-by='.lastTimestamp'
```

## 🐛 Troubleshooting

### Pods không start

```powershell
# Check pod status
kubectl get pods -n tiktok-clone

# Check pod details
kubectl describe pod <pod-name> -n tiktok-clone

# Check logs
kubectl logs <pod-name> -n tiktok-clone
```

### Image pull errors

```powershell
# Make sure images are built locally
docker images | findstr tiktok

# If using Minikube, load images
minikube image load tiktok-api-gateway:latest
```

### PersistentVolume issues

```powershell
# Check PV and PVC
kubectl get pv,pvc -n tiktok-clone

# For Docker Desktop, make sure path exists
# Default paths: /mnt/data/postgres, /mnt/data/redis, /mnt/data/kafka
```

### Service không accessible

```powershell
# Check service
kubectl get svc -n tiktok-clone

# For Docker Desktop, LoadBalancer should show localhost
# If pending, use port-forward instead
kubectl port-forward svc/api-gateway 4000:4000 -n tiktok-clone
```

## 🧪 Test Endpoints

```powershell
# After port-forward or if LoadBalancer works
# Health check
curl http://localhost:4000/health

# Auth endpoints
curl http://localhost:4000/auth/health

# Video endpoints
curl http://localhost:4000/videos/health
```

## 🔄 Update Deployment

```powershell
# After code changes, rebuild and restart
docker build -t tiktok-api-gateway:latest -f apps/api-gateway/Dockerfile .
kubectl rollout restart deployment/api-gateway -n tiktok-clone
```

## 🗑️ Clean Up

```powershell
# Using script
.\scripts\deploy-k8s-local.ps1 -Action delete

# Or manual
kubectl delete namespace tiktok-clone
```
