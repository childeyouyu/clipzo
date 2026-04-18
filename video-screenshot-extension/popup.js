/**
 * Popup 脚本 - 用户界面交互模块
 * 
 * 功能说明：
 * 1. 扫描当前页面的视频播放器
 * 2. 显示检测到的播放器列表
 * 3. 处理用户点击截图请求
 * 4. 与 content.js 和 background.js 通信
 * 
 * 事件流程：
 * 1. 用户点击"扫描"按钮
 * 2. 发送消息给 content.js 获取播放器列表
 * 3. 在 popup 中显示播放器列表
 * 4. 用户点击某个播放器
 * 5. 发送消息给 background.js 执行截图
 * 6. 显示截图结果
 */

// DOM 元素引用
const elements = {
  scanBtn: document.getElementById('scanBtn'),
  scanStatus: document.getElementById('scanStatus'),
  playersSection: document.getElementById('playersSection'),
  playersList: document.getElementById('playersList'),
  emptyState: document.getElementById('emptyState'),
  loadingState: document.getElementById('loadingState'),
  resultMessage: document.getElementById('resultMessage'),
  settingsBtn: document.getElementById('settingsBtn'),
  helpBtn: document.getElementById('helpBtn')
};

/**
 * 初始化
 */
function init() {
  // 绑定事件监听器
  elements.scanBtn.addEventListener('click', handleScan);
  elements.settingsBtn.addEventListener('click', openSettings);
  elements.helpBtn.addEventListener('click', openHelp);

  // 页面加载时自动扫描一次
  setTimeout(handleScan, 100);
}

/**
 * 处理扫描按钮点击
 */
async function handleScan() {
  try {
    setLoading(true);
    elements.scanStatus.textContent = '正在扫描...';
    elements.resultMessage.style.display = 'none';

    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showError('无法获取当前标签页');
      return;
    }

    // 检查是否是特殊页面
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      showEmptyState();
      elements.scanStatus.textContent = '此页面不支持视频检测';
      return;
    }

    // 向内容脚本发送检测请求
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectPlayers' });

    if (response && response.success) {
      displayPlayers(response.players);
    } else {
      showEmptyState();
      elements.scanStatus.textContent = '扫描失败，请刷新页面后重试';
    }

  } catch (error) {
    console.error('[视频截图工具] 扫描失败:', error);
    showEmptyState();
    
    // 判断错误类型
    if (error.message.includes('Could not establish connection')) {
      elements.scanStatus.textContent = '请刷新页面后再试';
    } else {
      elements.scanStatus.textContent = '扫描出错: ' + error.message;
    }
  } finally {
    setLoading(false);
  }
}

/**
 * 显示播放器列表
 * @param {Array} players - 播放器信息数组
 */
function displayPlayers(players) {
  if (!players || players.length === 0) {
    showEmptyState();
    elements.scanStatus.textContent = '未检测到视频播放器';
    return;
  }

  // 清空列表
  elements.playersList.innerHTML = '';

  // 创建播放器列表项
  players.forEach((player, index) => {
    const playerItem = createPlayerItem(player, index);
    elements.playersList.appendChild(playerItem);
  });

  // 显示列表区域
  elements.playersSection.style.display = 'block';
  elements.emptyState.style.display = 'none';
  elements.scanStatus.textContent = `检测到 ${players.length} 个播放器`;
}

/**
 * 创建播放器列表项元素
 * @param {Object} player - 播放器信息
 * @param {number} index - 索引
 * @returns {HTMLElement} 列表项元素
 */
function createPlayerItem(player, index) {
  const li = document.createElement('li');
  li.className = 'player-item';
  li.dataset.playerId = player.id;

  // 格式化时长显示
  const durationText = player.duration 
    ? formatTime(player.duration) 
    : '未知时长';
  const currentTimeText = formatTime(player.currentTime || 0);

  // 构建 HTML
  li.innerHTML = `
    <div class="player-thumbnail">🎬</div>
    <div class="player-info">
      <div class="player-title" title="${escapeHtml(player.title)}">${escapeHtml(player.title)}</div>
      <div class="player-meta">
        ${player.paused ? '⏸️ 暂停中' : '▶️ 播放中'} • 
        ${currentTimeText} / ${durationText} • 
        ${Math.round(player.width)}×${Math.round(player.height)}
      </div>
    </div>
    <div class="player-action">📷</div>
  `;

  // 绑定点击事件
  li.addEventListener('click', () => handlePlayerClick(player));

  return li;
}

/**
 * 处理播放器点击（执行截图）
 * @param {Object} player - 播放器信息
 */
async function handlePlayerClick(player) {
  try {
    // 显示加载状态
    elements.loadingState.style.display = 'block';
    elements.playersSection.style.display = 'none';
    elements.resultMessage.style.display = 'none';

    // 向后台脚本发送截图请求
    const response = await chrome.runtime.sendMessage({
      action: 'captureScreenshot',
      playerId: player.id,
      title: player.title
    });

    // 恢复显示
    elements.loadingState.style.display = 'none';
    elements.playersSection.style.display = 'block';

    if (response && response.success) {
      showResult(`✅ 截图已保存: ${response.filename}`, 'success');
    } else {
      showResult(`❌ 截图失败: ${response.error || '未知错误'}`, 'error');
    }

  } catch (error) {
    console.error('[视频截图工具] 截图失败:', error);
    elements.loadingState.style.display = 'none';
    elements.playersSection.style.display = 'block';
    showResult(`❌ 截图出错: ${error.message}`, 'error');
  }
}

/**
 * 显示空状态
 */
function showEmptyState() {
  elements.playersSection.style.display = 'none';
  elements.emptyState.style.display = 'block';
}

/**
 * 显示结果消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型 ('success' | 'error')
 */
function showResult(message, type) {
  elements.resultMessage.textContent = message;
  elements.resultMessage.className = 'result-message ' + type;
  elements.resultMessage.style.display = 'block';

  // 3秒后自动隐藏
  setTimeout(() => {
    elements.resultMessage.style.display = 'none';
  }, 5000);
}

/**
 * 显示错误信息
 * @param {string} message - 错误信息
 */
function showError(message) {
  elements.scanStatus.textContent = message;
  elements.scanStatus.style.color = '#ef4444';
}

/**
 * 设置加载状态
 * @param {boolean} loading - 是否加载中
 */
function setLoading(loading) {
  elements.scanBtn.disabled = loading;
  elements.scanBtn.style.opacity = loading ? '0.6' : '1';
}

/**
 * 格式化时间（秒 -> MM:SS）
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * HTML 转义，防止 XSS
 * @param {string} text - 原始文本
 * @returns {string} 转义后的文本
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 打开设置页面
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
}

/**
 * 打开帮助页面
 */
function openHelp() {
  const helpUrl = chrome.runtime.getURL('README.md');
  chrome.tabs.create({ url: helpUrl });
}

// 启动初始化
document.addEventListener('DOMContentLoaded', init);
