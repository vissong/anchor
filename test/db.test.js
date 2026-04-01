import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { openDb, addEntry, getEntry, getAllEntries, updateEntry, deleteEntry } from '../lib/db.js';

describe('db', () => {
  let tmpDir;
  let db;

  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchor-db-test-'));
    db = openDb(tmpDir);
  });

  after(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates the entries table', () => {
    const tables = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='entries'"
    ).all();
    assert.equal(tables.length, 1);
  });

  it('inserts and retrieves an entry', () => {
    addEntry(db, { name: '.zshrc', originalPath: '/Users/test/.zshrc', type: 'file' });
    const entry = getEntry(db, '.zshrc');
    assert.equal(entry.name, '.zshrc');
    assert.equal(entry.original_path, '/Users/test/.zshrc');
    assert.equal(entry.type, 'file');
    assert.equal(entry.status, 'linked');
  });

  it('lists all entries', () => {
    addEntry(db, { name: '.bashrc', originalPath: '/Users/test/.bashrc', type: 'file' });
    const entries = getAllEntries(db);
    assert.ok(entries.length >= 2);
  });

  it('updates an entry', () => {
    updateEntry(db, '.zshrc', { originalPath: '/Users/other/.zshrc', status: 'unlinked' });
    const entry = getEntry(db, '.zshrc');
    assert.equal(entry.original_path, '/Users/other/.zshrc');
    assert.equal(entry.status, 'unlinked');
  });

  it('deletes an entry', () => {
    deleteEntry(db, '.bashrc');
    const entry = getEntry(db, '.bashrc');
    assert.equal(entry, undefined);
  });

  it('returns undefined for nonexistent entry', () => {
    const entry = getEntry(db, 'nonexistent');
    assert.equal(entry, undefined);
  });
});
