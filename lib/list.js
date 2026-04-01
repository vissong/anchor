import Table from 'cli-table3';
import chalk from 'chalk';
import { getAllEntries } from './db.js';

export function listEntries(db, { json = false } = {}) {
  const entries = getAllEntries(db);

  if (json) {
    return JSON.stringify(entries, null, 2);
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
    table.push([
      entry.name,
      entry.original_path ?? chalk.dim('(unknown)'),
      entry.type,
      entry.status === 'linked' ? chalk.green('linked') : chalk.yellow('unlinked'),
    ]);
  }

  return table.toString();
}
