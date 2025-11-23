# 🏷️ Version Management - Quick Reference

## 📦 Version Configuration

**File:** `libs/common/src/config/version.config.ts`

```typescript
export const APP_VERSION = {
  MAJOR: 1,
  MINOR: 0,
  PATCH: 0,
  PRERELEASE: null, // 'alpha', 'beta', 'rc', or null
  BUILD: null,      // Build metadata
};
```

## 🚀 Commands

```bash
# Check current version vs deployed
npm run version:check

# Deploy new version (with migrations)
npm run version:deploy

# View deployment history
npm run version:history
```

## 🔄 Update Version Workflow

### 1. Update Version in Code
```typescript
// libs/common/src/config/version.config.ts
export const APP_VERSION = {
  MAJOR: 1,
  MINOR: 1,  // Changed from 0 to 1
  PATCH: 0,
};
```

### 2. Create Migration (if needed)
```bash
npm run migration:generate -- -n AddNewFeature
```

### 3. Check Status
```bash
npm run version:check
```

**Output:**
```
📦 Version Information
════════════════════════════════════════
Current Version: 1.1.0
Applied Version: 1.0.0

Status: Update available: 1.0.0 → 1.1.0

📊 Migration Status:
  Applied: 2
  Pending: 1

⏳ Pending Migrations:
  - 1700000000002-AddNewFeature
════════════════════════════════════════

⚠️  Action Required:
   Run: npm run version:deploy
```

### 4. Deploy Version
```bash
npm run version:deploy
```

**Output:**
```
🚀 Deploying Application Version

Current Status: Update available: 1.0.0 → 1.1.0

📝 Running migrations...
query: SELECT * FROM "migrations"
query: CREATE TABLE "new_feature" ...
✅ Migrations completed

Enter deployment description (optional): Added user profile feature

✅ Version 1.1.0 recorded successfully

🎉 Version deployed successfully!
   Version: 1.1.0
   Migrations: 2
```

### 5. Verify
```bash
npm run version:history
```

## 📊 Version Comparison

| Current | Deployed | Status | Action |
|---------|----------|--------|--------|
| 1.0.0 | None | First deployment | Deploy |
| 1.1.0 | 1.0.0 | Update available | Deploy |
| 1.0.0 | 1.0.0 | Up to date | None |
| 1.0.0 | 1.1.0 | ⚠️  Rollback detected | Check code |

## 🎯 Version Types

### Patch (1.0.0 → 1.0.1)
```typescript
export const APP_VERSION = {
  MAJOR: 1,
  MINOR: 0,
  PATCH: 1, // Bug fix
};
```

### Minor (1.0.0 → 1.1.0)
```typescript
export const APP_VERSION = {
  MAJOR: 1,
  MINOR: 1, // New feature
  PATCH: 0,
};
```

### Major (1.0.0 → 2.0.0)
```typescript
export const APP_VERSION = {
  MAJOR: 2, // Breaking change
  MINOR: 0,
  PATCH: 0,
};
```

### Pre-release (1.0.0-alpha)
```typescript
export const APP_VERSION = {
  MAJOR: 1,
  MINOR: 0,
  PATCH: 0,
  PRERELEASE: 'alpha', // or 'beta', 'rc'
};
```

## 📝 Integration with Services

### Get Version in Code
```typescript
import { getVersionString, getVersionInfo } from '@app/common';

// Get version string
const version = getVersionString(); // "1.0.0"

// Get full info
const info = getVersionInfo();
// {
//   version: "1.0.0",
//   major: 1,
//   minor: 0,
//   patch: 0,
//   prerelease: null,
//   build: null,
//   fullName: "TikTok Clone v1.0.0"
// }
```

### Add Version to API Response
```typescript
@Get('/health')
async health() {
  return {
    status: 'ok',
    version: getVersionString(),
    timestamp: new Date(),
  };
}
```

## 🗄️ Database Schema

**Entity:** `AppVersion` (`app_versions` table)

```typescript
{
  id: number;
  version: string;         // "1.0.0"
  appliedAt: Date;         // When deployed
  migrationsRun: string[]; // List of migrations
  description?: string;    // Deployment notes
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔍 Troubleshooting

### Version Not Found
```bash
# Check version.config.ts exists
ls libs/common/src/config/version.config.ts

# Check export
grep "export" libs/common/src/index.ts
```

### Table Not Found
```bash
# Run migration for app_versions table
npm run migration:run
```

### Version Mismatch
```bash
# Check current version
npm run version:check

# Update version in code
# Edit libs/common/src/config/version.config.ts

# Deploy
npm run version:deploy
```

---

📚 **Full Documentation:** See [VERSION_MANAGEMENT.md](./VERSION_MANAGEMENT.md)
