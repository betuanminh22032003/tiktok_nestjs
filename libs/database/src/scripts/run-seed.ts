#!/usr/bin/env node
import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { DatabaseSeeder } from '../seeders/database.seeder';

async function runSeeder() {
  try {
    console.log('🔄 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const seeder = new DatabaseSeeder();
    await seeder.seed();

    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error running seeder:', error);
    process.exit(1);
  }
}

runSeeder();
