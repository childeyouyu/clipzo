# 视频播放器截图工具

一款 Chrome 浏览器扩展，用于检测网页上的视频播放器并进行截图保存。

## 功能特性

- 🔍 **自动检测**：自动扫描页面上的所有 `<video>` 视频播放器
- 📷 **一键截图**：点击即可截取当前播放的视频画面
- 📁 **自定义保存**：可设置截图保存的文件夹路径
- 🎨 **友好界面**：简洁美观的用户界面，操作便捷
- 📝 **智能命名**：根据视频标题自动生成带时间戳的文件名

## 安装方法

### 方式一：开发者模式加载（推荐）

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `video-screenshot-extension` 文件夹
5. 扩展图标将出现在浏览器工具栏中

### 方式二：打包安装

1. 在 `chrome://extensions/` 页面
2. 点击「打包扩展程序」
3. 选择扩展文件夹
4. 将生成的 `.crx` 文件拖拽到扩展页面安装

## 使用指南

### 基本使用

1. **打开包含视频的网页**
   - 访问任何包含 HTML5 视频播放器的网站
   - 例如：YouTube、Bilibili、腾讯视频等

2. **点击扩展图标**
   - 点击浏览器工具栏上的扩展图标 🎬
   - 弹出窗口会自动扫描视频播放器

3. **选择要截图的播放器**
   - 如果页面有多个视频，会显示列表供选择
   - 点击想要截图的播放器项

4. **截图完成**
   - 截图会自动保存到预设的文件夹
   - 成功后会显示保存的文件名
   - **注意**：截图只包含视频画面本身，自动排除了播放控件（进度条、按钮等）

### 设置保存位置

1. 点击扩展弹窗中的「设置」按钮
2. 在「截图保存文件夹」中输入路径
3. 路径格式示例：
   - `VideoScreenshots` - 保存到下载文件夹下的 VideoScreenshots 子文件夹
   - `Screenshots/2024` - 保存到嵌套文件夹
   - 留空则保存到默认下载文件夹
4. 点击「保存设置」

> **注意**：由于浏览器安全限制，截图会保存到 Chrome 的下载文件夹中。您设置的文件夹路径是相对于下载文件夹的。

## 技术架构

### 文件结构

```
video-screenshot-extension/
├── manifest.json          # 扩展配置文件
├── popup.html            # 弹窗界面
├── popup.js              # 弹窗交互逻辑
├── popup.css             # 弹窗样式
├── content.js            # 内容脚本（视频检测）
├── background.js         # 后台脚本（截图+下载）
├── options.html          # 设置页面
├── options.js            # 设置逻辑
├── options.css           # 设置页面样式
├── icons/                # 图标文件夹
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # 使用说明
```

### 核心模块说明

#### content.js - 视频检测模块

负责在当前页面中检测 `<video>` 元素，获取视频的位置、尺寸和播放信息，以及执行截图裁剪（使用 Canvas API）。

**主要方法：**
- `detectVideoPlayers()` - 扫描并返回所有视频播放器信息
- `getVideoTitle(video)` - 提取视频标题
- `scrollToVideo(playerId)` - 滚动到指定视频位置
- `getPlayerPosition(playerId)` - 获取播放器当前位置和**视频画面本身区域**（排除播放控件）
- `cropScreenshot(screenshotDataUrl, playerInfo)` - 使用 Canvas 裁剪截图到视频画面区域

**智能裁剪说明：**
扩展通过比较视频原始尺寸和播放器显示尺寸，计算出视频画面的实际显示区域，自动排除播放控件（如进度条、控制按钮等），只截取纯净的视频画面。

#### background.js - 截图处理模块

处理截图请求，截取屏幕，通过 content script 裁剪到视频区域，然后下载保存。

**主要方法：**
- `captureVideoScreenshot(windowId, tabId, playerInfo, title)` - 主入口
- `captureTabScreenshot(windowId)` - 截取标签页屏幕
- `downloadScreenshot(dataUrl, filename)` - 下载截图文件
- `generateFilename(title, saveFolder)` - 生成文件名

**注意：** 由于 Manifest V3 的 Service Worker 无法使用 DOM API，截图裁剪操作委托给 content.js 执行。

#### popup.js - 用户界面模块

提供用户界面，显示检测到的播放器列表，处理用户交互。

**主要方法：**
- `handleScan()` - 扫描按钮处理
- `displayPlayers(players)` - 显示播放器列表
- `handlePlayerClick(player)` - 处理截图点击

#### options.js - 设置管理模块

管理用户设置，保存和读取配置。

**存储结构：**
```javascript
{
  saveFolder: string  // 保存文件夹路径
}
```

## 开发指南

### 开发环境要求

- Chrome 浏览器（版本 88+，支持 Manifest V3）
- 文本编辑器（VS Code 推荐）

### 本地开发

1. 克隆或下载项目代码
2. 按照「安装方法」加载扩展
3. 修改代码后，在扩展页面点击刷新按钮即可生效

### 调试技巧

- **内容脚本调试**：在网页按 F12，在「Sources」面板中找到 Content Scripts
- **后台脚本调试**：在扩展页面点击「Service Worker」打开 DevTools
- **弹窗调试**：右键点击扩展图标，选择「检查弹出内容」

### API 说明

#### Chrome APIs 使用

- `chrome.tabs.captureVisibleTab` - 截取可见标签页
- `chrome.downloads.download` - 下载文件
- `chrome.storage.local` - 本地存储
- `chrome.tabs.sendMessage` - 与内容脚本通信

#### 消息通信

**内容脚本 ↔ Popup/Background：**
```javascript
// 检测播放器
{ action: 'detectPlayers' }
// 响应: { success: true, players: [...] }

// 滚动到视频
{ action: 'scrollToVideo', playerId: number }

// 获取位置
{ action: 'getPlayerPosition', playerId: number }
// 响应: { success: true, position: {...} }

// 裁剪截图（由 background.js 调用）
{ action: 'cropScreenshot', screenshotDataUrl: string, playerInfo: {...} }
// 响应: { success: true, croppedDataUrl: string }
```

**Background ↔ Popup：**
```javascript
// 截图请求
{ action: 'captureScreenshot', playerId: number, title: string }
// 响应: { success: true, downloadId: number, filename: string }
```

## 常见问题

### Q: 为什么检测不到某些视频？

A: 可能的原因：
- 视频使用 Flash 或其他非 HTML5 技术
- 视频在 iframe 中加载（部分网站）
- 视频是动态加载的，需要刷新页面重试

### Q: 截图位置不准确？

A: 请确保：
- 页面没有缩放（按 Ctrl+0 重置缩放）
- 截图时视频在可视区域内
- 页面已完全加载完成

### Q: 如何更改默认下载文件夹？

A: 在 Chrome 设置中：
1. 打开 `chrome://settings/`
2. 搜索「下载」
3. 修改「下载位置」

### Q: 支持哪些视频网站？

A: 理论上支持所有使用标准 HTML5 `<video>` 标签的网站，包括：
- YouTube、Bilibili、腾讯视频、爱奇艺
- 在线课程网站（慕课网、网易云课堂等）
- 任何包含 HTML5 视频的网页

## 更新日志

### v1.0.1 (2024-04-18)
- ✨ 智能裁剪：只截取视频画面，自动排除播放控件

### v1.0.0 (2024-04-18)
- ✨ 初始版本发布
- 🔍 视频播放器自动检测
- 📷 截图并保存功能
- 📁 自定义保存文件夹
- 🎨 用户界面设计

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- Email: your-email@example.com
