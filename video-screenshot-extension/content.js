/**
 * 内容脚本 - 视频播放器检测模块
 * 
 * 功能说明：
 * 1. 扫描当前页面的所有 <video> 元素
 * 2. 获取每个播放器的位置、尺寸和当前播放信息
 * 3. 通过 Chrome 消息机制将播放器信息传递给 popup
 * 
 * 使用方法：
 * - 此脚本会在每个页面加载完成后自动注入
 * - 通过 chrome.runtime.sendMessage 与 popup/background 通信
 * 
 * 注意事项：
 * - 某些网站可能使用 iframe 嵌套视频，这种情况下需要额外处理
 * - 动态加载的视频（如点击后加载）需要重新扫描
 */

(function() {
  'use strict';

  /**
   * 检测页面上的所有视频播放器
   * @returns {Array} 返回视频播放器信息数组
   */
  function detectVideoPlayers() {
    const videos = document.querySelectorAll('video');
    const players = [];

    videos.forEach((video, index) => {
      // 获取视频元素在视口中的位置
      const rect = video.getBoundingClientRect();
      
      // 只记录可见且尺寸合理的视频
      if (rect.width > 50 && rect.height > 50) {
        // 尝试获取视频标题
        const title = getVideoTitle(video);
        
        players.push({
          id: index,
          src: video.currentSrc || video.src || '未知来源',
          title: title,
          // 相对于整个文档的位置（考虑滚动）
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
          // 视口中的位置
          viewportX: rect.left,
          viewportY: rect.top,
          // 播放信息
          currentTime: video.currentTime,
          duration: video.duration,
          paused: video.paused,
          // 页面URL，用于验证
          pageUrl: window.location.href
        });
      }
    });

    return players;
  }

  /**
   * 获取视频标题
   * 尝试从周围元素或页面信息中获取有意义的标题
   * @param {HTMLVideoElement} video - 视频元素
   * @returns {string} 视频标题
   */
  function getVideoTitle(video) {
    // 策略1：查找最近的标题元素
    let element = video;
    for (let i = 0; i < 5; i++) {
      element = element.parentElement;
      if (!element) break;
      
      // 查找常见的标题标签
      const titleEl = element.querySelector('h1, h2, h3, [class*="title"], [class*="caption"]');
      if (titleEl && titleEl.textContent.trim()) {
        return titleEl.textContent.trim().substring(0, 100);
      }
    }

    // 策略2：使用页面标题
    if (document.title) {
      return document.title.substring(0, 100);
    }

    // 策略3：使用视频索引作为默认标题
    return `视频播放器 ${Date.now()}`;
  }

  /**
   * 滚动到视频位置
   * @param {number} playerId - 播放器ID
   */
  function scrollToVideo(playerId) {
    const videos = document.querySelectorAll('video');
    if (videos[playerId]) {
      videos[playerId].scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 高亮显示
      videos[playerId].style.outline = '3px solid #4CAF50';
      setTimeout(() => {
        videos[playerId].style.outline = '';
      }, 2000);
    }
  }

  /**
   * 获取指定播放器的最新位置信息
   * 计算视频画面本身的区域（排除播放控件）
   * @param {number} playerId - 播放器ID
   * @returns {Object|null} 位置信息对象
   */
  function getPlayerPosition(playerId) {
    const videos = document.querySelectorAll('video');
    const video = videos[playerId];
    
    if (!video) return null;

    const rect = video.getBoundingClientRect();
    
    // 获取视频原始尺寸
    const videoWidth = video.videoWidth || rect.width;
    const videoHeight = video.videoHeight || rect.height;
    
    // 计算视频在播放器中的实际显示区域（保持宽高比）
    const videoRatio = videoWidth / videoHeight;
    const playerRatio = rect.width / rect.height;
    
    let actualVideoWidth = rect.width;
    let actualVideoHeight = rect.height;
    let offsetX = 0;
    let offsetY = 0;
    
    if (videoRatio > playerRatio) {
      // 视频比播放器更宽，上下可能有黑边或控件
      actualVideoHeight = rect.width / videoRatio;
      offsetY = (rect.height - actualVideoHeight) / 2;
    } else if (videoRatio < playerRatio) {
      // 视频比播放器更高，左右可能有黑边
      actualVideoWidth = rect.height * videoRatio;
      offsetX = (rect.width - actualVideoWidth) / 2;
    }
    
    // 检测并排除底部控件区域
    // 如果播放器高度明显大于视频实际高度，底部可能有控件
    const heightDiff = rect.height - actualVideoHeight;
    const controlBarHeight = Math.max(0, heightDiff - offsetY * 2);
    
    // 如果只在一侧有控件（通常是底部），调整高度
    if (controlBarHeight > 5) {
      // 假设控件在底部，从底部裁剪
      actualVideoHeight = rect.height - offsetY - controlBarHeight;
    }

    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      width: rect.width,
      height: rect.height,
      viewportX: rect.left,
      viewportY: rect.top,
      // 视频画面本身的区域（用于精确裁剪）
      videoArea: {
        x: rect.left + offsetX,
        y: rect.top + offsetY,
        width: actualVideoWidth,
        height: actualVideoHeight,
        viewportX: rect.left + offsetX,
        viewportY: rect.top + offsetY
      }
    };
  }

  /**
   * 裁剪截图到视频区域
   * 使用 Canvas API 进行裁剪，只截取视频画面本身（排除控件）
   * @param {string} screenshotDataUrl - 原始截图 Data URL
   * @param {Object} playerInfo - 播放器位置和尺寸
   * @returns {Promise<string>} 裁剪后的 Data URL
   */
  function cropScreenshot(screenshotDataUrl, playerInfo) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = function() {
        try {
          // 计算缩放比例（截图可能与视口尺寸不同）
          const scaleX = img.width / window.innerWidth;
          const scaleY = img.height / window.innerHeight;

          // 使用视频画面区域（如果有），否则使用整个播放器
          const cropArea = playerInfo.videoArea || {
            viewportX: playerInfo.viewportX,
            viewportY: playerInfo.viewportY,
            width: playerInfo.width,
            height: playerInfo.height
          };

          // 创建 canvas
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // 设置 canvas 尺寸为视频画面尺寸
          canvas.width = cropArea.width * scaleX;
          canvas.height = cropArea.height * scaleY;

          // 绘制裁剪区域（只截取视频画面，不包括控件）
          ctx.drawImage(
            img,
            cropArea.viewportX * scaleX,
            cropArea.viewportY * scaleY,
            cropArea.width * scaleX,
            cropArea.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
          );

          // 转换为 Data URL
          const croppedDataUrl = canvas.toDataURL('image/png');
          resolve(croppedDataUrl);

        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = screenshotDataUrl;
    });
  }

  /**
   * 监听来自 popup 和 background 的消息
   */
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'detectPlayers':
        // 检测所有播放器
        const players = detectVideoPlayers();
        sendResponse({ success: true, players: players });
        break;

      case 'scrollToVideo':
        // 滚动到指定视频
        scrollToVideo(request.playerId);
        sendResponse({ success: true });
        break;

      case 'getPlayerPosition':
        // 获取指定播放器的当前位置
        const position = getPlayerPosition(request.playerId);
        sendResponse({ success: true, position: position });
        break;

      case 'cropScreenshot':
        // 裁剪截图（在内容脚本中执行，因为需要使用 DOM API）
        cropScreenshot(request.screenshotDataUrl, request.playerInfo)
          .then(croppedDataUrl => {
            sendResponse({ success: true, croppedDataUrl: croppedDataUrl });
          })
          .catch(error => {
            sendResponse({ success: false, error: error.message });
          });
        break;

      default:
        sendResponse({ success: false, error: '未知操作' });
    }

    // 返回 true 表示会异步发送响应
    return true;
  });

  // 页面加载完成后，向控制台输出提示
  console.log('[视频截图工具] 内容脚本已加载，检测到 ' + document.querySelectorAll('video').length + ' 个视频元素');
})();
