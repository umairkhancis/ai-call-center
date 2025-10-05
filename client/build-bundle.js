// Build script to bundle client application for browser
const esbuild = require('esbuild');
const path = require('path');

const buildBundle = async () => {
  try {
    console.log('🔨 Building client bundle...');
    
    await esbuild.build({
      entryPoints: [path.join(__dirname, 'src/app/main.ts')],
      bundle: true,
      outfile: path.join(__dirname, 'client-bundle.js'),
      platform: 'browser',
      target: 'es2020',
      format: 'iife', // Immediately Invoked Function Expression for browsers
      sourcemap: true,
      minify: false, // Set to true for production
      logLevel: 'info',
    });
    
    console.log('✅ Client bundle created successfully at client/client-bundle.js');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

buildBundle();
