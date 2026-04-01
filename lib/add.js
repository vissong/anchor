import fs from 'node:fs';
import path from 'node:path';
import { addEntry } from './db.js';

export function addFile(db, { sourcePath, configDir, name, force = false }) {
  const resolvedSource = path.resolve(sourcePath);

  if (!fs.existsSync(resolvedSource)) {
    throw new Error(`Source "${resolvedSource}" does not exist.`);
  }

  const sourceStat = fs.lstatSync(resolvedSource);
  if (sourceStat.isSymbolicLink()) {
    throw new Error(`Source "${resolvedSource}" is already a symlink.`);
  }

  const destName = name ?? path.basename(resolvedSource);
  const destPath = path.join(configDir, destName);

  if (fs.existsSync(destPath) && !force) {
    throw new Error(
      `"${destName}" already exists in iCloud directory. Use --force to overwrite.`
    );
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
