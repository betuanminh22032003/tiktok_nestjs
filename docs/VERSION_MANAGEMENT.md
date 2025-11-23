# 🏷️ Version Management Guide

## 📋 Overview
Hệ thống quản lý version cho TikTok Clone, giúp track và kiểm soát deployments, migrations, và database schema versions.

## 🎯 Features

- ✅ **Semantic Versioning** - Tự động đọc từ `package.json`
- ✅ **Version Tracking** - Lưu lịch sử deployments trong database
- ✅ **Migration Tracking** - Track migrations đã chạy cho mỗi version
- ✅ **Version Comparison** - So sánh versions (newer/older)
- ✅ **Deployment History** - Xem lịch sử tất cả deployments
- ✅ **Safety Checks** - Cảnh báo khi version conflict

## 🚀 Quick Start

### Check Current Version
```bash
npm run version:check
```

**Output:**
```
📦 Version Information
════════════════════════════════════════════════════════════
Current Version: 1.0.0
Applied Version: None

Status: No version applied yet. First deployment.

📊 Migration Status:
  Applied: 0
  Pending: 1

⏳ Pending Migrations:
  - 1700000000000-InitialSchema
════════════════════════════════════════════════════════════

⚠️  Action Required:
   Run: npm run version:deploy
   Or:  npm run db:setup
```

### Deploy Version
```bash
npm run version:deploy
```

**Output:**
```
🚀 Deploying Application Version

✅ Database connected

Current Status: No version applied yet. First deployment.

📝 Running migrations...
✅ Migrations completed

Enter deployment description (optional): Initial production deployment

✅ Version 1.0.0 recorded successfully

🎉 Version deployed successfully!
   Version: 1.0.0
   Migrations: 1
```

### View Version History
```bash
npm run version:history
```

**Output:**
```
📚 Version History
════════════════════════════════════════════════════════════

🟢 CURRENT Version 1.0.0
   Applied: 11/23/2025, 10:30:00 AM
   Migrations: 1
   Description: Initial production deployment

   Version 0.9.0
   Applied: 11/20/2025, 3:15:00 PM
   Migrations: 0
   Description: Beta release

════════════════════════════════════════════════════════════
```

## 📊 Database Schema

Version tracking sử dụng bảng `app_versions`:

```sql
CREATE TABLE "app_versions" (
  "id" SERIAL PRIMARY KEY,
  "version" VARCHAR(50) NOT NULL UNIQUE,
  "appliedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "migrationsRun" TEXT[] NOT NULL DEFAULT '{}',
  "description" TEXT,
  "rollbackScript" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## 🔄 Version Workflow

### Development Cycle
```bash
# 1. Update version in package.json
{
  "version": "1.1.0"
}

# 2. Create new migration (if needed)
npm run migration:generate -- -n AddNewFeature

# 3. Test locally
npm run db:reset

# 4. Check version status
npm run version:check

# 5. Deploy version
npm run version:deploy
```

### Production Deployment
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Check version status
npm run version:check

# 4. If update needed, deploy
npm run version:deploy

# 5. Start services
npm run start:prod
```

## 📝 Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

### Updating Version

**package.json:**
```json
{
  "version": "1.2.3"
}
```

**NPM commands:**
```bash
# Patch: 1.0.0 → 1.0.1
npm version patch

# Minor: 1.0.0 → 1.1.0
npm version minor

# Major: 1.0.0 → 2.0.0
npm version major
```

## 🔍 Version Comparison Logic

System tự động so sánh versions:

```typescript
// Examples:
compareVersions('1.0.0', '0.9.0')  // Returns: 1 (newer)
compareVersions('1.0.0', '1.0.0')  // Returns: 0 (same)
compareVersions('1.0.0', '1.1.0')  // Returns: -1 (older)
```

### Version Status Messages

| Status | Message | Action |
|--------|---------|--------|
| 🟢 Up to date | `✅ Version 1.0.0 is already applied` | None needed |
| 🟡 Update available | `Update available: 1.0.0 → 1.1.0` | Run `version:deploy` |
| 🔴 Version mismatch | `⚠️ Applied version 1.1.0 is newer than current 1.0.0` | Check code version |
| 🆕 First deployment | `No version applied yet. First deployment.` | Run `version:deploy` |

## 🛠️ API Reference

### VersionManager Class

```typescript
import { VersionManager } from '@app/database';
import { AppDataSource } from '@app/database';

const versionManager = new VersionManager(AppDataSource);
```

#### Methods

**initialize()**
```typescript
await versionManager.initialize();
// Creates app_versions table
```

