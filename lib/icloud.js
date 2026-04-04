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

const CONFIG_PATH = path.join(os.homedir(), '.config', 'ianchor.json');

export function getICloudDrivePath() {
  return ICLOUD_BASE;
}

export function saveConfig({ dirName }) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({ dirName }, null, 2) + '\n');
}

export function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

export function getConfigDir(icloudBase = ICLOUD_BASE, dirName) {
  if (!dirName) {
    dirName = loadConfig().dirName || DEFAULT_DIR_NAME;
  }
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
