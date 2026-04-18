(function() {
    'use strict';

    const STYLE_ID = 'video-screenshot-styles';
    const BUTTON_CLASS = 'video-screenshot-btn';
    const PROCESSED_PLAYERS = new WeakSet();

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;
        
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .${BUTTON_CLASS} {
                position: absolute;
                top: 50%;
                right: 10px;
                transform: translateY(-50%);
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
                transform: translateY(-50%) scale(1.05);
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

    function createScreenshotButton() {
        const btn = document.createElement('button');
        btn.className = BUTTON_CLASS;
        btn.innerHTML = `
            <svg viewBox="0 0 24 24">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
            截图
        `;
        
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

    function captureCanvasScreenshot(canvasElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = canvasElement.width;
        canvas.height = canvasElement.height;
        
        ctx.drawImage(canvasElement, 0, 0);
        
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

    function findVideoElement(container) {
        const video = container.querySelector('video');
        if (video && video.readyState >= 2) {
            return video;
        }
        
        const canvas = container.querySelector('canvas');
        if (canvas) {
            return { type: 'canvas', element: canvas };
        }
        
        return null;
    }

    function attachButtonToStandardVideo(videoElement) {
        let container = videoElement.parentElement;
        
        if (container && container.classList.contains('video-container')) {
            const existingBtn = container.querySelector(`.${BUTTON_CLASS}`);
            if (!existingBtn) {
                const btn = createScreenshotButton();
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    captureVideoScreenshot(videoElement);
                });
                container.appendChild(btn);
            }
            return;
        }
        
        while (container && container !== document.body) {
            const computedStyle = window.getComputedStyle(container);
            const position = computedStyle.getPropertyValue('position');
            
            if (position === 'relative' || position === 'absolute' || position === 'fixed') {
                container.classList.add('video-container');
                const btn = createScreenshotButton();
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    captureVideoScreenshot(videoElement);
                });
                container.appendChild(btn);
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
        const btn = createScreenshotButton();
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            captureVideoScreenshot(videoElement);
        });
        wrapper.appendChild(btn);
    }

    function attachButtonToXgPlayer(playerContainer) {
        if (PROCESSED_PLAYERS.has(playerContainer)) {
            return;
        }
        PROCESSED_PLAYERS.add(playerContainer);
        
        const existingBtn = playerContainer.querySelector(`.${BUTTON_CLASS}`);
        if (existingBtn) return;
        
        const videoElement = playerContainer.querySelector('video');
        const canvasElement = playerContainer.querySelector('canvas');
        
        const btn = createScreenshotButton();
        
        if (videoElement && videoElement.readyState >= 2) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                captureVideoScreenshot(videoElement);
            });
        } else if (canvasElement) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                captureCanvasScreenshot(canvasElement);
            });
        } else {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const video = playerContainer.querySelector('video');
                const canvas = playerContainer.querySelector('canvas');
                if (video) {
                    captureVideoScreenshot(video);
                } else if (canvas) {
                    captureCanvasScreenshot(canvas);
                } else {
                    showToast('无法捕获视频画面');
                }
            });
        }
        
        playerContainer.style.position = 'relative';
        playerContainer.appendChild(btn);
    }

    function findAndProcessStandardVideos() {
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
            if (video.readyState >= 2) {
                if (!PROCESSED_PLAYERS.has(video)) {
                    PROCESSED_PLAYERS.add(video);
                    attachButtonToStandardVideo(video);
                }
            } else {
                video.addEventListener('loadeddata', () => {
                    if (!PROCESSED_PLAYERS.has(video)) {
                        PROCESSED_PLAYERS.add(video);
                        attachButtonToStandardVideo(video);
                    }
                });
            }
        });
    }

    function findAndProcessXgPlayers() {
        const xgPlayers = document.querySelectorAll('.xgplayer, [class*="xgplayer"], .xg-player');
        xgPlayers.forEach(player => {
            if (player.querySelector('video') || player.querySelector('canvas')) {
                attachButtonToXgPlayer(player);
            }
        });
    }

    function findAndProcessYouTubePlayers() {
        const players = document.querySelectorAll('.html5-video-player');
        players.forEach(player => {
            const existingBtn = player.querySelector(`.${BUTTON_CLASS}`);
            if (existingBtn) return;
            
            const videoElement = player.querySelector('video');
            if (!videoElement) return;
            
            if (PROCESSED_PLAYERS.has(videoElement)) return;
            PROCESSED_PLAYERS.add(videoElement);
            
            const btn = createScreenshotButton();
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (videoElement && videoElement.readyState >= 2) {
                    captureVideoScreenshot(videoElement);
                } else {
                    showToast('视频未准备好');
                }
            });
            
            player.style.position = 'relative';
            player.appendChild(btn);
        });
    }

    function findAndProcessAll() {
        findAndProcessStandardVideos();
        findAndProcessXgPlayers();
        findAndProcessYouTubePlayers();
    }

    function observeNewElements() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length > 0) {
                    shouldCheck = true;
                }
            });
            
            if (shouldCheck) {
                setTimeout(findAndProcessAll, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function init() {
        injectStyles();
        
        findAndProcessAll();
        observeNewElements();
        
        setTimeout(findAndProcessAll, 1000);
        setTimeout(findAndProcessAll, 2000);
        setTimeout(findAndProcessAll, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();