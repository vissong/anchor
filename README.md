# Anchor

Sync your config files to iCloud Drive via symlinks. Keep dotfiles and app configs in sync across all your Macs automatically.

## How It Works

Anchor moves config files/directories into an iCloud Drive directory, then creates symlinks at the original locations. iCloud syncs the files, and symlinks ensure your apps still find their configs.

## Install

```bash
brew tap vissong/anchor
brew install anchor
```

Or via npm:

```bash
npm install -g anchor-cli
```

## Usage

### Initialize

```bash
anchor init
anchor init --dir dotfiles  # custom directory name
```

### Add a config file

```bash
anchor add ~/.zshrc
anchor add ~/.ssh --name ssh-config
anchor add ~/.config/alacritty
```

### List tracked configs

```bash
anchor list
anchor list --json
```

### Recover a config file

```bash
anchor recover .zshrc
anchor recover --force .zshrc  # overwrite existing file
```

## License

MIT
