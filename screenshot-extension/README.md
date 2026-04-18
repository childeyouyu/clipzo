# 视频截图工具 (Video Screenshot Tool)

[English](#english) | [中文](#中文)

## 简体中文

### 介绍

视频截图工具是一款Chrome浏览器扩展程序，可以在网页视频播放器上显示截图按钮，帮助用户快速捕获视频画面。

### 功能特性

- **一键截图** - 点击按钮即可保存当前视频帧
- **高清画质** - 保存原始分辨率的PNG图片
- **智能识别** - 自动检测页面中的视频播放器
- **多语言支持** - 支持中文和英文界面
- **广泛兼容** - 支持多种视频网站和播放器

### 支持的网站

- 哔哩哔哩 (Bilibili)
- YouTube
- 飞牛影视
- 其他使用标准HTML5视频的网站

### 安装方法

1. 打开Chrome浏览器，进入扩展管理页面：`chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择扩展程序所在的文件夹

### 使用方法

1. 打开包含视频的网页
2. 视频播放器右侧会显示"截图"按钮
3. 点击按钮即可保存当前画面到下载文件夹

### 语言切换

点击popup界面中的"中文"或"English"按钮切换语言。语言设置会自动保存。

### 二次开发

如果需要对本扩展进行二次开发，可以参考以下文件结构：

```
screenshot-extension/
├── manifest.json      # 扩展配置文件
├── content.js         # 内容脚本（视频检测和截图功能）
├── popup.html         # 弹窗页面
├── popup.js           # 弹窗脚本（语言切换）
├── background.js      # 后台脚本
├── content.css        # 样式文件
├── icons/             # 图标文件
└── _locales/          # 多语言文件
```

### 注意事项

- 截图会保存到浏览器默认下载目录
- 文件命名格式：`截图_页面标题_时间戳.png`
- 部分网站可能需要登录后才能观看视频

---

## English

### Introduction

Video Screenshot Tool is a Chrome browser extension that displays a screenshot button on web video players, helping users quickly capture video frames.

### Features

- **One-Click Screenshot** - Click to save current video frame
- **High Quality** - Saves images in original resolution as PNG
- **Smart Detection** - Automatically detects video players on page
- **Multi-language** - Supports Chinese and English
- **Wide Compatibility** - Works with various video websites and players

### Supported Sites

- Bilibili
- YouTube
- Feiniu Video
- Other websites using standard HTML5 video

### Installation

1. Open Chrome browser, go to Extensions page: `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the extension folder

### How to Use

1. Open a webpage with video
2. The "Screenshot" button appears on the right side of the video player
3. Click the button to save the current frame to your download folder

### Language Switch

Click "中文" or "English" button in the popup to switch language. The language setting will be saved automatically.

### Development

For二次开发, please refer to the following file structure:

```
screenshot-extension/
├── manifest.json      # Extension configuration
├── content.js         # Content script (video detection & screenshot)
├── popup.html         # Popup page
├── popup.js           # Popup script (language switch)
├── background.js      # Background script
├── content.css        # Style file
├── icons/             # Icon files
└── _locales/          # Multi-language files
```

### Notes

- Screenshots are saved to the browser's default download folder
- File naming format: `Screenshot_PageTitle_Timestamp.png`
- Some websites may require login to view videos

---

## 版本 / Version

当前版本 / Current Version: 1.0