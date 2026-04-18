const translations = {
    'zh': {
        'extension_title': '📸 视频截图工具',
        'extension_subtitle': '快速捕获网页视频精彩画面',
        'feature1_title': '一键截图',
        'feature1_desc': '点击按钮即可保存当前帧',
        'feature2_title': '高清画质',
        'feature2_desc': '保存原始分辨率图片',
        'feature3_title': '智能识别',
        'feature3_desc': '自动检测页面中的视频',
        'usage_title': '使用方法',
        'usage1': '打开包含视频的网页：目前支持哔哩哔哩，YouTube，飞牛影视',
        'usage2': '视频播放器右侧会显示"截图"按钮',
        'usage3': '点击按钮即可保存当前画面到下载文件夹',
        'version': '版本 1.0',
        'app_name': '视频截图工具'
    },
    'en': {
        'extension_title': '📸 Video Screenshot Tool',
        'extension_subtitle': 'Capture stunning moments from web videos',
        'feature1_title': 'One-Click Screenshot',
        'feature1_desc': 'Click to save the current frame',
        'feature2_title': 'High Quality',
        'feature2_desc': 'Saves images in original resolution',
        'feature3_title': 'Smart Detection',
        'feature3_desc': 'Automatically detects videos on page',
        'usage_title': 'How to Use',
        'usage1': 'Open a page with video: Supports Bilibili, YouTube, Feiniu',
        'usage2': 'The Screenshot button appears on the right side of the video',
        'usage3': 'Click the button to save the current frame to download folder',
        'version': 'Version 1.0',
        'app_name': 'Video Screenshot Tool'
    }
};

function switchLanguage(lang) {
    const langCode = lang === 'en' ? 'en' : 'zh_CN';
    const dict = translations[lang] || translations['en'];
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (dict[key]) {
            element.textContent = dict[key];
        }
    });
    
    document.querySelector('html').lang = langCode;
    if (dict.extension_title) {
        document.title = dict.extension_title;
    }
    
    try {
        chrome.storage.local.set({ language: lang });
    } catch (e) {}
}

function initLanguage() {
    try {
        chrome.storage.local.get('language', function(result) {
            let lang = result.language;
            if (!lang) {
                lang = 'en';
            }
            switchLanguage(lang);
        });
    } catch (e) {
        switchLanguage('en');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initLanguage();
});