**getCurrentVersion()**
```typescript
const version = versionManager.getCurrentVersion();
// Returns: "1.0.0" from package.json
```

**getLatestAppliedVersion()**
```typescript
const applied = await versionManager.getLatestAppliedVersion();
// Returns: { version, appliedAt, migrationsRun, description }
```

**isVersionApplied()**
```typescript
const isApplied = await versionManager.isVersionApplied('1.0.0');
// Returns: true/false
```

**needsUpdate()**
```typescript
const status = await versionManager.needsUpdate();
// Returns: {
//   needsUpdate: boolean,
//   currentVersion: string,
//   appliedVersion: string | null,
//   message: string
// }
```

**recordVersion()**
```typescript
await versionManager.recordVersion(
  '1.0.0',
  ['InitialSchema', 'AddUsers'],
  'Production deployment'
);
```

**getMigrationStatus()**
```typescript
const status = await versionManager.getMigrationStatus();
// Returns: { pending: string[], applied: string[] }
```

## 📋 Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Check version
        run: npm run version:check
        continue-on-error: true
      
      - name: Deploy version
        run: npm run version:deploy
        env:
          DB_HOST: ${{ secrets.DB_HOST }}
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
      
      - name: Start services
        run: npm run start:prod
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# Check version before starting
CMD npm run version:check && \
    npm run start:prod
```

## 🎯 Use Cases

### Case 1: Fresh Installation
```bash
# First deployment
npm run version:check
# Output: No version applied yet

npm run version:deploy
# Runs all migrations, records v1.0.0
```

### Case 2: Normal Update
```bash
# Update package.json to 1.1.0
npm version minor

# Check
npm run version:check
# Output: Update available: 1.0.0 → 1.1.0

# Deploy
npm run version:deploy
# Runs new migrations, records v1.1.0
```

### Case 3: Rollback Detection
```bash
# Current: 1.2.0, Applied: 1.3.0
npm run version:check
# Output: ⚠️ Applied version 1.3.0 is newer than current 1.2.0
# Indicates potential rollback scenario
```

### Case 4: Skip Deployment
```bash
npm run version:check
# Output: ✅ Version 1.0.0 is already applied

npm run version:deploy
# Prompt: Version is already up to date. Deploy anyway? (yes/no)
```

## ⚠️ Best Practices

### 1. Always Check Before Deploy
```bash
# ❌ Don't deploy blindly
npm run version:deploy

# ✅ Check status first
npm run version:check
npm run version:deploy
```

### 2. Add Meaningful Descriptions
```bash
# ❌ Skip description
npm run version:deploy
# Enter: [empty]

# ✅ Add description
npm run version:deploy
# Enter: "Added user authentication and video upload features"
```

### 3. Review Migration Status
```bash
# Check pending migrations
npm run version:check
# Review: Pending: 2 migrations

# Inspect migration files before deploying
cat libs/database/src/migrations/*
```

### 4. Backup Before Major Versions
```bash
# Before 2.0.0 deployment
pg_dump -U postgres tiktok_clone > backup_v1.sql

npm run version:deploy
```

### 5. Version Consistently
```bash
# ❌ Manual version updates
# Edit package.json randomly

# ✅ Use npm version
npm version patch -m "fix: resolve auth bug"
npm version minor -m "feat: add video sharing"
npm version major -m "BREAKING: new authentication system"
```

## 🐛 Troubleshooting

### Version Table Not Found
```bash
# Error: relation "app_versions" does not exist

# Solution:
npm run version:check
# Automatically creates table
```

### Version Mismatch
```bash
# Error: Applied version is newer

# Check package.json version
cat package.json | grep version

# Fix version number
npm version 1.3.0
```

### Migration Not Tracked
```bash
# Check migration status
npm run version:check

# Re-deploy to sync
npm run version:deploy
```

### Database Connection Error
```bash
# Check .env configuration
cat .env | grep DB_

# Test connection
docker exec -it tiktok_postgres psql -U postgres -d tiktok_clone
```

## 📚 Related Documentation

- [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) - Migration system
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development setup
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide

## 🔗 Version History Query

**SQL Query:**
```sql
-- Get all versions
SELECT 
  version,
  applied_at,
  array_length(migrations_run, 1) as migration_count,
  description
FROM app_versions
ORDER BY applied_at DESC;

-- Get current version
SELECT version 
FROM app_versions 
ORDER BY applied_at DESC 
LIMIT 1;

-- Check specific version
SELECT * 
FROM app_versions 
WHERE version = '1.0.0';
```

---

🎉 **Version Management Made Easy!**

Need help? Check [CONTRIBUTING.md](./CONTRIBUTING.md) or open an issue.
