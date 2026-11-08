const { spawn } = require('child_process');
const path = require('path');

console.log('🐝 Starting Beeswax Lite Command Center...\n');

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Start Server
const server = spawn('node', ['server/server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start Client Vite Dev Server
const client = spawn(npmCmd, ['run', 'dev', '--prefix', 'client'], {
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  server.kill();
  client.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
