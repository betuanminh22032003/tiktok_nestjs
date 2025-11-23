#!/usr/bin/env node
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { DatabaseSeeder } from '../seeders/database.seeder';

async function runMigrations() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    console.log('🔄 Running migrations...');
    await AppDataSource.runMigrations();
    console.log('✅ Migrations completed successfully!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }
}

runMigrations();
