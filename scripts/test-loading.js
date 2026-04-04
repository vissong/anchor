#!/usr/bin/env node

/**
 * Simulate slow filesystem to verify the loading spinner.
 * Usage: node scripts/test-loading.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

// Patch fs.access to add 200ms delay per call
const originalAccess = fs.access;
fs.access = async (...args) => {
  await new Promise(r => setTimeout(r, 200));
  return originalAccess.apply(fs, args);
};

// Now load the modules that use fs/promises
const { openDb, addEntry } = await import('../lib/db.js');
const { listEntries } = await import('../lib/list.js');

// Setup temp DB with a few entries
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ianchor-loading-'));
const db = openDb(tmpDir);
for (let i = 0; i < 5; i++) {
  addEntry(db, { name: `config-${i}.txt`, originalPath: `/tmp/fake-${i}`, type: 'file', status: 'linked' });
}

// Simulate the CLI spinner logic
const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let frameIdx = 0;
let spinnerInterval;
const spinnerTimeout = setTimeout(() => {
  process.stderr.write(`${frames[0]} Loading entries…`);
  spinnerInterval = setInterval(() => {
    frameIdx = (frameIdx + 1) % frames.length;
    process.stderr.write(`\r${frames[frameIdx]} Loading entries…`);
  }, 80);
}, 100);

const output = await listEntries(db, { json: false, configDir: tmpDir });

clearTimeout(spinnerTimeout);
if (spinnerInterval) {
  clearInterval(spinnerInterval);
  process.stderr.write('\r\x1b[K');
}

console.log(output);

// Cleanup
db.close();
await fs.rm(tmpDir, { recursive: true, force: true });
