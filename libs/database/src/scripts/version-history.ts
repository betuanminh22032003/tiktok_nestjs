import 'dotenv/config';
import { AppDataSource } from '../data-source';
import { VersionManager } from '../version.manager';

async function showVersionHistory() {
  try {
    console.log('📚 Loading version history...\n');

    // Initialize connection
    await AppDataSource.initialize();

    const versionManager = new VersionManager(AppDataSource);

    // Initialize version tracking
    await versionManager.initialize();

    // Display history
    await versionManager.displayVersionHistory();

    process.exit(0);
  } catch (error) {
    console.error('❌ Error loading version history:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

showVersionHistory();
