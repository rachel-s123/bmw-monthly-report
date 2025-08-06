#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Check if .env file exists and has Supabase credentials
function checkEnvironment() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    logError('.env file not found!');
    logInfo('Please create a .env file with your Supabase credentials:');
    log('VITE_SUPABASE_URL=https://your-project-id.supabase.co', 'cyan');
    log('VITE_SUPABASE_ANON_KEY=your-anon-key-here', 'cyan');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  if (!envContent.includes('VITE_SUPABASE_URL') || !envContent.includes('VITE_SUPABASE_ANON_KEY')) {
    logError('Missing Supabase credentials in .env file!');
    logInfo('Please add your Supabase URL and anon key to the .env file.');
    return false;
  }

  logSuccess('Environment variables found');
  return true;
}

// Run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main startup function
async function startSupabase() {
  log('🚀 Starting BMW Monthly Report Dashboard with Supabase...', 'bright');
  log('', 'reset');

  // Check environment
  logInfo('Checking environment configuration...');
  if (!checkEnvironment()) {
    process.exit(1);
  }

  // Build the project first
  logInfo('Building project...');
  try {
    await runCommand('npm', ['run', 'build']);
    logSuccess('Build completed successfully');
  } catch (error) {
    logError('Build failed!');
    logError(error.message);
    process.exit(1);
  }

  log('', 'reset');
  log('🎯 Starting development server and build watcher...', 'bright');
  log('', 'reset');

  // Start both dev server and build watcher
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  const buildProcess = spawn('npm', ['run', 'build:watch'], {
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    log('', 'reset');
    logInfo('Shutting down...');
    devProcess.kill();
    buildProcess.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    log('', 'reset');
    logInfo('Shutting down...');
    devProcess.kill();
    buildProcess.kill();
    process.exit(0);
  });

  // Log startup completion
  setTimeout(() => {
    log('', 'reset');
    logSuccess('BMW Dashboard is now running!');
    log('', 'reset');
    log('📱 Development server: http://localhost:5173 (or next available port)', 'cyan');
    log('🔧 Build watcher: Running in background', 'cyan');
    log('☁️  Supabase: Connected and ready', 'cyan');
    log('', 'reset');
    log('Press Ctrl+C to stop all processes', 'yellow');
    log('', 'reset');
  }, 3000);
}

// Run the startup function
startSupabase().catch((error) => {
  logError('Startup failed!');
  logError(error.message);
  process.exit(1);
}); 