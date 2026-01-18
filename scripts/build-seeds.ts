/**
 * Build seed scripts for K8s deployment
 * Bundles all dependencies into a single JS file that can run in container
 *
 * Usage: npx ts-node scripts/build-seeds.ts
 */
import * as esbuild from 'esbuild';
import * as fs from 'fs';

const outDir = 'dist/scripts/seeders';

async function build() {
  console.log('🔨 Building seed scripts for K8s...\n');

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const entryPoints = [
    'scripts/seeders/seed-all.ts',
    'scripts/seeders/seed-auth.ts',
    'scripts/seeders/seed-video.ts',
    'scripts/seeders/seed-interaction.ts',
  ];

  try {
    await esbuild.build({
      entryPoints,
      bundle: true,
      platform: 'node',
      target: 'node20',
      outdir: outDir,
      format: 'cjs',
      sourcemap: false,
      minify: false,
      // Externalize problematic packages
      external: ['pg-native', 'mock-aws-s3', 'nock', 'aws-sdk', '@mapbox/node-pre-gyp'],
      // Resolve @app/* aliases
      alias: {
        '@app/auth-db': './libs/auth-db/src',
        '@app/video-db': './libs/video-db/src',
        '@app/interaction-db': './libs/interaction-db/src',
        '@app/notification-db': './libs/notification-db/src',
        '@app/common': './libs/common/src',
        '@app/database': './libs/database/src',
      },
      // Ignore .html files
      loader: {
        '.html': 'text',
      },
    });

    console.log('✅ Seed scripts built successfully!');
    console.log(`   Output: ${outDir}/`);

    // List built files
    const files = fs.readdirSync(outDir);
    files.forEach((f) => console.log(`   - ${f}`));
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
