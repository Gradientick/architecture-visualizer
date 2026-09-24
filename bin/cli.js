#!/usr/bin/env node

'use strict';

const path = require('path');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

const args = process.argv.slice(2);
const dirArg = args.find((a) => !a.startsWith('--'));
const portArg = args.find((a) => a.startsWith('--port='));
const port = portArg ? portArg.split('=')[1] : '3333';

// Resolve the target directory
const targetDir = dirArg ? path.resolve(process.cwd(), dirArg) : null;

// Check for first-run config
const CONFIG_FILE = path.join(os.homedir(), '.arch-viz', 'config.json');
const hasConfig = fs.existsSync(CONFIG_FILE);

// Build the URL to open
const baseUrl = `http://localhost:${port}`;
const startUrl = targetDir
  ? `${baseUrl}?path=${encodeURIComponent(targetDir)}`
  : baseUrl;

console.log('\n🔍 Architecture Visualizer\n');

if (!hasConfig) {
  console.log('👋 First run detected — a setup wizard will open in your browser.\n');
}

if (targetDir) {
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory not found: ${targetDir}`);
    process.exit(1);
  }
  console.log(`📁 Analyzing: ${targetDir}`);
}

console.log(`🚀 Starting server at ${baseUrl}...\n`);

// Determine the app directory (where this CLI lives)
const appDir = path.join(__dirname, '..');

// Start Next.js server
const nextBin = path.join(appDir, 'node_modules', '.bin', 'next');
const server = spawn(nextBin, ['dev', '--port', port], {
  cwd: appDir,
  stdio: 'pipe',
  env: { ...process.env, PORT: port },
});

let opened = false;

server.stdout.on('data', (data) => {
  const text = data.toString();
  // Next.js prints "Ready" when the server is up
  if (!opened && (text.includes('Ready') || text.includes('ready'))) {
    opened = true;
    console.log(`✅ Server ready! Opening browser...\n`);
    // Dynamically import open (ESM package)
    import('open').then(({ default: open }) => open(startUrl)).catch(() => {
      console.log(`Open your browser at: ${startUrl}`);
    });
  }
});

server.stderr.on('data', (data) => {
  const text = data.toString();
  if (!text.includes('warn') && !text.includes('Fast Refresh')) {
    process.stderr.write(data);
  }
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\nShutting down...');
  server.kill('SIGINT');
  process.exit(0);
});
