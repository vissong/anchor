import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const ICLOUD_BASE = path.join(
  os.homedir(),
  'Library',
  'Mobile Documents',
  'com~apple~CloudDocs'
);

const DEFAULT_DIR_NAME = 'ianchor';

export function getICloudDrivePath() {
  return ICLOUD_BASE;
}

export function getConfigDir(icloudBase = ICLOUD_BASE, dirName = DEFAULT_DIR_NAME) {
  return path.join(icloudBase, dirName);
}

export function ensureConfigDir(icloudBase = ICLOUD_BASE, dirName = DEFAULT_DIR_NAME) {
  const icloudPath = icloudBase;
  if (!fs.existsSync(icloudPath)) {
    throw new Error('iCloud Drive not found. Please ensure iCloud is enabled.');
  }
  const configDir = getConfigDir(icloudBase, dirName);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return configDir;
}
