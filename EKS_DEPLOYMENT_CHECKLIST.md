# 🚀 EKS & K8s Deployment Checklist

> **Ngày tạo:** 13/01/2026
> **Trạng thái:** 🟡 In Progress

---

## 📊 Tổng quan

| Môi trường    | Trạng thái             | Tiến độ | Ước tính  |
| ------------- | ---------------------- | ------- | --------- |
| **K8s Local** | ✅ **Sẵn sàng deploy** | 100%    | Ready!    |
| **AWS EKS**   | 🔴 Chưa sẵn sàng       | 40%     | ~2-3 ngày |

> 🎉 **Phase 1 COMPLETED!** See [PHASE1_COMPLETE.md](PHASE1_COMPLETE.md) for details.

---

## ✅ NHỮNG GÌ ĐÃ CÓ

| #   | Thành phần                  | Trạng thái | File/Folder                                                                 |
| --- | --------------------------- | ---------- | --------------------------------------------------------------------------- |
| 1   | Helm Charts                 | ✅         | `helm/tiktok-clone/`                                                        |
| 2   | Values cho 3 môi trường     | ✅         | `values.yaml`, `values-dev.yaml`, `values-staging.yaml`, `values-prod.yaml` |
| 3   | K8s manifests               | ✅         | `k8s/infrastructure/`, `k8s/services/`                                      |
| 4   | Dockerfiles (5 services)    | ✅         | `apps/*/Dockerfile`                                                         |
| 5   | ArgoCD configurations       | ✅         | `argocd/`                                                                   |
| 6   | Terraform cho Helm releases | ✅         | `terraform/`                                                                |
| 7   | CI/CD pipelines             | ✅         | `.github/workflows/cd.yml`                                                  |
| 8   | ConfigMaps                  | ✅         | `k8s/infrastructure/configmap.yaml`                                         |
| 9   | Secrets templates           | ✅         | `k8s/infrastructure/secrets.yaml`                                           |
| 10  | HPA (autoscaling)           | ✅         | Trong Helm templates                                                        |
| 11  | Health checks               | ✅         | Liveness/Readiness probes                                                   |

---

## 🔧 PHASE 1: K8s LOCAL

### Checklist

- [x] **1.1** Đổi database passwords trong `k8s/infrastructure/secrets.yaml`
  - [x] `DB_PASSWORD`: đổi từ `postgres` → `TikTok@DB#2026!Secure`
  - [x] `POSTGRES_PASSWORD`: đổi từ `postgres` → `TikTok@DB#2026!Secure`

- [x] **1.2** Đổi JWT secrets trong `k8s/infrastructure/secrets.yaml`
  - [x] `JWT_ACCESS_SECRET`: đổi từ `your-secret-key-please-change-in-production` → `TikTok-JWT-Access-2026-a9f8d7c6b5e4d3c2b1a0987654321fed`
  - [x] `JWT_REFRESH_SECRET`: đổi từ `your-refresh-key-please-change-in-production` → `TikTok-JWT-Refresh-2026-1234567890abcdef1234567890abcdef`

- [x] **1.3** Đổi Grafana password
  - [x] `GF_SECURITY_ADMIN_PASSWORD`: đổi từ `admin123` → `Grafana@Admin#2026!`
  - [x] `PGADMIN_DEFAULT_PASSWORD`: đổi từ `pgadmin123` → `PgAdmin@2026!Secure`

- [ ] **1.4** Setup Docker Desktop Kubernetes

  ```powershell
  # Enable Kubernetes in Docker Desktop Settings
  # See K8S_SETUP_DOCKER_DESKTOP.md for detailed guide
  kubectl cluster-info
  ```

- [ ] **1.5** Build Docker images locally

  ```powershell
  # Option 1: Use script to build all
  .\scripts\deploy-k8s-local.ps1

  # Option 2: Build manually
  docker build -t tiktok-api-gateway:latest -f apps/api-gateway/Dockerfile .
  docker build -t tiktok-auth-service:latest -f apps/auth-service/Dockerfile .
  # ... (see K8S_LOCAL_QUICK_START.md)
  ```

- [ ] **1.6** Test deployment trên Docker Desktop

  ```powershell
  # Option 1: Using deploy script (RECOMMENDED)
  .\scripts\deploy-k8s-local.ps1

  # Option 2: Manual kubectl commands
  kubectl apply -f k8s/infrastructure/namespace.yaml
  kubectl apply -f k8s/infrastructure/
  kubectl apply -f k8s/services/

  # Check pods
  kubectl get pods -n tiktok-clone
  ```

- [ ] **1.7** Verify services healthy

  ```powershell
  # Check all resources
  .\scripts\deploy-k8s-local.ps1 -Action status

  # View logs
  .\scripts\deploy-k8s-local.ps1 -Action logs -Service api-gateway -Watch

  # Port forward to test
  kubectl port-forward svc/api-gateway 4000:4000 -n tiktok-clone
  # Then test: curl http://localhost:4000/health
  ```

