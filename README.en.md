# iAnchor

Sync your config files to iCloud Drive via symlinks. Keep dotfiles and app configs in sync across all your Macs automatically.

[中文文档](README.md)

## How It Works

iAnchor moves config files/directories into an iCloud Drive directory, then creates symlinks at the original locations. iCloud syncs the files, and symlinks ensure your apps still find their configs.

## Install

```bash
brew tap vissong/ianchor
brew install ianchor
```

## Upgrade

```bash
brew update
brew upgrade ianchor
```

## Usage

### Initialize

```bash
ianchor init
ianchor init --dir dotfiles  # custom directory name
```

### Add a config file

```bash
ianchor add ~/.zshrc
ianchor add ~/.ssh --name ssh-config
ianchor add ~/.config/alacritty
```

### List tracked configs

```bash
ianchor list
ianchor list --json
```

### Recover a config file

```bash
ianchor recover .zshrc
ianchor recover --force .zshrc  # overwrite existing file
```

### Relink an unlinked file

```bash
ianchor relink .zshrc
```

### Remove a tracked file

```bash
ianchor remove .zshrc
ianchor remove -y .zshrc  # skip confirmation
```

## License

MIT
