# 🗄️ Database Migration & Seeding Guide

## 📋 Overview
Hướng dẫn sử dụng TypeORM migrations và database seeding cho TikTok Clone project.

## 🚀 Quick Start

### Setup Database (First Time)
```bash
# 1. Start infrastructure
docker compose -f docker-compose.infra.yml up -d

# 2. Run migrations + seed data
npm run db:setup
```

### Development Workflow
```bash
# Reset database (clear + migrate + seed)
npm run db:reset

# Or step by step:
npm run db:clear           # Clear all data
npm run migration:run      # Run migrations
npm run seed:run          # Seed data
```

## 📁 File Structure

```
libs/database/src/
├── data-source.ts                    # TypeORM DataSource config
├── database.module.ts                # NestJS Database Module
├── entities/                         # Entity definitions
│   ├── user.entity.ts
│   ├── video.entity.ts
│   ├── like.entity.ts
│   └── comment.entity.ts
├── migrations/                       # Database migrations
│   └── 1700000000000-InitialSchema.ts
├── seeders/                         # Data seeders
│   └── database.seeder.ts
└── scripts/                         # CLI scripts
    ├── run-migrations.ts
    ├── run-seed.ts
    └── clear-database.ts
```

## 🔧 NPM Scripts

### Migration Commands
```bash
# Run pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Generate new migration (based on entity changes)
npm run migration:generate -- -n MigrationName

# Create empty migration
npm run migration:create -- -n MigrationName
```

### Seeding Commands
```bash
# Run database seeder
npm run seed:run

# Clear all data
npm run db:clear

# Reset database (clear + migrate + seed)
npm run db:reset

# Setup database (migrate + seed)
npm run db:setup
```

## 📝 Migration Examples

### Creating a New Migration

**1. Create empty migration:**
```bash
npm run migration:create -- libs/database/src/migrations/AddUserProfileFields
```

**2. Generate migration from entity changes:**
```bash
# After modifying entities
npm run migration:generate -- libs/database/src/migrations/UpdateUserEntity
```

### Migration File Structure
```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserProfileFields1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "phoneNumber" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert changes
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "phoneNumber"
    `);
  }
}
```

## 🌱 Seeding Data

### Default Seed Data
Current seeder creates:
- **5 Users** with credentials:
  - Email: `john.doe@example.com`, `jane.smith@example.com`, etc.
  - Username: `johndoe`, `janesmith`, etc.
  - Password: `password123` (hashed)

- **5 Videos** distributed among users with sample data

### Customizing Seed Data

Edit `libs/database/src/seeders/database.seeder.ts`:

```typescript
private async seedUsers(): Promise<User[]> {
  const usersData = [
    {
      email: 'your.email@example.com',
      username: 'yourusername',
      password: await bcrypt.hash('yourpassword', 10),
      fullName: 'Your Name',
      bio: 'Your bio',
      isActive: true,
    },
    // Add more users...
  ];
  // ...
}
```

### Creating Additional Seeders

Create new seeder in `libs/database/src/seeders/`:

```typescript
// follow.seeder.ts
export class FollowSeeder {
  async seed(users: User[]) {
    // Create follow relationships
  }
}
```

Update `database.seeder.ts`:
```typescript
async seed() {
  const users = await this.seedUsers();
  const videos = await this.seedVideos(users);
  
  // Add new seeder
  const followSeeder = new FollowSeeder();
  await followSeeder.seed(users);
}
```

## 🔄 Migration Workflow

### Development
```bash
# 1. Modify entities
# 2. Generate migration
npm run migration:generate -- -n YourMigrationName

# 3. Review generated migration
# 4. Run migration
npm run migration:run

# 5. Test with seed data
npm run seed:run
```

### Production Deployment
```bash
# 1. Build application
npm run build

# 2. Run migrations (before starting app)
npm run migration:run

# 3. Start application
npm run start:prod
```

## ⚙️ Configuration

### Environment Variables
```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=tiktok_clone

# Migration settings
DB_SYNC=false  # Use migrations instead
NODE_ENV=production  # Auto-run migrations in production
```

### TypeORM DataSource (`data-source.ts`)
```typescript
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'tiktok_clone',
  entities: [join(__dirname, 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false,
});
```

## 🐛 Troubleshooting

### Migration Already Exists
```bash
# Check migration status
npm run typeorm -- migration:show -d libs/database/src/data-source.ts

# Revert if needed
npm run migration:revert
```

### Connection Error
```bash
# 1. Verify PostgreSQL is running
docker ps | grep postgres

# 2. Test connection
docker exec -it tiktok_postgres psql -U postgres -d tiktok_clone

# 3. Check environment variables
cat .env | grep DB_
```

### Seed Data Already Exists
```bash
# Seeder checks for existing data
# To re-seed, clear first:
npm run db:clear
npm run seed:run
```

### Migration Failed
```bash
# 1. Check error message
# 2. Revert last migration
npm run migration:revert

# 3. Fix migration file
# 4. Run again
npm run migration:run
```

## 📚 Best Practices

### 1. Always Use Migrations in Production
```typescript
// ❌ Don't use synchronize in production
synchronize: true

// ✅ Use migrations
synchronize: false
migrationsRun: true
```

### 2. Review Generated Migrations
```bash
# Always review before committing
npm run migration:generate -- -n AutoGenerated
# Review libs/database/src/migrations/...
# Edit if needed
```

### 3. Test Migrations
```bash
# Test up
npm run migration:run

# Test down
npm run migration:revert

# Test up again
npm run migration:run
```

### 4. Backup Before Migration
```bash
# Production: Always backup
docker exec tiktok_postgres pg_dump -U postgres tiktok_clone > backup.sql

# Run migration
npm run migration:run

# Restore if needed
docker exec -i tiktok_postgres psql -U postgres tiktok_clone < backup.sql
```

### 5. Version Control
```bash
# Commit migrations with code changes
git add libs/database/src/migrations/
git commit -m "feat: add user profile fields migration"
```

## 🔗 Related Files

- `libs/database/src/data-source.ts` - DataSource configuration
- `libs/database/src/database.module.ts` - NestJS module
- `package.json` - Migration scripts
- `.env` - Database configuration

## 📞 Common Scenarios

### Scenario 1: New Feature Requires DB Changes
```bash
# 1. Update entity
# 2. Generate migration
npm run migration:generate -- -n AddNewFeature

# 3. Review and test
npm run migration:run
npm run seed:run

# 4. Commit
git add libs/database/
git commit -m "feat: add new feature with migration"
```

### Scenario 2: Fresh Development Setup
```bash
# 1. Clone repo
git clone <repo>

# 2. Install dependencies
npm install

# 3. Setup infrastructure
docker compose -f docker-compose.infra.yml up -d

# 4. Setup database
npm run db:setup

# 5. Start development
npm run start:auth
```

### Scenario 3: Production Deployment
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Build
npm run build

# 4. Backup database
pg_dump > backup.sql

# 5. Run migrations
npm run migration:run

# 6. Restart services
pm2 restart all
```

---

🎉 Happy Migrating & Seeding!
