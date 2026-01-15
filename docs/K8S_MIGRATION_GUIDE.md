# 🚀 Database Migration Guide for K8s Deployment

## Overview

Hệ thống migration tự động chạy khi deploy lên Kubernetes. Migration job sẽ:

1. ✅ Kiểm tra database có sẵn sàng không
2. ✅ Kiểm tra version hiện tại của schema
3. ✅ Chỉ chạy migration nếu schema chưa mới nhất
4. ✅ Theo dõi version trong bảng `schema_migrations`

## Cách hoạt động

Khi `migration.enabled=true`, Helm sử dụng **pre-install/pre-upgrade hooks** để đảm bảo thứ tự:

```
┌─────────────────────────────────────────────────────────────┐
│                    Helm Install/Upgrade                      │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
   ┌────────────┐    ┌────────────┐    ┌────────────┐
   │ PV/PVC     │    │ ConfigMap  │    │ Secrets    │
   │ (weight-15)│    │ (weight-13)│    │ (weight-13)│
   └────────────┘    └────────────┘    └────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
              ┌──────────────────────────┐
              │ PostgreSQL StatefulSet   │
              │ (weight -10)             │
              └──────────────────────────┘
                            │
                            ▼ (wait for postgres ready)
              ┌──────────────────────────┐
              │ Migration Job            │
              │ (weight -5)              │
              │  ┌────────────────────┐  │
              │  │ Check DB Version   │  │
              │  │ Run Schema Sync    │  │
              │  │ Update Version     │  │
              │  └────────────────────┘  │
              └──────────────────────────┘
                            │
                            ▼ (Sau khi migration xong)
┌─────────────────────────────────────────────────────────────┐
│                    Deploy Services                           │
│   auth-service, video-service, interaction-service, etc.    │
└─────────────────────────────────────────────────────────────┘
```

### Hook Weights Explained

| Resource               | Weight | Purpose                             |
| ---------------------- | ------ | ----------------------------------- |
| PersistentVolume       | -15    | Storage must exist first            |
| PersistentVolumeClaim  | -14    | Claim storage                       |
| ConfigMap              | -13    | Config for DB connection            |
| Secrets                | -13    | Passwords for DB                    |
| PostgreSQL Service     | -12    | DNS entry for postgres              |
| PostgreSQL StatefulSet | -10    | Database must be running            |
| **Migration Job**      | **-5** | **Runs after DB is ready**          |
| Services               | 0      | Normal deployment (after all hooks) |

└─────────────────────────────────────────────────────────────┘

````

## Schema Version Tracking

Migration system theo dõi version trong bảng `schema_migrations`:

```sql
CREATE TABLE schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL,
    service VARCHAR(100) NOT NULL,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    UNIQUE(service)
);
````

**Cập nhật version**: Khi thay đổi schema, cập nhật `SCHEMA_VERSION` trong:

- `scripts/migrations/k8s-migrate.ts`
- `scripts/migrations/check-version.ts`

## Quick Commands

### Build Migration Image

```powershell
# Build chỉ migration image
.\scripts\build-k8s-images.ps1 -Service migration

# Build tất cả images
.\scripts\build-k8s-images.ps1 -Service all
```

### Deploy với Migration

```powershell
# Deploy lên K8s (migration sẽ tự động chạy)
helm upgrade --install tiktok-clone ./helm/tiktok-clone -n tiktok-clone --create-namespace

# Deploy với force sync (cẩn thận!)
helm upgrade --install tiktok-clone ./helm/tiktok-clone -n tiktok-clone \
    --set migration.forceSync=true
```

### Kiểm tra Migration Status

```powershell
# Xem migration job logs
kubectl logs -l app=db-migration -n tiktok-clone

# Xem job status
kubectl get jobs -n tiktok-clone

# Kiểm tra version trong database
kubectl exec -it postgres-0 -n tiktok-clone -- psql -U postgres -d tiktok_auth -c \
    "SELECT * FROM schema_migrations;"
