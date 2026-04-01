import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb, addEntry, getEntry } from '../lib/db.js';
import { removeFile } from '../lib/remove.js';

describe('remove', () => {
  let tmpDir, configDir, originalDir, db;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-remove-test-'));
    configDir = path.join(tmpDir, 'config');
    originalDir = path.join(tmpDir, 'home');
    fs.mkdirSync(configDir, { recursive: true });
    fs.mkdirSync(originalDir, { recursive: true });
    db = openDb(configDir);
  });

  it('removes file from iCloud and deletes db entry', () => {
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'content');
    addEntry(db, { name: '.zshrc', originalPath: '/tmp/fake', type: 'file', status: 'unlinked' });

    removeFile(db, { name: '.zshrc', configDir });

    assert.ok(!fs.existsSync(path.join(configDir, '.zshrc')));
    assert.equal(getEntry(db, '.zshrc'), undefined);

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes directory from iCloud and deletes db entry', () => {
    fs.mkdirSync(path.join(configDir, '.ssh'));
    fs.writeFileSync(path.join(configDir, '.ssh', 'config'), 'Host *');
    addEntry(db, { name: '.ssh', originalPath: '/tmp/fake', type: 'directory', status: 'unlinked' });

    removeFile(db, { name: '.ssh', configDir });

    assert.ok(!fs.existsSync(path.join(configDir, '.ssh')));
    assert.equal(getEntry(db, '.ssh'), undefined);

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('also removes symlink at original path if it points to iCloud', () => {
    const originalPath = path.join(originalDir, '.zshrc');
    fs.writeFileSync(path.join(configDir, '.zshrc'), 'content');
    fs.symlinkSync(path.join(configDir, '.zshrc'), originalPath);
    addEntry(db, { name: '.zshrc', originalPath, type: 'file', status: 'linked' });

    removeFile(db, { name: '.zshrc', configDir });

    assert.ok(!fs.existsSync(path.join(configDir, '.zshrc')));
    assert.ok(!fs.existsSync(originalPath));
    assert.equal(getEntry(db, '.zshrc'), undefined);

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('works when iCloud file already deleted (cleanup db)', () => {
    addEntry(db, { name: 'gone.txt', originalPath: '/tmp/fake', type: 'file', status: 'unlinked' });

    removeFile(db, { name: 'gone.txt', configDir });

    assert.equal(getEntry(db, 'gone.txt'), undefined);

    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if entry not found in database', () => {
    assert.throws(
      () => removeFile(db, { name: 'nonexistent', configDir }),
      { message: /not found/ }
    );
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
