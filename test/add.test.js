import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb, getEntry } from '../lib/db.js';
import { addFile } from '../lib/add.js';

describe('add', () => {
  let tmpDir, configDir, sourceDir, db;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-add-test-'));
    configDir = path.join(tmpDir, 'config');
    sourceDir = path.join(tmpDir, 'home');
    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(sourceDir, { recursive: true });
    db = openDb(configDir);
  });

  it('moves a file to config dir and creates symlink', (t) => {
    const sourcePath = path.join(sourceDir, '.zshrc');
    fs.writeFileSync(sourcePath, 'export PATH=$PATH');

    addFile(db, { sourcePath, configDir });

    assert.ok(fs.existsSync(path.join(configDir, '.zshrc')));
    const stat = fs.lstatSync(sourcePath);
    assert.ok(stat.isSymbolicLink());
    const target = fs.readlinkSync(sourcePath);
    assert.equal(target, path.join(configDir, '.zshrc'));
    assert.equal(fs.readFileSync(sourcePath, 'utf8'), 'export PATH=$PATH');
    const entry = getEntry(db, '.zshrc');
    assert.equal(entry.name, '.zshrc');
    assert.equal(entry.original_path, sourcePath);
    assert.equal(entry.type, 'file');
    assert.equal(entry.status, 'linked');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('moves a directory to config dir and creates symlink', () => {
    const sourcePath = path.join(sourceDir, '.ssh');
    fs.mkdirSync(sourcePath);
    fs.writeFileSync(path.join(sourcePath, 'config'), 'Host *');

    addFile(db, { sourcePath, configDir });

    assert.ok(fs.existsSync(path.join(configDir, '.ssh', 'config')));
    const stat = fs.lstatSync(sourcePath);
    assert.ok(stat.isSymbolicLink());
    assert.equal(fs.readlinkSync(sourcePath), path.join(configDir, '.ssh'));

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('uses custom name when provided', () => {
    const sourcePath = path.join(sourceDir, 'settings.json');
    fs.writeFileSync(sourcePath, '{}');

    addFile(db, { sourcePath, configDir, name: 'vscode-settings' });

    assert.ok(fs.existsSync(path.join(configDir, 'vscode-settings')));
    const entry = getEntry(db, 'vscode-settings');
    assert.equal(entry.name, 'vscode-settings');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if source does not exist', () => {
    assert.throws(
      () => addFile(db, { sourcePath: '/nonexistent', configDir }),
      { message: /does not exist/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if source is already a symlink', () => {
    const realFile = path.join(sourceDir, 'real');
    fs.writeFileSync(realFile, 'data');
    const linkPath = path.join(sourceDir, 'link');
    fs.symlinkSync(realFile, linkPath);

    assert.throws(
      () => addFile(db, { sourcePath: linkPath, configDir }),
      { message: /already a symlink/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if name conflicts in config dir', () => {
    const sourcePath = path.join(sourceDir, '.zshrc');
    fs.writeFileSync(sourcePath, 'data');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'existing');

    assert.throws(
      () => addFile(db, { sourcePath, configDir }),
      { message: /already exists in iCloud directory/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