```

### Chạy Migration Thủ Công (Development)

```powershell
# Chạy migration cho tất cả services
npm run k8s:migrate

# Chạy cho service cụ thể
npm run k8s:migrate:auth
npm run k8s:migrate:video
npm run k8s:migrate:interaction
npm run k8s:migrate:notification

# Kiểm tra version
npm run k8s:migrate:check
```

## Configuration (values.yaml)

```yaml
migration:
  # Bật/tắt migration tự động
  enabled: true

  # Migration Docker image
  image:
    repository: tiktok-migration
    tag: latest
    pullPolicy: IfNotPresent

  # Target service(s): auth|video|interaction|notification|all
  targetService: all

  # Force schema sync (chỉ dùng khi cần thiết!)
  forceSync: false

  # Thời gian giữ completed job (giây)
  ttlSecondsAfterFinished: 600

  # Số lần retry khi fail
  backoffLimit: 3

  # Database names
  databases:
    auth: tiktok_auth
    video: tiktok_video
    interaction: tiktok_interaction
    notification: tiktok_notification
```

## Environment-Specific Configuration

### Development (values-dev.yaml)

```yaml
migration:
  enabled: true
  forceSync: true # OK trong dev
  image:
    pullPolicy: Never # Dùng local image
```

### Staging/Production (values-staging.yaml, values-prod.yaml)

```yaml
migration:
  enabled: true
  forceSync: false # KHÔNG ĐƯỢC force sync trong production
  image:
    pullPolicy: Always # Pull từ registry
```

## Troubleshooting

### Migration Job Stuck

```powershell
# Xem logs
kubectl logs -l app=db-migration -n tiktok-clone --tail=100

# Xóa job cũ
kubectl delete jobs -l app=db-migration -n tiktok-clone

# Retry
helm upgrade tiktok-clone ./helm/tiktok-clone -n tiktok-clone
```

### Database Connection Failed

```powershell
# Kiểm tra PostgreSQL đang chạy
kubectl get pods -l app=postgres -n tiktok-clone

# Kiểm tra service
kubectl get svc postgres -n tiktok-clone

# Test connection từ pod
kubectl run -it --rm debug --image=busybox -n tiktok-clone \
    -- nc -vz postgres 5432
```

### Schema Mismatch

```powershell
# Kiểm tra version trong DB
kubectl exec -it postgres-0 -n tiktok-clone -- psql -U postgres -d tiktok_auth -c \
    "SELECT service, version, executed_at FROM schema_migrations ORDER BY service;"

# Force sync (CẨN THẬN!)
helm upgrade tiktok-clone ./helm/tiktok-clone -n tiktok-clone \
    --set migration.forceSync=true
```

## Best Practices

1. **Version Control**: Luôn increment `SCHEMA_VERSION` khi thay đổi entities
2. **Test Locally**: Chạy `npm run k8s:migrate` locally trước khi deploy
3. **Backup**: Backup database trước khi chạy migration trên production
4. **Monitor**: Kiểm tra migration logs sau mỗi lần deploy
5. **Rollback Plan**: Có kế hoạch rollback nếu migration fail

## Workflow Hoàn Chỉnh

```powershell
# 1. Thay đổi entities trong libs/*-db/src/entities/

# 2. Cập nhật SCHEMA_VERSION trong scripts/migrations/k8s-migrate.ts
#    const SCHEMA_VERSION = '1.0.1';  // Increment version

# 3. Test locally
npm run k8s:migrate

# 4. Build images
.\scripts\build-k8s-images.ps1 -Service all

# 5. Deploy
helm upgrade --install tiktok-clone ./helm/tiktok-clone -n tiktok-clone

# 6. Verify
kubectl logs -l app=db-migration -n tiktok-clone
kubectl get pods -n tiktok-clone
```

---

**🎉 Migration tự động đã được cấu hình! Mỗi khi deploy, hệ thống sẽ:**

- ✅ Đợi database sẵn sàng
- ✅ Kiểm tra schema version
- ✅ Chạy migration nếu cần thiết
- ✅ Sau đó mới khởi động services
