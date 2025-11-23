import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { VersionManager } from '../version.manager';

async function checkVersion() {
  try {
    console.log('🔍 Checking application version...\n');

    // Initialize connection
    await AppDataSource.initialize();
    console.log('✅ Database connected\n');

    const versionManager = new VersionManager(AppDataSource);

    // Initialize version tracking
    await versionManager.initialize();

    // Display version info
    await versionManager.displayVersionInfo();

    // Check if update needed
    const updateCheck = await versionManager.needsUpdate();

    if (updateCheck.needsUpdate) {
      console.log('⚠️  Action Required:');
      console.log('   Run: npm run version:deploy');
      console.log('   Or:  npm run db:setup\n');
      process.exit(1);
    } else {
      console.log('✅ System is up to date!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error checking version:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

checkVersion();
