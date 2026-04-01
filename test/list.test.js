import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb, addEntry } from '../lib/db.js';
import { listEntries } from '../lib/list.js';

describe('list', () => {
  let tmpDir, sourceDir;
  let db;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ianchor-list-test-'));
    sourceDir = path.join(tmpDir, 'home');
    fs.mkdirSync(sourceDir, { recursive: true });

    // Create real files in config dir to simulate iCloud
    fs.writeFileSync(path.join(tmpDir, '.zshrc'), 'zsh content');
    fs.mkdirSync(path.join(tmpDir, '.ssh'));

    // Create a symlink at "original path" pointing to config dir file
    const zshrcOriginal = path.join(sourceDir, '.zshrc');
    fs.symlinkSync(path.join(tmpDir, '.zshrc'), zshrcOriginal);

    db = openDb(tmpDir);
    addEntry(db, { name: '.zshrc', originalPath: zshrcOriginal, type: 'file', status: 'linked' });
    addEntry(db, { name: '.ssh', originalPath: path.join(sourceDir, '.ssh'), type: 'directory', status: 'linked' });
  });

  after(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns formatted table string', () => {
    const output = listEntries(db, { json: false, configDir: tmpDir });
    assert.ok(typeof output === 'string');
    assert.ok(output.includes('.zshrc'));
    assert.ok(output.includes('.ssh'));
  });

  it('detects linked status from actual symlink', () => {
    const output = listEntries(db, { json: true, configDir: tmpDir });
    const parsed = JSON.parse(output);
    const zshrc = parsed.find(e => e.name === '.zshrc');
    const ssh = parsed.find(e => e.name === '.ssh');
    // .zshrc has a real symlink -> linked
    assert.equal(zshrc.status, 'linked');
    // .ssh has no symlink at original path -> unlinked
    assert.equal(ssh.status, 'unlinked');
  });

  it('returns JSON array when json option is true', () => {
    const output = listEntries(db, { json: true, configDir: tmpDir });
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 2);
  });

  it('returns message when no entries exist', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ianchor-list-empty-'));
    const emptyDb = openDb(emptyDir);
    const output = listEntries(emptyDb, { json: false, configDir: emptyDir });
    assert.ok(output.includes('No entries'));
    emptyDb.close();
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  it('detects deleted status when iCloud file is missing', () => {
    const delDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ianchor-list-del-'));
    const delDb = openDb(delDir);
    // Entry in db but no file on disk
    addEntry(delDb, { name: 'gone.txt', originalPath: '/tmp/fake', type: 'file', status: 'linked' });

    const output = listEntries(delDb, { json: true, configDir: delDir });
    const parsed = JSON.parse(output);
    assert.equal(parsed[0].status, 'deleted');

    // Table output should contain remove hint
    const tableOutput = listEntries(delDb, { json: false, configDir: delDir });
    assert.ok(tableOutput.includes('ianchor remove'));

    delDb.close();
    fs.rmSync(delDir, { recursive: true, force: true });
  });
});
