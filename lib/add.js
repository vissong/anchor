import fs from 'node:fs';
import path from 'node:path';
import { addEntry } from './db.js';

export async function addFile(db, { sourcePath, configDir, name, force = false, onConflict }) {
  const resolvedSource = path.resolve(sourcePath);

  if (!fs.existsSync(resolvedSource)) {
    throw new Error(`Source "${resolvedSource}" does not exist.`);
  }

  const sourceStat = fs.lstatSync(resolvedSource);
  if (sourceStat.isSymbolicLink()) {
    throw new Error(`Source "${resolvedSource}" is already a symlink.`);
  }

  let destName = name ?? path.basename(resolvedSource);
  let destPath = path.join(configDir, destName);

  if (fs.existsSync(destPath) && !force) {
    if (onConflict) {
      const prefix = await onConflict(destName);
      if (prefix) {
        destName = `${prefix}_${destName}`;
        destPath = path.join(configDir, destName);
      }
    }
    // Check again after prefix
    if (fs.existsSync(destPath) && !force) {
      throw new Error(
        `"${destName}" already exists in iCloud directory. Use --force to overwrite.`
      );
    }
  }

  const type = sourceStat.isDirectory() ? 'directory' : 'file';

  try {
    fs.renameSync(resolvedSource, destPath);
  } catch (err) {
    if (err.code === 'EXDEV') {
      fs.cpSync(resolvedSource, destPath, { recursive: true });
      fs.rmSync(resolvedSource, { recursive: true, force: true });
    } else {
      throw err;
    }
  }

  fs.symlinkSync(destPath, resolvedSource);

  addEntry(db, { name: destName, originalPath: resolvedSource, type, status: 'linked' });

  return { name: destName, originalPath: resolvedSource, type };
}
