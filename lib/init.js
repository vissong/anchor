import fs from 'node:fs';
import path from 'node:path';
import { ensureConfigDir } from './icloud.js';
import { openDb, addEntry, getAllEntries, getEntry } from './db.js';
import { guessOriginalPath } from './known-configs.js';

const IGNORED_FILES = new Set(['.DS_Store', 'Thumbs.db', '.bak']);

const IMAGE_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg',
  '.ico', '.webp', '.tiff', '.tif', '.heic', '.heif',
]);

function shouldIgnore(name) {
  if (IGNORED_FILES.has(name)) return true;
  const ext = path.extname(name).toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext)) return true;
  return false;
}

export function initAnchor({ icloudBase, dirName = 'anchor', interactive = true }) {
  const configDir = ensureConfigDir(icloudBase, dirName);
  const db = openDb(configDir);

  // Scan existing files (excluding anchor.db, .DS_Store, and image files)
  const items = fs.readdirSync(configDir).filter(
    name => !name.startsWith('anchor.db') && !shouldIgnore(name)
  );
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
