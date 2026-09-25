process.env.CI = '';
process.env.EXPO_NO_METRO_LAZY = process.env.EXPO_NO_METRO_LAZY || '1';

const { spawn } = require('child_process');
const expoBin = require.resolve('expo/bin/exp');

const args = process.argv.slice(2);
const child = spawn(process.execPath, [expoBin, ...args], {
  stdio: 'inherit',
  env: process.env,
});

child.on('SIGINT', () => process.exit(0));
child.on('SIGTERM', () => process.exit(0));
