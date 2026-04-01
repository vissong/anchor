import fs from 'node:fs';
import path from 'node:path';
import { getEntry, deleteEntry } from './db.js';

export function removeFile(db, { name, configDir }) {
  const entry = getEntry(db, name);
  if (!entry) {
    throw new Error(`Entry "${name}" not found.`);
  }

  const icloudPath = path.join(configDir, name);

  // Remove file from iCloud directory if it still exists
  if (fs.existsSync(icloudPath)) {
    fs.rmSync(icloudPath, { recursive: true, force: true });
  }

  // Remove symlink at original path if it points to iCloud
  if (entry.original_path) {
    try {
      const stat = fs.lstatSync(entry.original_path);
      if (stat.isSymbolicLink()) {
        const target = fs.readlinkSync(entry.original_path);
        if (target === icloudPath) {
          fs.unlinkSync(entry.original_path);
        }
      }
    } catch {
      // original path doesn't exist, nothing to clean up
    }
  }

  deleteEntry(db, name);

  return { name, originalPath: entry.original_path };
}
