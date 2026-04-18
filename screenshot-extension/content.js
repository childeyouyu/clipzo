(function() {
    'use strict';

    const STYLE_ID = 'video-screenshot-styles';
    const BUTTON_CLASS = 'video-screenshot-btn';

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .${BUTTON_CLASS} {
                position: absolute;
                bottom: 10px;
                right: 10px;
                z-index: 999999;
                background: rgba(0, 0, 0, 0.7);
                border: none;
                border-radius: 4px;
                padding: 8px 12px;
                color: white;
                font-size: 14px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            
            .${BUTTON_CLASS}:hover {
                background: rgba(255, 102, 0, 0.9);
                transform: scale(1.05);
            }
            
            .${BUTTON_CLASS} svg {
                width: 18px;
                height: 18px;
                fill: currentColor;
            }
            
            .${BUTTON_CLASS}.position-top {
                bottom: auto;
                top: 10px;
            }
            
            .${BUTTON_CLASS}.position-right {
                right: 60px;
            }
            
            .video-container {
                position: relative !important;
            }
            
            .video-screenshot-toast {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                z-index: 10000000;
                font-size: 14px;
                animation: screenshotToastFade 2s ease forwards;
            }
            
            @keyframes screenshotToastFade {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
        `;
        document.head.appendChild(style);
    }

    function createScreenshotButton(videoElement) {
        const existingBtn = videoElement.parentElement?.querySelector(`.${BUTTON_CLASS}`);
        if (existingBtn) return existingBtn;

        const btn = document.createElement('button');
        btn.className = BUTTON_CLASS;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            截图
        `;
        
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            captureVideoScreenshot(videoElement);
        });

        return btn;
    }

    function captureVideoScreenshot(videoElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const pageTitle = document.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 30);
            link.download = `截图_${pageTitle}_${timestamp}.png`;
            
            link.click();
            
            URL.revokeObjectURL(url);
            showToast('截图已保存到下载文件夹');
        }, 'image/png');
    }

    function showToast(message) {
        const existingToast = document.querySelector('.video-screenshot-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'video-screenshot-toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 2000);
    }

    function attachButtonToVideo(videoElement) {
        let container = videoElement.parentElement;
        
        if (container && container.classList.contains('video-container')) {
            const existingBtn = container.querySelector(`.${BUTTON_CLASS}`);
            if (!existingBtn) {
                container.appendChild(createScreenshotButton(videoElement));
            }
            return;
        }
        
        while (container && container !== document.body) {
            const computedStyle = window.getComputedStyle(container);
            const position = computedStyle.getPropertyValue('position');
            
            if (position === 'relative' || position === 'absolute' || position === 'fixed') {
                container.classList.add('video-container');
                container.appendChild(createScreenshotButton(videoElement));
                return;
            }
            
            container = container.parentElement;
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'video-container';
        wrapper.style.position = 'relative';
        wrapper.style.display = 'inline-block';
        
        videoElement.parentNode.insertBefore(wrapper, videoElement);
        wrapper.appendChild(videoElement);
        wrapper.appendChild(createScreenshotButton(videoElement));
    }

    function findAndProcessVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (video.readyState >= 2) {
                attachButtonToVideo(video);
            } else {
                video.addEventListener('loadeddata', () => attachButtonToVideo(video));
            }
        });
    }

    function observeNewVideos() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                }
            });
            
            if (shouldCheck) {
                findAndProcessVideos();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        injectStyles();
        findAndProcessVideos();
        observeNewVideos();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();