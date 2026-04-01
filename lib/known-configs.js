import os from 'node:os';
import path from 'node:path';

const HOME = os.homedir();

export const KNOWN_CONFIGS = {
  '.zshrc': path.join(HOME, '.zshrc'),
  '.bashrc': path.join(HOME, '.bashrc'),
  '.bash_profile': path.join(HOME, '.bash_profile'),
  '.zprofile': path.join(HOME, '.zprofile'),
  '.gitconfig': path.join(HOME, '.gitconfig'),
  '.vimrc': path.join(HOME, '.vimrc'),
  '.tmux.conf': path.join(HOME, '.tmux.conf'),
  '.ssh': path.join(HOME, '.ssh'),
  '.config': path.join(HOME, '.config'),
  'alacritty': path.join(HOME, '.config', 'alacritty'),
  'karabiner': path.join(HOME, '.config', 'karabiner'),
  'nvim': path.join(HOME, '.config', 'nvim'),
  'starship.toml': path.join(HOME, '.config', 'starship.toml'),
  'Code': path.join(HOME, 'Library', 'Application Support', 'Code', 'User'),
};

export function guessOriginalPath(name) {
  return KNOWN_CONFIGS[name] ?? null;
}
