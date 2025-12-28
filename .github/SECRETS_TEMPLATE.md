# =============================================================================

# GITHUB SECRETS TEMPLATE

# =============================================================================

# File này liệt kê tất cả secrets cần thiết cho CI/CD pipeline

#

# CÁCH SỬ DỤNG:

# 1. Copy nội dung này

# 2. Vào GitHub Repository → Settings → Secrets and variables → Actions

# 3. Tạo từng secret với giá trị thực tế

#

# LƯU Ý: KHÔNG commit file này với giá trị thực vào repository!

# =============================================================================

# =============================================================================

# REQUIRED SECRETS - Bắt buộc phải có

# =============================================================================

# -----------------------------------------------------------------------------

# CONTAINER REGISTRY

# Sử dụng GitHub Container Registry (ghcr.io)

# -----------------------------------------------------------------------------

# GITHUB_TOKEN: Tự động được tạo bởi GitHub Actions

# Không cần configure, đã có sẵn trong workflow

# -----------------------------------------------------------------------------

# ARGOCD - GitOps Continuous Delivery

# Cần để trigger sync và rollback

# -----------------------------------------------------------------------------

ARGOCD_SERVER=argocd.your-domain.com

# ^ URL của ArgoCD server (không có https://)

ARGOCD_USERNAME=admin

# ^ Username để login ArgoCD (thường là 'admin')

ARGOCD_PASSWORD=your-argocd-password

# ^ Password của ArgoCD admin user

# Lấy bằng cách: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d

# =============================================================================

# OPTIONAL SECRETS - Tùy chọn

# =============================================================================

# -----------------------------------------------------------------------------

# AWS CREDENTIALS

# Cần nếu deploy lên AWS EKS hoặc sử dụng AWS services

# -----------------------------------------------------------------------------

AWS_ACCESS_KEY_ID=<your-aws-access-key-id>

# ^ AWS Access Key ID (format: AKIA...)

AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>

# ^ AWS Secret Access Key (40 characters)

AWS_REGION=ap-southeast-1

# ^ AWS Region mặc định

# -----------------------------------------------------------------------------

# GOOGLE CLOUD CREDENTIALS

# Cần nếu deploy lên GKE

# -----------------------------------------------------------------------------

GCP_PROJECT_ID=your-project-id

# ^ Google Cloud Project ID

GCP_SA_KEY={"type": "service_account", ...}

# ^ Service Account JSON key (base64 encoded)

# Tạo bằng: gcloud iam service-accounts keys create key.json --iam-account=SA_NAME@PROJECT_ID.iam.gserviceaccount.com

# -----------------------------------------------------------------------------

# AZURE CREDENTIALS

# Cần nếu deploy lên AKS

# -----------------------------------------------------------------------------

AZURE_CREDENTIALS={"clientId": "...", "clientSecret": "...", ...}

# ^ Azure Service Principal credentials JSON

# -----------------------------------------------------------------------------

# KUBERNETES KUBECONFIG

# Cần nếu deploy trực tiếp lên K8s cluster (không qua ArgoCD)

# -----------------------------------------------------------------------------

KUBECONFIG_DATA=base64-encoded-kubeconfig

# ^ Base64 encoded kubeconfig file

# Tạo bằng: cat ~/.kube/config | base64

# -----------------------------------------------------------------------------

# CODECOV

# Để upload coverage reports

# -----------------------------------------------------------------------------

CODECOV_TOKEN=your-codecov-token

# ^ Token từ codecov.io

# Lấy tại: https://app.codecov.io/gh/YOUR_ORG/YOUR_REPO/settings

# -----------------------------------------------------------------------------

# SLACK NOTIFICATIONS

# Để gửi thông báo deployment qua Slack

# -----------------------------------------------------------------------------

SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX

# ^ Slack Incoming Webhook URL

# Tạo tại: https://api.slack.com/apps → Incoming Webhooks

SLACK_BOT_TOKEN=xoxb-your-token

# ^ Slack Bot Token (nếu dùng Slack API thay vì webhook)

# -----------------------------------------------------------------------------

# DISCORD NOTIFICATIONS

# Alternative cho Slack

# -----------------------------------------------------------------------------

DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/xxx

# ^ Discord Webhook URL

# -----------------------------------------------------------------------------

# SONARQUBE/SONARCLOUD

# Code quality analysis

# -----------------------------------------------------------------------------

SONAR_TOKEN=your-sonar-token

# ^ SonarCloud/SonarQube token

SONAR_HOST_URL=https://sonarcloud.io

# ^ SonarQube server URL (bỏ qua nếu dùng SonarCloud)

# -----------------------------------------------------------------------------

# SNYK

# Security vulnerability scanning

# -----------------------------------------------------------------------------

SNYK_TOKEN=your-snyk-token

# ^ Snyk API token từ https://app.snyk.io/account

# -----------------------------------------------------------------------------

# DOCKER HUB (nếu dùng thay vì GHCR)

# -----------------------------------------------------------------------------

DOCKERHUB_USERNAME=your-username
DOCKERHUB_TOKEN=your-token

# ^ Docker Hub access token (không phải password)

# -----------------------------------------------------------------------------

# SSH KEYS (cho deployment legacy/EC2)

# -----------------------------------------------------------------------------

EC2_SSH_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----

# ^ Private key để SSH vào EC2

EC2_HOST=ec2-xx-xx-xx-xx.compute.amazonaws.com

# ^ EC2 public hostname

# -----------------------------------------------------------------------------

# DATABASE (cho migrations trong CI)

# -----------------------------------------------------------------------------

DATABASE_URL=postgresql://user:password@host:5432/dbname

# ^ Connection string cho database migrations

# -----------------------------------------------------------------------------

# NPM (nếu publish packages)

# -----------------------------------------------------------------------------

NPM_TOKEN=npm_xxxxxxxxxxxx

# ^ NPM access token

# =============================================================================

# ENVIRONMENT VARIABLES (không phải secrets)

# Có thể set trong repository Variables thay vì Secrets

# =============================================================================

# Repository → Settings → Secrets and variables → Actions → Variables

# ENVIRONMENT=production

# NODE_ENV=production

# TZ=Asia/Ho_Chi_Minh

# =============================================================================

# TIPS

# =============================================================================

# 1. Sử dụng GitHub Environments để quản lý secrets theo môi trường

# Settings → Environments → New environment

# - development

# - staging

# - production (có thể thêm protection rules)

# 2. Rotation secrets định kỳ (3-6 tháng)

# 3. Sử dụng GitHub's Dependabot Secrets cho các secrets

# liên quan đến dependency updates

# 4. Review access logs định kỳ:

# Settings → Audit log

# 5. Không hardcode secrets trong code hoặc workflows

# =============================================================================

# VERIFICATION

# =============================================================================

# Sau khi setup xong, verify bằng cách:

# 1. Trigger workflow manually

# 2. Check logs xem secrets có được inject đúng không

# 3. Test deployment tới DEV environment
