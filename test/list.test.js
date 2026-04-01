import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb, addEntry } from '../lib/db.js';
import { listEntries } from '../lib/list.js';

describe('list', () => {
  let tmpDir;
  let db;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-list-test-'));
    db = openDb(tmpDir);
    addEntry(db, { name: '.zshrc', originalPath: '/Users/test/.zshrc', type: 'file', status: 'linked' });
    addEntry(db, { name: '.ssh', originalPath: '/Users/test/.ssh', type: 'directory', status: 'linked' });
  });

  after(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns formatted table string', () => {
    const output = listEntries(db, { json: false });
    assert.ok(typeof output === 'string');
    assert.ok(output.includes('.zshrc'));
    assert.ok(output.includes('.ssh'));
  });

  it('returns JSON array when json option is true', () => {
    const output = listEntries(db, { json: true });
    const parsed = JSON.parse(output);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].name, '.ssh');
  });

  it('returns message when no entries exist', () => {
    const emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-list-empty-'));
    const emptyDb = openDb(emptyDir);
    const output = listEntries(emptyDb, { json: false });
    assert.ok(output.includes('No entries'));
    emptyDb.close();
    fs.rmSync(emptyDir, { recursive: true, force: true });
  });
});
