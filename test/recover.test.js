import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb, addEntry, getEntry } from '../lib/db.js';
import { recoverFile } from '../lib/recover.js';

describe('recover', () => {
  let tmpDir, configDir, originalDir, db;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-recover-test-'));
    configDir = path.join(tmpDir, 'config');
    originalDir = path.join(tmpDir, 'home');
    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(originalDir, { recursive: true });
    db = openDb(configDir);
  });

  it('recovers a file: copies back, removes symlink, deletes from iCloud and db', () => {
    const originalPath = path.join(originalDir, '.zshrc');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'export PATH=$PATH');
    fs.symlinkSync(path.join(configDir, '.zshrc'), originalPath);
    addEntry(db, { name: '.zshrc', originalPath, type: 'file', status: 'linked' });

    recoverFile(db, { name: '.zshrc', configDir });

    assert.ok(fs.existsSync(originalPath));
    assert.ok(!fs.lstatSync(originalPath).isSymbolicLink());
    assert.equal(fs.readFileSync(originalPath, 'utf8'), 'export PATH=$PATH');
    assert.ok(!fs.existsSync(path.join(configDir, '.zshrc')));
    assert.equal(getEntry(db, '.zshrc'), undefined);

    // Backup should exist in .bak
    const bakPath = path.join(configDir, '.bak', '.zshrc');
    assert.ok(fs.existsSync(bakPath));
    assert.equal(fs.readFileSync(bakPath, 'utf8'), 'export PATH=$PATH');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('recovers a directory and creates backup', () => {
    const originalPath = path.join(originalDir, '.ssh');
    fs.mkdirSync(path.join(configDir, '.ssh'));
    fs.writeFileSync(path.join(configDir, '.ssh', 'config'), 'Host *');
    fs.symlinkSync(path.join(configDir, '.ssh'), originalPath);
    addEntry(db, { name: '.ssh', originalPath, type: 'directory', status: 'linked' });

    recoverFile(db, { name: '.ssh', configDir });

    assert.ok(fs.existsSync(path.join(originalPath, 'config')));
    assert.ok(!fs.lstatSync(originalPath).isSymbolicLink());
    assert.ok(!fs.existsSync(path.join(configDir, '.ssh')));

    // Backup should exist in .bak
    const bakPath = path.join(configDir, '.bak', '.ssh', 'config');
    assert.ok(fs.existsSync(bakPath));
    assert.equal(fs.readFileSync(bakPath, 'utf8'), 'Host *');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if entry not found in database', () => {
    assert.throws(
      () => recoverFile(db, { name: 'nonexistent', configDir }),
      { message: /not found/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if file conflicts at original path but backup still exists', () => {
    const originalPath = path.join(originalDir, '.zshrc');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'icloud version');
    fs.writeFileSync(originalPath, 'local version');
    addEntry(db, { name: '.zshrc', originalPath, type: 'file', status: 'linked' });

    assert.throws(
      () => recoverFile(db, { name: '.zshrc', configDir }),
      { message: /already exists at original path/ }
    );

    // Backup should still exist even though recover failed
    const bakPath = path.join(configDir, '.bak', '.zshrc');
    assert.ok(fs.existsSync(bakPath));
    assert.equal(fs.readFileSync(bakPath, 'utf8'), 'icloud version');
    // Original iCloud file should still be intact
    assert.ok(fs.existsSync(path.join(configDir, '.zshrc')));

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('recovers with --force when file conflicts at original path', () => {
    const originalPath = path.join(originalDir, '.zshrc');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'icloud version');
    fs.writeFileSync(originalPath, 'local version');
    addEntry(db, { name: '.zshrc', originalPath, type: 'file', status: 'linked' });

    recoverFile(db, { name: '.zshrc', configDir, force: true });

    assert.equal(fs.readFileSync(originalPath, 'utf8'), 'icloud version');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
