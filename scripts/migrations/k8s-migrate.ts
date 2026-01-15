#!/usr/bin/env node
/**
 * Kubernetes Migration Runner Script
 *
 * This script checks the current database schema version and runs migrations if needed.
 * It's designed to be run as a Kubernetes Job or init container before service startup.
 *
 * Features:
 * - Checks if database exists and is accessible
 * - Tracks migration version in a dedicated table
 * - Runs migrations only if schema is not up-to-date
 * - Supports multiple databases (database-per-service pattern)
 *
 * Environment Variables:
 * - DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME (for single DB)
 * - {SERVICE}_DB_HOST, {SERVICE}_DB_PORT, etc. (for per-service DBs)
 * - MIGRATION_SERVICE: auth|video|interaction|notification|all
 * - FORCE_SYNC: set to 'true' to force schema sync (dev only!)
 *
 * Usage:
 *   MIGRATION_SERVICE=auth node dist/scripts/migrations/k8s-migrate.js
 *   MIGRATION_SERVICE=all node dist/scripts/migrations/k8s-migrate.js
 */

import { config } from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Load environment variables
config();

// Schema version - increment this when making schema changes
const SCHEMA_VERSION = '1.0.0';
const MIGRATION_TABLE = 'schema_migrations';

interface MigrationConfig {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: any[];
}

