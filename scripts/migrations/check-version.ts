#!/usr/bin/env node
/**
 * Check Schema Version Script
 *
 * This script checks if the database schema is up-to-date.
 * Used by init containers to verify migration has completed.
 *
 * Exit codes:
 * - 0: Schema is up-to-date
 * - 1: Schema needs migration or error occurred
 *
 * Environment Variables:
 * - CHECK_SERVICE: auth|video|interaction|notification|all (default: all)
 */

import { config } from 'dotenv';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

config();

const SCHEMA_VERSION = '1.0.0';
const MIGRATION_TABLE = 'schema_migrations';

interface DbConfig {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function getDbConfig(service: string): DbConfig {
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

async function checkVersion(service: string, maxRetries = 30): Promise<boolean> {
  const dbConfig = getDbConfig(service);

  const dataSource = new DataSource({
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    synchronize: false,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 [${service}] Checking schema version (attempt ${attempt}/${maxRetries})...`);

      await dataSource.initialize();
      const queryRunner = dataSource.createQueryRunner();

      // Check if migration table exists
      const tableExists = await queryRunner.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = '${MIGRATION_TABLE}'
        )
      `);

      if (!tableExists[0].exists) {
        console.log(`⏳ [${service}] Migration table not found, waiting...`);
        await queryRunner.release();
        await dataSource.destroy();

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return false;
      }

      // Check version
      const result = await queryRunner.query(
        `SELECT version FROM ${MIGRATION_TABLE} WHERE service = $1`,
        [service],
      );

      await queryRunner.release();
      await dataSource.destroy();

      if (result.length === 0) {
        console.log(`⏳ [${service}] No version record found, waiting...`);
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        return false;
      }

      const currentVersion = result[0].version;
      if (currentVersion === SCHEMA_VERSION) {
        console.log(`✅ [${service}] Schema is up-to-date (v${currentVersion})`);
        return true;
      }

      console.log(`⚠️  [${service}] Version mismatch: ${currentVersion} vs ${SCHEMA_VERSION}`);
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      return false;
    } catch (error: any) {
      console.log(`⏳ [${service}] Error: ${error.message}`);
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      return false;
    }
  }

  return false;
}

async function main(): Promise<void> {
  const targetService = process.env.CHECK_SERVICE || 'all';
  const services =
    targetService === 'all' ? ['auth', 'video', 'interaction', 'notification'] : [targetService];

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`🔍 Schema Version Check`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`📋 Expected Version: ${SCHEMA_VERSION}`);
  console.log(`📋 Checking Services: ${services.join(', ')}`);
  console.log(`${'═'.repeat(50)}\n`);

  let allOk = true;

  for (const service of services) {
    const isUpToDate = await checkVersion(service);
    if (!isUpToDate) {
      allOk = false;
      console.error(`❌ [${service}] Schema is not ready!`);
    }
  }

  if (!allOk) {
    console.error(`\n❌ Some services are not ready!`);
    process.exit(1);
  }

  console.log(`\n✅ All services are ready!`);
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