### 📚 Documentation Created

- ✅ [K8S_SETUP_DOCKER_DESKTOP.md](K8S_SETUP_DOCKER_DESKTOP.md) - Setup guide cho Docker Desktop K8s
- ✅ [K8S_LOCAL_QUICK_START.md](K8S_LOCAL_QUICK_START.md) - Quick start & troubleshooting guide
- ✅ [scripts/deploy-k8s-local.ps1](scripts/deploy-k8s-local.ps1) - Automated deployment script

### ⚠️ Lưu ý cho Local

| Vấn đề                           | Chi tiết                                                 |
| -------------------------------- | -------------------------------------------------------- |
| PersistentVolume dùng `hostPath` | Chỉ hoạt động trên single-node (Docker Desktop/Minikube) |
| LoadBalancer service type        | Cần MetalLB hoặc dùng NodePort thay thế nếu không có     |

---

## 🚨 PHASE 2: AWS EKS - CẦN TẠO MỚI

### 2.1 Infrastructure Terraform

- [ ] **2.1.1** Tạo `terraform/aws/vpc.tf` - VPC configuration

  ```
  - VPC
  - Public subnets (3 AZs)
  - Private subnets (3 AZs)
  - NAT Gateways
  - Internet Gateway
  - Route tables
  ```

- [ ] **2.1.2** Tạo `terraform/aws/eks.tf` - EKS cluster

  ```
  - EKS cluster
  - Managed node groups
  - IAM roles for EKS
  - Security groups
  - OIDC provider
  ```

- [ ] **2.1.3** Update `terraform/providers.tf`

  ```hcl
  # Thêm AWS provider
  provider "aws" {
    region = var.aws_region
  }
  ```

- [ ] **2.1.4** Đổi Terraform backend sang S3
  ```hcl
  # terraform/main.tf - Đổi từ local sang:
  backend "s3" {
    bucket         = "tiktok-clone-terraform-state"
    key            = "eks/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
  ```

### 2.2 Kubernetes Resources cho EKS

- [ ] **2.2.1** Tạo `helm/tiktok-clone/templates/storageclass.yaml`

  ```yaml
  apiVersion: storage.k8s.io/v1
  kind: StorageClass
  metadata:
    name: gp3
  provisioner: ebs.csi.aws.com
  volumeBindingMode: WaitForFirstConsumer
  parameters:
    type: gp3
    fsType: ext4
  ```

- [ ] **2.2.2** Update PersistentVolumeClaim để dùng StorageClass
  - [ ] `helm/tiktok-clone/templates/postgres.yaml`
  - [ ] `helm/tiktok-clone/templates/redis.yaml`
  - [ ] `helm/tiktok-clone/templates/kafka.yaml`

- [ ] **2.2.3** Tạo `helm/tiktok-clone/templates/ingress.yaml`

  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: tiktok-ingress
    annotations:
      kubernetes.io/ingress.class: alb
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/certificate-arn: ${ACM_CERT_ARN}
      alb.ingress.kubernetes.io/listen-ports: '[{"HTTPS":443}]'
      alb.ingress.kubernetes.io/ssl-redirect: '443'
  ```

- [ ] **2.2.4** Tạo ImagePullSecret cho GHCR

  ```yaml
  apiVersion: v1
  kind: Secret
  metadata:
    name: ghcr-secret
    namespace: tiktok-clone
  type: kubernetes.io/dockerconfigjson
  data:
    .dockerconfigjson: <base64-encoded>
  ```

- [ ] **2.2.5** Update deployments để dùng imagePullSecrets
  ```yaml
  spec:
    template:
      spec:
        imagePullSecrets:
          - name: ghcr-secret
  ```

### 2.3 AWS Services Integration

- [ ] **2.3.1** Setup AWS ALB Ingress Controller

  ```powershell
  # Install AWS Load Balancer Controller
  helm repo add eks https://aws.github.io/eks-charts
  helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
    -n kube-system \
    --set clusterName=tiktok-clone-eks \
    --set serviceAccount.create=false \
    --set serviceAccount.name=aws-load-balancer-controller
  ```

- [ ] **2.3.2** Install EBS CSI Driver

  ```powershell
  # Addon cho EKS
  aws eks create-addon \
    --cluster-name tiktok-clone-eks \
    --addon-name aws-ebs-csi-driver \
    --service-account-role-arn arn:aws:iam::ACCOUNT:role/EBS_CSI_Role
  ```

- [ ] **2.3.3** Request ACM Certificate

  ```powershell
  aws acm request-certificate \
    --domain-name "*.tiktok-clone.com" \
    --validation-method DNS
  ```

- [ ] **2.3.4** Setup Route 53 (nếu dùng custom domain)

### 2.4 Security

- [ ] **2.4.1** Setup External Secrets Operator

  ```powershell
  helm repo add external-secrets https://charts.external-secrets.io
  helm install external-secrets external-secrets/external-secrets \
    -n external-secrets --create-namespace
  ```

- [ ] **2.4.2** Tạo AWS Secrets Manager secrets
  - [ ] Database credentials
  - [ ] JWT secrets
  - [ ] API keys

- [ ] **2.4.3** Tạo `helm/tiktok-clone/templates/externalsecret.yaml`

  ```yaml
  apiVersion: external-secrets.io/v1beta1
  kind: ExternalSecret
  metadata:
    name: tiktok-secrets
  spec:
    refreshInterval: 1h
    secretStoreRef:
      name: aws-secrets-manager
      kind: ClusterSecretStore
    target:
      name: tiktok-db-secrets
    data:
      - secretKey: DB_PASSWORD
        remoteRef:
          key: tiktok-clone/database
          property: password
  ```

- [ ] **2.4.4** Setup IRSA (IAM Roles for Service Accounts)
  - [ ] Role cho EBS CSI Driver
  - [ ] Role cho ALB Controller
  - [ ] Role cho External Secrets

- [ ] **2.4.5** Tạo NetworkPolicies
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: default-deny-ingress
  spec:
    podSelector: {}
    policyTypes:
      - Ingress
  ```

