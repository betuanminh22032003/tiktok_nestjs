# =============================================================================

# 📘 HƯỚNG DẪN CI/CD PIPELINE - TIKTOK CLONE

# =============================================================================

# Tài liệu này giải thích chi tiết về CI/CD pipeline cho dự án TikTok Clone

# =============================================================================

## 📋 Mục Lục

1. [Tổng Quan](#tổng-quan)
2. [Kiến Trúc CI/CD](#kiến-trúc-cicd)
3. [GitHub Actions Workflows](#github-actions-workflows)
4. [Helm Charts](#helm-charts)
5. [ArgoCD GitOps](#argocd-gitops)
6. [Environments](#environments)
7. [Secrets Management](#secrets-management)
8. [Hướng Dẫn Sử Dụng](#hướng-dẫn-sử-dụng)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng Quan

### CI/CD là gì?

- **CI (Continuous Integration)**: Tự động kiểm tra code mỗi khi có commit mới
- **CD (Continuous Deployment)**: Tự động deploy code lên các môi trường

### Công nghệ sử dụng

| Công nghệ          | Mục đích                   |
| ------------------ | -------------------------- |
| **GitHub Actions** | CI/CD automation platform  |
| **Docker**         | Container runtime          |
| **Helm**           | Kubernetes package manager |
| **ArgoCD**         | GitOps continuous delivery |
| **Kubernetes**     | Container orchestration    |

---

## 🏗️ Kiến Trúc CI/CD

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPER WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. COMMIT CODE                                                          │
│     └── Push to GitHub (develop/release/main branch)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. CI PIPELINE (GitHub Actions)                                         │
│     ├── Lint & Format Check                                              │
│     ├── Unit Tests + Coverage                                            │
│     ├── Security Scan (Trivy, npm audit)                                 │
│     └── Build Validation                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                          CI Passed? │
                    ┌────────────────┼────────────────┐
                    │ NO             │                │ YES
                    ▼                │                ▼
              ┌─────────┐            │    ┌─────────────────────┐
              │  FAIL   │            │    │  3. CD PIPELINE     │
              │ Notify  │            │    │     ├── Build Docker│
              └─────────┘            │    │     ├── Push to GHCR│
                                     │    │     └── Update Helm │
                                     │    └─────────────────────┘
                                     │                │
                                     │                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. ARGOCD (GitOps)                                                      │
│     ├── Detect changes in Helm values                                    │
│     ├── Sync with Kubernetes cluster                                     │
│     └── Health check & Rollback if needed                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. KUBERNETES CLUSTER                                                   │
│     ├── DEV (auto-deploy from develop branch)                            │
│     ├── STAGING (auto-deploy from release/* branches)                    │
│     └── PRODUCTION (manual approval from main branch)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 GitHub Actions Workflows

### Danh sách Workflows

```
.github/workflows/
├── ci.yml              # Continuous Integration
├── cd.yml              # Continuous Deployment
├── release.yml         # Release Management
├── rollback.yml        # Emergency Rollback
└── infrastructure.yml  # Infrastructure Changes
```

### 1. CI Workflow (`ci.yml`)

**Trigger**: Pull Requests, Push to main/develop

**Jobs**:

```yaml
lint        → Kiểm tra code style (ESLint, Prettier)
↓
test        → Chạy unit tests với coverage
↓
security    → Scan lỗ hổng bảo mật
↓
build-check → Validate build output
↓
e2e-test    → End-to-end tests (optional)
```

**Chạy thủ công**:

```bash
# Qua GitHub UI: Actions → CI → Run workflow
```

### 2. CD Workflow (`cd.yml`)

**Trigger**: Sau khi CI thành công, Push to main/develop/release/\*

**Jobs**:

```yaml
prepare          → Xác định environment, version, services
↓
build            → Build Docker images (parallel cho 5 services)
↓
update-manifests → Update Helm values với image tags mới
↓
deploy-*         → Deploy tới DEV/STAGING/PRODUCTION
```

**Environment mapping**:
| Branch | Environment | Auto Deploy? |
|--------|-------------|--------------|
| develop | DEV | ✅ Yes |
| release/\* | STAGING | ✅ Yes |
| main | PRODUCTION | ⏳ Manual Approval |

### 3. Release Workflow (`release.yml`)

**Trigger**: Manual dispatch

**Inputs**:

- `version`: Version number (e.g., 1.2.0)
- `release_type`: major/minor/patch/hotfix
- `description`: Release description

**Flow**:

```
validate → create-release → create-pr → deploy-staging
```

### 4. Rollback Workflow (`rollback.yml`)

**Trigger**: Manual dispatch (emergency only)

**Inputs**:

- `environment`: production/staging/dev
- `rollback_type`: previous/specific
- `target_version`: Version to rollback to
- `reason`: Rollback reason

**Flow**:

```
prepare → approval (prod only) → rollback → notify
```

### 5. Infrastructure Workflow (`infrastructure.yml`)

**Trigger**: Changes to helm/, k8s/, argocd/, terraform/

**Jobs**:

```yaml
validate-helm   → Lint và validate Helm charts
validate-k8s    → Validate Kubernetes manifests
terraform-plan  → Terraform plan cho infrastructure
sync-argocd     → Sync ArgoCD applications
```

---

## ⛵ Helm Charts

### Cấu trúc

```
helm/tiktok-clone/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── values-dev.yaml         # DEV overrides
├── values-staging.yaml     # STAGING overrides
├── values-prod.yaml        # PRODUCTION overrides
└── templates/
    ├── namespace.yaml
    ├── configmap.yaml
    ├── secrets.yaml
    ├── api-gateway.yaml
    ├── auth-service.yaml
    ├── video-service.yaml
    ├── interaction-service.yaml
    └── notification-service.yaml
```

### Values Files Hierarchy

```
values.yaml (base)
    ↓
values-{env}.yaml (environment overrides)
    ↓
ArgoCD inline values (runtime overrides)
```

### Các lệnh Helm hữu ích

```bash
# Lint chart
helm lint helm/tiktok-clone/

# Template (preview rendered manifests)
helm template tiktok-clone helm/tiktok-clone/ -f helm/tiktok-clone/values-dev.yaml

# Dry-run install
helm install tiktok-clone helm/tiktok-clone/ --dry-run --debug

# Upgrade
helm upgrade tiktok-clone helm/tiktok-clone/ -f values-prod.yaml

# Rollback
helm rollback tiktok-clone 1  # Rollback to revision 1
```

---

## 🔄 ArgoCD GitOps

### Applications

```
argocd/
├── appproject.yaml         # Project definition
├── application-dev.yaml    # DEV application
├── application-staging.yaml # STAGING application
└── application-prod.yaml   # PRODUCTION application
```

### Sync Policies

| Setting     | DEV | STAGING | PROD |
| ----------- | --- | ------- | ---- |
| Auto Sync   | ✅  | ✅      | ✅   |
| Prune       | ✅  | ✅      | ✅   |
| Self Heal   | ✅  | ✅      | ✅   |
| Retry Limit | 5   | 5       | 5    |

### ArgoCD CLI Commands

```bash
# Login
argocd login <ARGOCD_SERVER> --username admin --password <PASSWORD>

# List applications
argocd app list

# Get app status
argocd app get tiktok-clone-prod

# Manual sync
argocd app sync tiktok-clone-prod

# Rollback
argocd app rollback tiktok-clone-prod <REVISION>

# History
argocd app history tiktok-clone-prod

# Diff
argocd app diff tiktok-clone-prod
```

---

## 🌍 Environments

### DEV Environment

- **Branch**: develop
- **URL**: https://dev.tiktok-clone.local
- **Namespace**: tiktok-clone-dev
- **Auto Deploy**: ✅ Yes
- **Replicas**: 1 (tiết kiệm resources)
- **Features**: Debug logging enabled

### STAGING Environment

- **Branch**: release/\*
- **URL**: https://staging.tiktok-clone.local
- **Namespace**: tiktok-clone-staging
- **Auto Deploy**: ✅ Yes
- **Replicas**: 2
- **Features**: Production-like settings

### PRODUCTION Environment

- **Branch**: main
- **URL**: https://tiktok-clone.local
- **Namespace**: tiktok-clone-prod
- **Auto Deploy**: ⏳ Manual Approval Required
- **Replicas**: 3+ (auto-scaling enabled)
- **Features**: Full monitoring, alerting

---

## 🔐 Secrets Management

### GitHub Secrets Required

```yaml
# Container Registry
GITHUB_TOKEN            # Auto-generated

# ArgoCD
ARGOCD_SERVER          # ArgoCD server URL
ARGOCD_USERNAME        # ArgoCD username
ARGOCD_PASSWORD        # ArgoCD password

# AWS (nếu deploy trên AWS)
AWS_ACCESS_KEY_ID      # AWS access key
AWS_SECRET_ACCESS_KEY  # AWS secret key
AWS_REGION             # AWS region

# Notifications (optional)
SLACK_WEBHOOK_URL      # Slack webhook for notifications
CODECOV_TOKEN          # Codecov upload token
```

### Cách thêm Secrets

1. Vào Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Thêm name và value

---

## 📖 Hướng Dẫn Sử Dụng

### 1. Development Workflow

```bash
# 1. Tạo feature branch từ develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Code và commit
git add .
git commit -m "feat: add new feature"

# 3. Push và tạo PR
git push origin feature/my-feature
# → CI tự động chạy khi tạo PR

# 4. Sau khi review, merge vào develop
# → CD tự động deploy lên DEV
```

### 2. Release Workflow

```bash
# Option 1: Sử dụng GitHub Actions
# Actions → Release Management → Run workflow
# Inputs:
#   - version: 1.2.0
#   - release_type: minor
#   - description: "Add new features"

# Option 2: Manual
git checkout develop
git checkout -b release/1.2.0
# Update versions, create PR to main
```

### 3. Hotfix Workflow

```bash
# 1. Trigger Rollback workflow nếu cần rollback ngay
# Actions → Emergency Rollback → Run workflow

# 2. Tạo hotfix branch từ main
git checkout main
git checkout -b hotfix/1.2.1

# 3. Fix bug, commit, push
# 4. Tạo PR vào main với label "hotfix"
```

### 4. Manual Deployment

```bash
# Trigger CD workflow manually
# Actions → CD - Build & Deploy → Run workflow
# Inputs:
#   - environment: production
#   - services: all (hoặc service cụ thể)
```

---

## 🔧 Troubleshooting

### CI Fails

**Lint errors**:

```bash
# Chạy local để fix
npm run lint
npm run format
```

**Test failures**:

```bash
# Chạy tests local
npm test
npm run test:cov
```

**Build failures**:

```bash
# Chạy build local
npm run build
```

### CD Fails

**Docker build fails**:

```bash
# Build local để debug
docker build -t test -f apps/api-gateway/Dockerfile .
```

**Helm validation fails**:

```bash
# Lint Helm chart
helm lint helm/tiktok-clone/
helm template test helm/tiktok-clone/ --debug
```

### ArgoCD Sync Fails

**Out of sync**:

```bash
# Check diff
argocd app diff tiktok-clone-prod

# Force sync
argocd app sync tiktok-clone-prod --force

# Refresh
argocd app get tiktok-clone-prod --refresh
```

**Health check fails**:

```bash
# Check pod status
kubectl get pods -n tiktok-clone-prod

# Check logs
kubectl logs -n tiktok-clone-prod deployment/api-gateway

# Describe pod
kubectl describe pod -n tiktok-clone-prod <pod-name>
```

### Rollback

**Via ArgoCD**:

```bash
# Xem history
argocd app history tiktok-clone-prod

# Rollback to specific revision
argocd app rollback tiktok-clone-prod <REVISION>
```

**Via GitHub Actions**:

```
Actions → Emergency Rollback → Run workflow
```

**Via Helm**:

```bash
# List revisions
helm history tiktok-clone -n tiktok-clone-prod

# Rollback
helm rollback tiktok-clone <REVISION> -n tiktok-clone-prod
```

---

## 📊 Monitoring Deployments

### GitHub Actions UI

- Repository → Actions → Xem các workflow runs
- Click vào run để xem chi tiết từng job

### ArgoCD UI

- Access: https://argocd.tiktok-clone.local
- Xem status, sync history, health của applications

### Kubectl

```bash
# Xem deployments
kubectl get deployments -n tiktok-clone-prod

# Xem pods
kubectl get pods -n tiktok-clone-prod

# Xem events
kubectl get events -n tiktok-clone-prod --sort-by='.lastTimestamp'
```

---

## 📚 Tài Liệu Tham Khảo

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Helm Documentation](https://helm.sh/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

## ✅ Checklist Triển Khai

### Pre-deployment

- [ ] CI pipeline passed
- [ ] Code reviewed
- [ ] Tests coverage > 80%
- [ ] No critical security vulnerabilities
- [ ] Documentation updated

### Post-deployment

- [ ] Health checks passing
- [ ] Monitoring dashboards checked
- [ ] Smoke tests passed
- [ ] Rollback plan ready

---

_Cập nhật lần cuối: December 2024_
