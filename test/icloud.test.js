import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getICloudDrivePath, getConfigDir, ensureConfigDir } from '../lib/icloud.js';

describe('icloud', () => {
  describe('getICloudDrivePath', () => {
    it('returns the iCloud Drive path on macOS', () => {
      const result = getICloudDrivePath();
      assert.equal(
        result,
        path.join(os.homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs')
      );
    });
  });

  describe('getConfigDir', () => {
    let tmpDir;

    before(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ianchor-test-'));
    });

    after(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns icloudBase/ianchor by default', () => {
      const result = getConfigDir(tmpDir);
      assert.equal(result, path.join(tmpDir, 'ianchor'));
    });

    it('returns icloudBase/<custom> when dirName is provided', () => {
      const result = getConfigDir(tmpDir, 'dotfiles');
      assert.equal(result, path.join(tmpDir, 'dotfiles'));
    });
  });

  describe('ensureConfigDir', () => {
    let tmpDir;

    before(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ianchor-test-'));
    });

    after(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('creates config directory if it does not exist', () => {
      const result = ensureConfigDir(tmpDir, 'config');
      assert.equal(result, path.join(tmpDir, 'config'));
      assert.ok(fs.existsSync(result));
    });

    it('throws when iCloud base does not exist', () => {
      assert.throws(
        () => ensureConfigDir('/nonexistent/path'),
        { message: 'iCloud Drive not found. Please ensure iCloud is enabled.' }
      );
    });
  });
});
