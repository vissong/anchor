import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb, addEntry, getEntry } from '../lib/db.js';
import { relinkFile } from '../lib/relink.js';

describe('relink', () => {
  let tmpDir, configDir, originalDir, db;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ianchor-relink-test-'));
    configDir = path.join(tmpDir, 'config');
    originalDir = path.join(tmpDir, 'home');
    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(originalDir, { recursive: true });
    db = openDb(configDir);
  });

  it('creates symlink for unlinked file', () => {
    const originalPath = path.join(originalDir, '.zshrc');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'icloud content');
    addEntry(db, { name: '.zshrc', originalPath, type: 'file', status: 'unlinked' });

    relinkFile(db, { name: '.zshrc', configDir });

    assert.ok(fs.lstatSync(originalPath).isSymbolicLink());
    assert.equal(fs.readlinkSync(originalPath), path.join(configDir, '.zshrc'));
    assert.equal(fs.readFileSync(originalPath, 'utf8'), 'icloud content');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('renames existing file to .bak before creating symlink', () => {
    const originalPath = path.join(originalDir, '.zshrc');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'icloud content');
    fs.writeFileSync(originalPath, 'local content');
    addEntry(db, { name: '.zshrc', originalPath, type: 'file', status: 'unlinked' });

    relinkFile(db, { name: '.zshrc', configDir });

    // Symlink created
    assert.ok(fs.lstatSync(originalPath).isSymbolicLink());
    assert.equal(fs.readlinkSync(originalPath), path.join(configDir, '.zshrc'));
    // Original file backed up
    const bakPath = `${originalPath}.bak`;
    assert.ok(fs.existsSync(bakPath));
    assert.equal(fs.readFileSync(bakPath, 'utf8'), 'local content');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('renames existing directory to .bak before creating symlink', () => {
    const originalPath = path.join(originalDir, '.ssh');
    fs.mkdirSync(path.join(configDir, '.ssh'));
    fs.writeFileSync(path.join(configDir, '.ssh', 'config'), 'Host *');
    fs.mkdirSync(originalPath);
    fs.writeFileSync(path.join(originalPath, 'config'), 'old Host *');
    addEntry(db, { name: '.ssh', originalPath, type: 'directory', status: 'unlinked' });

    relinkFile(db, { name: '.ssh', configDir });

    assert.ok(fs.lstatSync(originalPath).isSymbolicLink());
    const bakPath = `${originalPath}.bak`;
    assert.ok(fs.existsSync(path.join(bakPath, 'config')));
    assert.equal(fs.readFileSync(path.join(bakPath, 'config'), 'utf8'), 'old Host *');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if entry not found', () => {
    assert.throws(
      () => relinkFile(db, { name: 'nonexistent', configDir }),
      { message: /not found/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if entry has no original_path', () => {
    fs.writeFileSync(path.join(configDir, 'mystery'), 'data');
    addEntry(db, { name: 'mystery', originalPath: null, type: 'file', status: 'unlinked' });

    assert.throws(
      () => relinkFile(db, { name: 'mystery', configDir }),
      { message: /no original path/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if already linked correctly', () => {
    const originalPath = path.join(originalDir, '.zshrc');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'content');
    fs.symlinkSync(path.join(configDir, '.zshrc'), originalPath);
    addEntry(db, { name: '.zshrc', originalPath, type: 'file', status: 'linked' });

    assert.throws(
      () => relinkFile(db, { name: '.zshrc', configDir }),
      { message: /already linked/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('updates db status to linked', () => {
    const originalPath = path.join(originalDir, '.gitconfig');
    fs.writeFileSync(path.join(configDir, '.gitconfig'), '[user]');
    addEntry(db, { name: '.gitconfig', originalPath, type: 'file', status: 'unlinked' });

    relinkFile(db, { name: '.gitconfig', configDir });

    const entry = getEntry(db, '.gitconfig');
    assert.equal(entry.status, 'linked');

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
