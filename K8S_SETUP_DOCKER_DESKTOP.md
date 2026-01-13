# 🐳 Setup Docker Desktop Kubernetes for TikTok Clone

## Prerequisites Check

Before deploying to K8s local, make sure Docker Desktop Kubernetes is running.

## Step 1: Enable Kubernetes in Docker Desktop

### Windows

1. **Open Docker Desktop**
   - Right-click Docker icon in system tray
   - Click "Docker Desktop"

2. **Enable Kubernetes**
   - Go to **Settings** ⚙️ (top right)
   - Click **Kubernetes** in left menu
   - ✅ Check **Enable Kubernetes**
   - Click **Apply & Restart**

3. **Wait for Kubernetes to start**
   - Status should show: ✅ Kubernetes is running
   - This may take 3-5 minutes

### Verify Installation

```powershell
# Check kubectl is installed
kubectl version --client

# Check cluster is running
kubectl cluster-info

# Expected output:
# Kubernetes control plane is running at https://kubernetes.docker.internal:6443
# CoreDNS is running at https://kubernetes.docker.internal:6443/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy
```

## Step 2: Verify Resources

```powershell
# Check nodes
kubectl get nodes

# Expected output:
# NAME             STATUS   ROLES           AGE   VERSION
# docker-desktop   Ready    control-plane   1d    v1.28.x

# Check default namespaces
kubectl get namespaces

# Check current context
kubectl config current-context
# Should show: docker-desktop
```

## Step 3: Configure Resources (Optional)

Docker Desktop default allocations:

- **Memory:** 2GB (minimum 4GB recommended)
- **CPUs:** 2 cores (4 cores recommended)
- **Disk:** 60GB

### To adjust resources:

1. Docker Desktop → **Settings** → **Resources**
2. Adjust sliders:
   - **Memory:** 6GB or more
   - **CPUs:** 4 or more
3. Click **Apply & Restart**

## Step 4: Test Deployment

```powershell
# Quick test with nginx
kubectl create deployment nginx --image=nginx
kubectl expose deployment nginx --port=80 --type=LoadBalancer

# Wait a moment, then check
kubectl get svc nginx

# Should show:
# NAME    TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
# nginx   LoadBalancer   10.96.xxx.xxx   localhost     80:xxxxx/TCP   1m

# Test access
curl http://localhost:80

# Cleanup
kubectl delete deployment nginx
kubectl delete service nginx
```

## Alternative: Using Minikube

If Docker Desktop doesn't work or you prefer Minikube:

### Install Minikube

```powershell
# Using Chocolatey
choco install minikube

# Or download from: https://minikube.sigs.k8s.io/docs/start/
```

### Start Minikube

```powershell
# Start with Docker driver
minikube start --driver=docker --cpus=4 --memory=6144

# Or with Hyper-V (Windows Pro/Enterprise)
minikube start --driver=hyperv --cpus=4 --memory=6144

# Check status
minikube status

# Enable metrics-server (for HPA)
minikube addons enable metrics-server

# For LoadBalancer services
minikube tunnel
# Keep this running in a separate terminal
```

### Minikube-specific commands

```powershell
# Load Docker images to Minikube
minikube image load tiktok-api-gateway:latest
minikube image load tiktok-auth-service:latest
# ... repeat for all services

# Get service URL
minikube service api-gateway -n tiktok-clone

# Dashboard
minikube dashboard
```

## Common Issues

### Issue 1: "Unable to connect to server"

**Solution:**

- Make sure Kubernetes is enabled in Docker Desktop
- Restart Docker Desktop
- Check Docker is running

### Issue 2: "ImagePullBackOff"

For Docker Desktop:

```powershell
# Images should be built locally
docker images | findstr tiktok

# Make sure imagePullPolicy is IfNotPresent or Never
```

For Minikube:

```powershell
# Load images into Minikube
minikube image load tiktok-api-gateway:latest
```

### Issue 3: LoadBalancer Pending

**Docker Desktop:** Should work automatically with `localhost`

**Minikube:**

```powershell
# Run in separate terminal
minikube tunnel
```

**Alternative:** Use NodePort or port-forward

```powershell
# Change service type to NodePort
# Or use port-forward
kubectl port-forward svc/api-gateway 4000:4000 -n tiktok-clone
```

### Issue 4: Insufficient resources

```powershell
# Check resource usage
kubectl top nodes
kubectl top pods -n tiktok-clone

# Increase Docker Desktop resources in Settings
```

## Next Steps

Once K8s is running:

```powershell
# Deploy TikTok Clone
.\scripts\deploy-k8s-local.ps1

# Or follow K8S_LOCAL_QUICK_START.md
```

## Useful Commands

```powershell
# Reset Kubernetes (Docker Desktop)
# Settings → Kubernetes → Reset Kubernetes Cluster

# Switch contexts (if multiple clusters)
kubectl config get-contexts
kubectl config use-context docker-desktop

# View all resources
kubectl get all --all-namespaces
```

## Resource Requirements

**Minimum:**

- Docker Desktop: 4GB RAM, 2 CPUs
- Disk: 20GB free

**Recommended:**

- Docker Desktop: 8GB RAM, 4 CPUs
- Disk: 40GB free

**Running TikTok Clone:**

- 5 microservices (~2GB)
- PostgreSQL (~256MB)
- Redis (~128MB)
- Kafka (~512MB)
- **Total:** ~3GB RAM
