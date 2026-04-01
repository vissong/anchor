import fs from 'node:fs';
import path from 'node:path';
import { getEntry, deleteEntry } from './db.js';

export function recoverFile(db, { name, configDir, force = false }) {
  const entry = getEntry(db, name);
  if (!entry) {
    throw new Error(`Entry "${name}" not found.`);
  }

  const icloudPath = path.join(configDir, name);
  const originalPath = entry.original_path;

  if (!fs.existsSync(icloudPath)) {
    throw new Error(`"${name}" not found in iCloud directory.`);
  }

  if (originalPath) {
    if (fs.existsSync(originalPath)) {
      const stat = fs.lstatSync(originalPath);
      if (stat.isSymbolicLink()) {
        fs.unlinkSync(originalPath);
      } else if (!force) {
        throw new Error(
          `File already exists at original path "${originalPath}". Use --force to overwrite.`
        );
      } else {
        fs.rmSync(originalPath, { recursive: true, force: true });
      }
    }

    fs.mkdirSync(path.dirname(originalPath), { recursive: true });

    const icloudStat = fs.lstatSync(icloudPath);
    if (icloudStat.isDirectory()) {
      fs.cpSync(icloudPath, originalPath, { recursive: true });
    } else {
      fs.copyFileSync(icloudPath, originalPath);
    }
  }

  fs.rmSync(icloudPath, { recursive: true, force: true });
  deleteEntry(db, name);

  return { name, originalPath };
}
