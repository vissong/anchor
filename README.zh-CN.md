# iAnchor

通过符号链接将配置文件同步到 iCloud Drive，让所有 Mac 自动共享 dotfiles 和应用配置。

[English](README.md)

## 工作原理

iAnchor 将配置文件/目录移动到 iCloud Drive 中的指定目录，然后在原始位置创建符号链接。iCloud 负责同步文件，符号链接确保应用程序仍能找到配置。

## 安装

```bash
brew tap vissong/anchor https://github.com/vissong/anchor
brew install ianchor
```

## 使用

### 初始化

```bash
ianchor init
ianchor init --dir dotfiles  # 自定义目录名
```

### 添加配置文件

```bash
ianchor add ~/.zshrc
ianchor add ~/.ssh --name ssh-config
ianchor add ~/.config/alacritty
```

### 查看已追踪的配置

```bash
ianchor list
ianchor list --json
```

### 恢复配置文件

将 iCloud 中的文件拷贝回原始位置，取消符号链接。

```bash
ianchor recover .zshrc
ianchor recover --force .zshrc  # 覆盖已存在的文件
```

### 重新链接

为未链接的文件重新创建符号链接。

```bash
ianchor relink .zshrc
```

### 移除追踪

从数据库中删除记录并删除 iCloud 中的文件。

```bash
ianchor remove .zshrc
ianchor remove -y .zshrc  # 跳过确认
```

## License

MIT
