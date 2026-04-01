import fs from 'node:fs';
import path from 'node:path';
import { ensureConfigDir } from './icloud.js';
import { openDb, addEntry, getAllEntries, getEntry } from './db.js';
import { guessOriginalPath } from './known-configs.js';

export function initAnchor({ icloudBase, dirName = 'config', interactive = true }) {
  const configDir = ensureConfigDir(icloudBase, dirName);
  const db = openDb(configDir);

  // Scan existing files (excluding anchor.db and its WAL/SHM sidecar files)
  const items = fs.readdirSync(configDir).filter(name => !name.startsWith('anchor.db'));
  let discovered = 0;

  for (const name of items) {
    const existing = getEntry(db, name);
    if (existing) continue;

    const fullPath = path.join(configDir, name);
    const stat = fs.lstatSync(fullPath);
    const type = stat.isDirectory() ? 'directory' : 'file';
    const originalPath = guessOriginalPath(name);

    addEntry(db, { name, originalPath, type, status: 'unlinked' });
    discovered++;
  }

  const entries = getAllEntries(db);
  db.close();

  return { configDir, discovered, entries };
}
