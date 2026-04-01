import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { guessOriginalPath, KNOWN_CONFIGS } from '../lib/known-configs.js';

const HOME = os.homedir();

describe('known-configs', () => {
  it('exports a non-empty KNOWN_CONFIGS map', () => {
    assert.ok(Object.keys(KNOWN_CONFIGS).length > 0);
  });

  it('guesses original path for .zshrc', () => {
    assert.equal(guessOriginalPath('.zshrc'), path.join(HOME, '.zshrc'));
  });

  it('guesses original path for alacritty', () => {
    assert.equal(guessOriginalPath('alacritty'), path.join(HOME, '.config', 'alacritty'));
  });

  it('guesses original path for Code (VS Code)', () => {
    assert.equal(
      guessOriginalPath('Code'),
      path.join(HOME, 'Library', 'Application Support', 'Code', 'User')
    );
  });

  it('returns null for unknown config', () => {
    assert.equal(guessOriginalPath('unknown-file-xyz'), null);
  });
});