// Import entities dynamically to avoid build issues
async function getEntities(service: string): Promise<any[]> {
  switch (service) {
    case 'auth':
      const authModule = await import('@app/auth-db/entities');
      return [authModule.User, authModule.RefreshToken];

    case 'video':
      const videoModule = await import('@app/video-db/entities');
      return [videoModule.Video, videoModule.VideoView];

    case 'interaction':
      const interactionModule = await import('@app/interaction-db/entities');
      return [
        interactionModule.Like,
        interactionModule.Comment,
        interactionModule.CommentLike,
        interactionModule.Follow,
        interactionModule.Share,
      ];

    case 'notification':
      try {
        const notifModule = await import('@app/notification-db/entities');
        return Object.values(notifModule).filter((entity: any) => typeof entity === 'function');
      } catch {
        console.log(`⚠️  No notification entities found`);
        return [];
      }

    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

function getDbConfig(service: string): Omit<MigrationConfig, 'entities'> {
  const prefix = service.toUpperCase();
  return {
    name: service,
    host: process.env[`${prefix}_DB_HOST`] || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env[`${prefix}_DB_PORT`] || process.env.DB_PORT || '5432'),
    username: process.env[`${prefix}_DB_USERNAME`] || process.env.DB_USERNAME || 'postgres',
    password: process.env[`${prefix}_DB_PASSWORD`] || process.env.DB_PASSWORD || 'postgres',
    database: process.env[`${prefix}_DB_NAME`] || process.env.DB_NAME || `tiktok_${service}`,
  };
}

async function ensureMigrationTable(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        service VARCHAR(100) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64),
        UNIQUE(service)
      )
    `);
    console.log(`✅ Migration table ensured`);
  } finally {
    await queryRunner.release();
  }
}

async function getCurrentVersion(dataSource: DataSource, service: string): Promise<string | null> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    const result = await queryRunner.query(
      `SELECT version FROM ${MIGRATION_TABLE} WHERE service = $1`,
      [service],
    );
    return result.length > 0 ? result[0].version : null;
  } finally {
    await queryRunner.release();
  }
}

async function updateVersion(
  dataSource: DataSource,
  service: string,
  version: string,
): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.query(
      `
      INSERT INTO ${MIGRATION_TABLE} (service, version, executed_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (service)
      DO UPDATE SET version = $2, executed_at = CURRENT_TIMESTAMP
    `,
      [service, version],
    );
    console.log(`✅ Version updated to ${version}`);
  } finally {
    await queryRunner.release();
  }
}

async function waitForDatabase(
  config: Omit<MigrationConfig, 'entities'>,
  maxRetries = 30,
): Promise<boolean> {
  const tempDataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: 'postgres', // Connect to default postgres DB first
    synchronize: false,
  });

  for (let i = 1; i <= maxRetries; i++) {
    try {
      console.log(`🔄 Attempting to connect to database (${i}/${maxRetries})...`);
      await tempDataSource.initialize();
      await tempDataSource.destroy();
      console.log(`✅ Database connection successful`);
      return true;
    } catch (error: any) {
      console.log(`⏳ Database not ready: ${error.message}`);
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }
  }

  return false;
}

async function ensureDatabase(config: Omit<MigrationConfig, 'entities'>): Promise<boolean> {
  const tempDataSource = new DataSource({
    type: 'postgres',
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: 'postgres',
    synchronize: false,
  });

  try {
    await tempDataSource.initialize();
    const queryRunner = tempDataSource.createQueryRunner();

    // Check if database exists
    const dbExists = await queryRunner.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [
      config.database,
    ]);

    if (dbExists.length === 0) {
      console.log(`📦 Creating database: ${config.database}`);
      await queryRunner.query(`CREATE DATABASE "${config.database}"`);
      console.log(`✅ Database created: ${config.database}`);
    } else {
      console.log(`✅ Database exists: ${config.database}`);
    }

    await queryRunner.release();
    await tempDataSource.destroy();
    return true;
  } catch (error: any) {
    console.error(`❌ Error ensuring database: ${error.message}`);
    return false;
  }
}

async function migrateService(service: string): Promise<boolean> {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀 Migrating ${service.toUpperCase()} service`);
  console.log(`${'═'.repeat(60)}`);

  const dbConfig = getDbConfig(service);
  const forceSync = process.env.FORCE_SYNC === 'true';

  // Wait for database to be ready
  const dbReady = await waitForDatabase(dbConfig);
  if (!dbReady) {
    console.error(`❌ Database not available after retries`);
    return false;
  }

  // Ensure database exists
  const dbExists = await ensureDatabase(dbConfig);
  if (!dbExists) {
    console.error(`❌ Could not ensure database exists`);
    return false;
  }

  // Get entities for this service
  const entities = await getEntities(service);
  if (entities.length === 0) {
    console.log(`⏭️  No entities for ${service}, skipping...`);
    return true;
  }

  // Create data source for the service database
  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities,
    synchronize: false, // We'll handle sync manually
    logging: process.env.NODE_ENV === 'development',
  });

  try {
    await dataSource.initialize();
    console.log(`✅ Connected to ${dbConfig.database}`);

    // Ensure migration tracking table exists
    await ensureMigrationTable(dataSource);

    // Check current version
    const currentVersion = await getCurrentVersion(dataSource, service);
    console.log(`📋 Current version: ${currentVersion || 'none'}`);
    console.log(`📋 Target version: ${SCHEMA_VERSION}`);

    if (currentVersion === SCHEMA_VERSION && !forceSync) {
      console.log(`✅ Schema is up-to-date, no migration needed`);
      return true;
    }

    // Run synchronization (creates/updates tables based on entities)
    console.log(`🔄 Running schema synchronization...`);

    // Create a new DataSource with synchronize: true
    const syncDataSource = new DataSource({
      type: 'postgres',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities,
      synchronize: true,
      logging: true,
    });

    await syncDataSource.initialize();
    await syncDataSource.destroy();

    console.log(`✅ Schema synchronized`);

    // Update version
    await updateVersion(dataSource, service, SCHEMA_VERSION);

    console.log(`🎉 Migration completed for ${service}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Migration failed for ${service}: ${error.message}`);
    console.error(error.stack);
    return false;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

async function main(): Promise<void> {
  const targetService = process.env.MIGRATION_SERVICE || 'all';
  const services =
    targetService === 'all' ? ['auth', 'video', 'interaction', 'notification'] : [targetService];

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀 K8s Database Migration Runner`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`📋 Schema Version: ${SCHEMA_VERSION}`);
  console.log(`📋 Target Services: ${services.join(', ')}`);
  console.log(`📋 Force Sync: ${process.env.FORCE_SYNC === 'true'}`);
  console.log(`${'═'.repeat(60)}\n`);

  const results: { service: string; success: boolean }[] = [];

  for (const service of services) {
    const success = await migrateService(service);
    results.push({ service, success });
  }

  // Print summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 Migration Summary`);
  console.log(`${'═'.repeat(60)}`);

  let allSuccess = true;
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.service}`);
    if (!result.success) allSuccess = false;
  }

  console.log(`${'═'.repeat(60)}\n`);

  if (!allSuccess) {
    console.error(`❌ Some migrations failed!`);
    process.exit(1);
  }

  console.log(`🎉 All migrations completed successfully!`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
