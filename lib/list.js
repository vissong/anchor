import fs from 'node:fs';
import path from 'node:path';
import Table from 'cli-table3';
import chalk from 'chalk';
import { getAllEntries } from './db.js';

function checkStatus(entry, configDir) {
  if (!configDir) return entry.status;

  const icloudPath = path.join(configDir, entry.name);
  // File deleted from iCloud
  if (!fs.existsSync(icloudPath)) return 'deleted';

  if (!entry.original_path) return 'unlinked';
  try {
    const stat = fs.lstatSync(entry.original_path);
    if (!stat.isSymbolicLink()) return 'unlinked';
    const target = fs.readlinkSync(entry.original_path);
    return target === icloudPath ? 'linked' : 'unlinked';
  } catch {
    return 'unlinked';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'linked': return chalk.green('linked');
    case 'deleted': return chalk.red('deleted (use "anchor remove" to clean up)');
    default: return chalk.yellow('unlinked');
  }
}

export function listEntries(db, { json = false, configDir } = {}) {
  const entries = getAllEntries(db);

  if (json) {
    const result = entries.map(e => ({
      ...e,
      status: checkStatus(e, configDir),
    }));
    return JSON.stringify(result, null, 2);
  }

  if (entries.length === 0) {
    return 'No entries found. Use "anchor add <path>" to add config files.';
  }

  const table = new Table({
    head: [
      chalk.cyan('Name'),
      chalk.cyan('Original Path'),
      chalk.cyan('Type'),
      chalk.cyan('Status'),
    ],
  });

  for (const entry of entries) {
    const status = checkStatus(entry, configDir);
    table.push([
      entry.name,
      entry.original_path ?? chalk.dim('(unknown)'),
      entry.type,
      formatStatus(status),
    ]);
  }

  return table.toString();
}
