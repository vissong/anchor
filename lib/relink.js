import fs from 'node:fs';
import path from 'node:path';
import { getEntry, updateEntry } from './db.js';

export function relinkFile(db, { name, configDir }) {
  const entry = getEntry(db, name);
  if (!entry) {
    throw new Error(`Entry "${name}" not found.`);
  }

  if (!entry.original_path) {
    throw new Error(`Entry "${name}" has no original path. Use "ianchor add" with a source path instead.`);
  }

  const icloudPath = path.join(configDir, name);
  if (!fs.existsSync(icloudPath)) {
    throw new Error(`"${name}" not found in iCloud directory.`);
  }

  const originalPath = entry.original_path;

  // Check if already linked correctly
  if (fs.existsSync(originalPath)) {
    const stat = fs.lstatSync(originalPath);
    if (stat.isSymbolicLink()) {
      const target = fs.readlinkSync(originalPath);
      if (target === icloudPath) {
        throw new Error(`"${name}" is already linked.`);
      }
      // Symlink pointing elsewhere — remove it
      fs.unlinkSync(originalPath);
    } else {
      // Real file/dir exists — rename to .bak
      const bakPath = `${originalPath}.bak`;
      fs.renameSync(originalPath, bakPath);
    }
  }

  // Ensure parent directory exists
  fs.mkdirSync(path.dirname(originalPath), { recursive: true });

  // Create symlink
  fs.symlinkSync(icloudPath, originalPath);

  updateEntry(db, name, { status: 'linked' });

  return { name, originalPath, icloudPath };
}
