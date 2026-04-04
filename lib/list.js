import fs from 'node:fs/promises';
import path from 'node:path';
import Table from 'cli-table3';
import chalk from 'chalk';
import { getAllEntries } from './db.js';

async function checkStatus(entry, configDir) {
  if (!configDir) return entry.status;

  const icloudPath = path.join(configDir, entry.name);
  // File deleted from iCloud
  try {
    await fs.access(icloudPath);
  } catch {
    return 'deleted';
  }

  if (!entry.original_path) return 'unlinked';
  try {
    const stat = await fs.lstat(entry.original_path);
    if (!stat.isSymbolicLink()) return 'unlinked';
    const target = await fs.readlink(entry.original_path);
    return target === icloudPath ? 'linked' : 'unlinked';
  } catch {
    return 'unlinked';
  }
}

function formatStatus(status) {
  switch (status) {
    case 'linked': return chalk.green('linked');
    case 'deleted': return chalk.red('deleted (use "ianchor remove" to clean up)');
    default: return chalk.yellow('unlinked');
  }
}

export async function listEntries(db, { json = false, configDir } = {}) {
  const entries = getAllEntries(db);

  if (json) {
    const result = await Promise.all(entries.map(async e => ({
      ...e,
      status: await checkStatus(e, configDir),
    })));
    return JSON.stringify(result, null, 2);
  }

  if (entries.length === 0) {
    return 'No entries found. Use "ianchor add <path>" to add config files.';
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
    const status = await checkStatus(entry, configDir);
    table.push([
      entry.name,
      entry.original_path ?? chalk.dim('(unknown)'),
      entry.type,
      formatStatus(status),
    ]);
  }

  return table.toString();
}
