import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { VersionManager } from '../version.manager';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function deployVersion() {
  try {
    console.log('🚀 Deploying Application Version\n');

    // Initialize connection
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const versionManager = new VersionManager(AppDataSource);

    // Initialize version tracking
    await versionManager.initialize();

    // Check current status
    const updateCheck = await versionManager.needsUpdate();
    console.log(`Current Status: ${updateCheck.message}\n`);

    if (!updateCheck.needsUpdate) {
      const answer = await question('Version is already up to date. Deploy anyway? (yes/no): ');
      if (answer.toLowerCase() !== 'yes') {
        console.log('Deployment cancelled.');
        process.exit(0);
      }
    }

    // Get migration status
    const migrationStatus = await versionManager.getMigrationStatus();

    if (migrationStatus.pending.length > 0) {
      console.log('⚠️  Pending migrations detected:');
      migrationStatus.pending.forEach((m) => console.log(`  - ${m}`));
      console.log('\n📝 Running migrations...');

      await AppDataSource.runMigrations();
      console.log('✅ Migrations completed\n');
    } else {
      console.log('✅ No pending migrations\n');
    }

    // Get description
    const description = await question('Enter deployment description (optional): ');

    // Record version
    const finalMigrations = await versionManager.getMigrationStatus();
    await versionManager.recordVersion(
      updateCheck.currentVersion,
      finalMigrations.applied,
      description || undefined,
    );

    console.log('\n🎉 Version deployed successfully!');
    console.log(`   Version: ${updateCheck.currentVersion}`);
    console.log(`   Migrations: ${finalMigrations.applied.length}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error deploying version:', error);
    process.exit(1);
  } finally {
    rl.close();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

deployVersion();