### 2.5 High Availability

- [ ] **2.5.1** Tạo PodDisruptionBudgets

  ```yaml
  apiVersion: policy/v1
  kind: PodDisruptionBudget
  metadata:
    name: api-gateway-pdb
  spec:
    minAvailable: 1
    selector:
      matchLabels:
        app: api-gateway
  ```

- [ ] **2.5.2** Configure Pod Anti-Affinity
  ```yaml
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchLabels:
                app: api-gateway
            topologyKey: kubernetes.io/hostname
  ```

---

## 🚀 PHASE 3: CI/CD cho EKS

- [ ] **3.1** Thêm GitHub Secrets
  - [ ] `AWS_ACCESS_KEY_ID`
  - [ ] `AWS_SECRET_ACCESS_KEY`
  - [ ] `AWS_REGION`
  - [ ] `EKS_CLUSTER_NAME`
  - [ ] `ARGOCD_SERVER` (EKS endpoint)
  - [ ] `ARGOCD_USERNAME`
  - [ ] `ARGOCD_PASSWORD`

- [ ] **3.2** Update `.github/workflows/cd.yml` cho EKS

  ```yaml
  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v4
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ${{ secrets.AWS_REGION }}

  - name: Update kubeconfig
    run: |
      aws eks update-kubeconfig --name ${{ secrets.EKS_CLUSTER_NAME }}
  ```

- [ ] **3.3** Setup ArgoCD trên EKS
  ```powershell
  helm repo add argo https://argoproj.github.io/argo-helm
  helm install argocd argo/argo-cd -n argocd --create-namespace
  ```

---

## 📝 COMMANDS REFERENCE

### Terraform Commands

```powershell
# Init
cd terraform
terraform init

# Plan
terraform plan -var-file="terraform.tfvars"

# Apply
terraform apply -var-file="terraform.tfvars"

# Destroy
terraform destroy -var-file="terraform.tfvars"
```

### EKS Commands

```powershell
# Update kubeconfig
aws eks update-kubeconfig --name tiktok-clone-eks --region ap-southeast-1

# Get nodes
kubectl get nodes

# Check pods across all namespaces
kubectl get pods -A
```

### Helm Commands

```powershell
# Install
helm install tiktok-clone ./helm/tiktok-clone -n tiktok-clone --create-namespace -f helm/tiktok-clone/values-prod.yaml

# Upgrade
helm upgrade tiktok-clone ./helm/tiktok-clone -n tiktok-clone -f helm/tiktok-clone/values-prod.yaml

# Rollback
helm rollback tiktok-clone 1 -n tiktok-clone

# Uninstall
helm uninstall tiktok-clone -n tiktok-clone
```

### Debug Commands

```powershell
# Logs
kubectl logs -f deployment/api-gateway -n tiktok-clone

# Describe pod
kubectl describe pod <pod-name> -n tiktok-clone

# Exec into pod
kubectl exec -it <pod-name> -n tiktok-clone -- /bin/sh

# Port forward
kubectl port-forward svc/api-gateway 4000:4000 -n tiktok-clone
```

---

## 📅 Timeline đề xuất

| Tuần       | Tasks                                               |
| ---------- | --------------------------------------------------- |
| **Tuần 1** | Phase 1 (K8s Local) + Bắt đầu Phase 2.1 (Terraform) |
| **Tuần 2** | Phase 2.2 + 2.3 (K8s resources + AWS services)      |
| **Tuần 3** | Phase 2.4 + 2.5 (Security + HA)                     |
| **Tuần 4** | Phase 3 (CI/CD) + Testing + Documentation           |

---

## 🔗 Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [External Secrets Operator](https://external-secrets.io/)
- [ArgoCD](https://argo-cd.readthedocs.io/)

---

## 📝 Notes

> Ghi chú thêm ở đây khi triển khai...

---

**Last updated:** 13/01/2026
