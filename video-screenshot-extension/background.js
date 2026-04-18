/**
 * 后台脚本 - 截图和下载处理模块
 * 
 * 功能说明：
 * 1. 处理来自 popup 的截图请求
 * 2. 截取整个标签页的屏幕截图
 * 3. 使用 Canvas 裁剪出视频区域
 * 4. 根据用户设置保存到指定文件夹或默认下载文件夹
 * 
 * 主要方法：
 * - captureVideoScreenshot: 主入口，处理截图流程
 * - captureTabScreenshot: 截取标签页屏幕
 * - cropScreenshot: 裁剪截图到视频区域
 * - downloadScreenshot: 下载截图文件
 * 
 * 注意事项：
 * - 截图时页面必须可见（不能在后台标签页）
 * - Chrome 扩展无法直接写入任意文件夹，只能使用 downloads API
 * - 通过设置 filename 参数可以指定相对 downloads 目录的子文件夹
 */

/**
 * 主入口：截取视频播放器截图
 * @param {number} windowId - 目标窗口ID
 * @param {number} tabId - 目标标签页ID
 * @param {Object} playerInfo - 播放器信息（位置、尺寸等）
 * @param {string} title - 视频标题（用于文件名）
 * @returns {Promise<Object>} 截图结果
 */
async function captureVideoScreenshot(windowId, tabId, playerInfo, title) {
  try {
    // 1. 获取用户设置
    const settings = await chrome.storage.local.get(['saveFolder']);
    const saveFolder = settings.saveFolder || '';

    // 2. 截取整个标签页
    const screenshotDataUrl = await captureTabScreenshot(windowId);

    // 3. 裁剪到视频区域（通过 content script 执行，因为 Service Worker 无法使用 DOM API）
    const cropResponse = await chrome.tabs.sendMessage(tabId, {
      action: 'cropScreenshot',
      screenshotDataUrl: screenshotDataUrl,
      playerInfo: playerInfo
    });

    if (!cropResponse.success) {
      throw new Error(cropResponse.error || '裁剪失败');
    }

    const croppedDataUrl = cropResponse.croppedDataUrl;

    // 4. 生成文件名
    const filename = generateFilename(title, saveFolder);

    // 5. 下载文件
    const downloadId = await downloadScreenshot(croppedDataUrl, filename);

    return {
      success: true,
      downloadId: downloadId,
      filename: filename
    };

  } catch (error) {
    console.error('[视频截图工具] 截图失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 截取标签页屏幕
 * @param {number} windowId - 窗口ID（null表示当前窗口）
 * @returns {Promise<string>} 截图的 Data URL
 */
function captureTabScreenshot(windowId) {
  return new Promise((resolve, reject) => {
    // 使用窗口ID进行截图，null表示当前窗口
    chrome.tabs.captureVisibleTab(
      windowId,
      { format: 'png', quality: 100 },
      (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(dataUrl);
        }
      }
    );
  });
}

/**
 * 下载截图文件
 * @param {string} dataUrl - 图片 Data URL
 * @param {string} filename - 文件名（可包含相对路径）
 * @returns {Promise<number>} 下载ID
 */
function downloadScreenshot(dataUrl, filename) {
  return new Promise((resolve, reject) => {
    // 直接使用 data URL 下载（chrome.downloads 支持 data URL）
    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false  // 不显示保存对话框，直接下载
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(downloadId);
      }
    });
  });
}

/**
 * 生成文件名
 * 格式：[文件夹/]标题_YYYYMMDD_HHMMSS.png
 * @param {string} title - 视频标题
 * @param {string} saveFolder - 保存文件夹（相对路径）
 * @returns {string} 完整文件名
 */
function generateFilename(title, saveFolder) {
  // 清理标题中的非法字符
  const cleanTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
  
  // 生成时间戳
  const now = new Date();
  const timestamp = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

  // 组合文件名
  const filename = `${cleanTitle}_${timestamp}.png`;

  // 添加文件夹前缀
  if (saveFolder) {
    // 确保文件夹路径以 / 结尾
    const folder = saveFolder.endsWith('/') ? saveFolder : saveFolder + '/';
    return folder + filename;
  }

  return filename;
}

/**
 * 监听来自 popup 的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'captureScreenshot') {
    // 获取当前活动窗口和标签页
    chrome.windows.getCurrent(async (currentWindow) => {
      if (!currentWindow) {
        sendResponse({ success: false, error: '未找到当前窗口' });
        return;
      }

      try {
        // 获取当前活动标签页
        const [activeTab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
        
        if (!activeTab) {
          sendResponse({ success: false, error: '未找到活动标签页' });
          return;
        }

        // 先滚动到视频位置，确保视频可见
        await chrome.tabs.sendMessage(activeTab.id, {
          action: 'scrollToVideo',
          playerId: request.playerId
        });

        // 等待滚动动画完成
        await new Promise(resolve => setTimeout(resolve, 500));

        // 获取最新的播放器位置
        const positionResponse = await chrome.tabs.sendMessage(activeTab.id, {
          action: 'getPlayerPosition',
          playerId: request.playerId
        });

        if (!positionResponse.success || !positionResponse.position) {
          sendResponse({ success: false, error: '无法获取播放器位置' });
          return;
        }

        // 执行截图（传入窗口ID和标签页ID）
        const result = await captureVideoScreenshot(
          currentWindow.id,
          activeTab.id,
          positionResponse.position,
          request.title
        );

        sendResponse(result);

      } catch (error) {
        console.error('[视频截图工具] 截图错误:', error);
        sendResponse({ success: false, error: error.message });
      }
    });

    // 返回 true 表示异步响应
    return true;
  }
});
