#!/bin/sh
# =============================================================================
# Docker Migration Script
# Chạy database sync/seed tùy theo MIGRATE_MODE env var
#
# MIGRATE_MODE:
#   sync  - Chỉ sync schema (tạo/update bảng) — mặc định
#   seed  - Chỉ seed data (thêm dữ liệu mẫu)
#   all   - Sync schema + seed data
# =============================================================================

set -e

echo "=================================================="
echo "  TikTok Clone - Database Migration Job"
echo "  Mode: ${MIGRATE_MODE:-sync}"
echo "=================================================="
echo ""

case "${MIGRATE_MODE}" in
  sync)
    echo "📦 Chạy sync schemas (tạo/update bảng)..."
    npx ts-node -r tsconfig-paths/register scripts/seeders/sync-schemas.ts
    ;;
  seed)
    echo "🌱 Chạy seed data (thêm dữ liệu mẫu)..."
    npx ts-node -r tsconfig-paths/register scripts/seeders/seed-all.ts
    ;;
  all)
    echo "📦 Bước 1/2: Sync schemas (tạo/update bảng)..."
    npx ts-node -r tsconfig-paths/register scripts/seeders/sync-schemas.ts
    echo ""
    echo "🌱 Bước 2/2: Seed data (thêm dữ liệu mẫu)..."
    npx ts-node -r tsconfig-paths/register scripts/seeders/seed-all.ts
    ;;
  *)
    echo "❌ MIGRATE_MODE không hợp lệ: ${MIGRATE_MODE}"
    echo "   Các giá trị hợp lệ: sync, seed, all"
    exit 1
    ;;
esac

echo ""
echo "✅ Migration job hoàn tất!"
