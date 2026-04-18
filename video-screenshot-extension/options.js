/**
 * 选项页面脚本 - 设置管理模块
 * 
 * 功能说明：
 * 1. 加载当前设置并显示在表单中
 * 2. 处理用户修改设置
 * 3. 保存设置到 chrome.storage.local
 * 4. 提供恢复默认设置功能
 * 
 * 存储的数据结构：
 * {
 *   saveFolder: string,  // 保存文件夹路径（相对下载目录）
 * }
 */

// DOM 元素引用
const elements = {
  saveFolder: document.getElementById('saveFolder'),
  selectFolderBtn: document.getElementById('selectFolderBtn'),
  saveBtn: document.getElementById('saveBtn'),
  resetBtn: document.getElementById('resetBtn'),
  saveResult: document.getElementById('saveResult')
};

/**
 * 默认设置
 */
const DEFAULT_SETTINGS = {
  saveFolder: ''
};

/**
 * 初始化
 */
async function init() {
  // 加载当前设置
  await loadSettings();

  // 绑定事件监听器
  elements.saveBtn.addEventListener('click', saveSettings);
  elements.resetBtn.addEventListener('click', resetSettings);
  elements.selectFolderBtn.addEventListener('click', selectFolder);

  // 输入框回车保存
  elements.saveFolder.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      saveSettings();
    }
  });
}

/**
 * 从存储加载设置
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.local.get(['saveFolder']);
    elements.saveFolder.value = settings.saveFolder || '';
  } catch (error) {
    console.error('[视频截图工具] 加载设置失败:', error);
    showResult('加载设置失败: ' + error.message, 'error');
  }
}

/**
 * 保存设置到存储
 */
async function saveSettings() {
  try {
    const settings = {
      saveFolder: elements.saveFolder.value.trim()
    };

    // 验证设置
    if (settings.saveFolder) {
      // 移除开头的斜杠
      settings.saveFolder = settings.saveFolder.replace(/^[\\/]+/, '');
      // 移除非法字符
      settings.saveFolder = settings.saveFolder.replace(/[<>:"|?*]/g, '_');
    }

    // 保存到存储
    await chrome.storage.local.set(settings);

    // 更新显示
    elements.saveFolder.value = settings.saveFolder;
    
    showResult('✅ 设置已保存', 'success');

  } catch (error) {
    console.error('[视频截图工具] 保存设置失败:', error);
    showResult('❌ 保存失败: ' + error.message, 'error');
  }
}

/**
 * 恢复默认设置
 */
async function resetSettings() {
  try {
    if (!confirm('确定要恢复默认设置吗？')) {
      return;
    }

    // 保存默认设置
    await chrome.storage.local.set(DEFAULT_SETTINGS);

    // 更新表单
    elements.saveFolder.value = DEFAULT_SETTINGS.saveFolder;

    showResult('✅ 已恢复默认设置', 'success');

  } catch (error) {
    console.error('[视频截图工具] 恢复默认设置失败:', error);
    showResult('❌ 恢复失败: ' + error.message, 'error');
  }
}

/**
 * 选择文件夹（模拟，实际通过输入）
 * 由于浏览器限制，无法直接打开系统文件夹选择器
 * 此方法打开 Chrome 的下载设置页面
 */
function selectFolder() {
  // 由于无法直接选择文件夹，我们提示用户手动输入
  const message = `
由于浏览器安全限制，无法直接浏览文件夹。

请手动输入相对于下载文件夹的路径，例如：
• VideoScreenshots
• Screenshots/Videos
• 视频截图/2024

如果不设置，截图将保存到默认下载文件夹。`;

  alert(message);
  elements.saveFolder.focus();
}

/**
 * 显示保存结果
 * @param {string} message - 消息内容
 * @param {string} type - 类型 ('success' | 'error')
 */
function showResult(message, type) {
  elements.saveResult.textContent = message;
  elements.saveResult.className = 'save-result ' + type;
  elements.saveResult.style.display = 'block';

  // 3秒后自动隐藏
  setTimeout(() => {
    elements.saveResult.style.display = 'none';
  }, 3000);
}

// 启动初始化
document.addEventListener('DOMContentLoaded', init);
