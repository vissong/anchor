import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { initAnchor } from '../lib/init.js';

describe('init', () => {
  let tmpDir;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ianchor-init-test-'));
  });

  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates config directory and database', () => {
    const result = initAnchor({ icloudBase: tmpDir, dirName: 'config', interactive: false });
    const configDir = path.join(tmpDir, 'config');
    assert.ok(fs.existsSync(configDir));
    assert.ok(fs.existsSync(path.join(configDir, 'ianchor.db')));
    assert.equal(result.configDir, configDir);
    assert.equal(result.discovered, 0);
  });

  it('discovers existing files in config directory', () => {
    const configDir = path.join(tmpDir, 'testdir');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'test');
    fs.mkdirSync(path.join(configDir, '.ssh'));

    const result = initAnchor({ icloudBase: tmpDir, dirName: 'testdir', interactive: false });
    assert.equal(result.discovered, 2);
    assert.ok(result.entries.some(e => e.name === '.zshrc'));
    assert.ok(result.entries.some(e => e.name === '.ssh'));
  });

  it('auto-populates original_path for known configs', () => {
    const result = initAnchor({ icloudBase: tmpDir, dirName: 'testdir', interactive: false });
    const zshrc = result.entries.find(e => e.name === '.zshrc');
    assert.equal(zshrc.original_path, path.join(os.homedir(), '.zshrc'));
  });

  it('throws if iCloud base does not exist', () => {
    assert.throws(
      () => initAnchor({ icloudBase: '/nonexistent/path', dirName: 'config', interactive: false }),
      { message: 'iCloud Drive not found. Please ensure iCloud is enabled.' }
    );
  });

  it('ignores .DS_Store files', () => {
    const configDir = path.join(tmpDir, 'ignore-test');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, '.DS_Store'), '');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'test');

    const result = initAnchor({ icloudBase: tmpDir, dirName: 'ignore-test', interactive: false });
    assert.equal(result.discovered, 1);
    assert.ok(!result.entries.some(e => e.name === '.DS_Store'));
    assert.ok(result.entries.some(e => e.name === '.zshrc'));
  });

  it('ignores image files', () => {
    const configDir = path.join(tmpDir, 'img-test');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'screenshot.png'), '');
    fs.writeFileSync(path.join(configDir, 'photo.jpg'), '');
    fs.writeFileSync(path.join(configDir, '.gitconfig'), 'test');

    const result = initAnchor({ icloudBase: tmpDir, dirName: 'img-test', interactive: false });
    assert.equal(result.discovered, 1);
    assert.ok(result.entries.some(e => e.name === '.gitconfig'));
    assert.ok(!result.entries.some(e => e.name === 'screenshot.png'));
    assert.ok(!result.entries.some(e => e.name === 'photo.jpg'));
  });
});
