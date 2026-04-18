window.switchLanguage = function(lang) {
    console.log('switchLanguage called with:', lang);
    const langCode = lang === 'en' ? 'en' : 'zh_CN';
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.lang === lang) {
            btn.classList.add('active');
        }
    });
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        const message = chrome.i18n.getMessage(key);
        console.log('i18n key:', key, 'message:', message);
        if (message) {
            element.textContent = message;
        }
    });
    
    document.querySelector('html').lang = langCode;
    const title = chrome.i18n.getMessage('extension_title');
    if (title) {
        document.title = title;
    }
    
    try {
        chrome.storage.local.set({ language: lang });
    } catch (e) {
        console.log('Storage not available:', e);
    }
};

function initLanguage() {
    try {
        chrome.storage.local.get('language', function(result) {
            let lang;
            if (result.language) {
                lang = result.language;
            } else {
                const browserLang = chrome.i18n.getUILanguage();
                console.log('Browser language:', browserLang);
                if (browserLang.startsWith('zh')) {
                    lang = 'zh';
                } else {
                    lang = 'en';
                }
            }
            console.log('Initial language:', lang);
            switchLanguage(lang);
        });
    } catch (e) {
        console.log('Storage not available:', e);
    }
}

function initEventListeners() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const lang = this.dataset.lang;
            switchLanguage(lang);
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Popup loaded');
    initEventListeners();
    initLanguage();
});