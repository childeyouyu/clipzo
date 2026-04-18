function switchLanguage(lang) {
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
        console.log('Storage not available');
    }
}

function initLanguage() {
    try {
        chrome.storage.local.get('language', function(result) {
            if (result.language) {
                switchLanguage(result.language);
            } else {
                const browserLang = chrome.i18n.getUILanguage();
                if (browserLang.startsWith('zh')) {
                    switchLanguage('zh');
                } else {
                    switchLanguage('en');
                }
            }
        });
    } catch (e) {
        console.log('Storage not available');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initLanguage();
});