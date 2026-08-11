/**
 * CURSOR DUKOPS - SIAP PAKAI
 * Auto Detect Desktop & Android
 */

(function() {
    'use strict';
    
    // ========== DETEKSI ==========
    const isTouch = 'ontouchstart' in window || 
                    navigator.maxTouchPoints > 0 ||
                    window.matchMedia('(hover: none)').matches;
    
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isDesktop = !isTouch && !isAndroid;
    
    // ========== LOAD CURSOR (DESKTOP) ==========
    function loadCursors() {
        if (!isDesktop) return;
        
        const style = document.createElement('style');
        style.id = 'cursor-style';
        style.textContent = `
            :root {
                --cursor-path: '../cursors/';
                --cursor-default: url('../cursors/cursor1.cur'), auto;
                --cursor-pointer: url('../cursors/cursor2.cur'), pointer;
                --cursor-text: url('../cursors/cursor7.cur'), text;
                --cursor-wait: url('../cursors/cursor3.ani'), wait;
                --cursor-progress: url('../cursors/cursor4.ani'), progress;
                --cursor-help: url('../cursors/cursor8.cur'), help;
                --cursor-grab: url('../cursors/cursor5.ani'), grab;
                --cursor-grabbing: url('../cursors/cursor6.ani'), grabbing;
                --cursor-not-allowed: url('../cursors/cursor10.cur'), not-allowed;
                --cursor-zoom-in: url('../cursors/cursor9.ani'), zoom-in;
            }
        `;
        document.head.appendChild(style);
    }
    
    // ========== TOUCH FEEDBACK (ANDROID) ==========
    function enableTouchFeedback() {
        if (!isTouch && !isAndroid) return;
        
        document.documentElement.classList.add('touch-device');
        
        // Ripple effect
        document.querySelectorAll('button, .btn, [onclick], .nav-btn, .tab').forEach(el => {
            el.classList.add('ripple');
        });
        
        // Haptic vibrate untuk Android
        if (isAndroid && navigator.vibrate) {
            document.addEventListener('touchstart', function(e) {
                const target = e.target.closest('button, .btn, [onclick], a');
                if (target) {
                    navigator.vibrate(10);
                }
            }, { passive: true });
        }
    }
    
    // ========== FUNGSI GLOBAL ==========
    window.setCursor = function(element, type) {
        if (!isDesktop) return;
        
        const cursors = {
            'default': 'cursor1.cur',
            'pointer': 'cursor2.cur',
            'text': 'cursor7.cur',
            'wait': 'cursor3.ani',
            'progress': 'cursor4.ani',
            'help': 'cursor8.cur',
            'grab': 'cursor5.ani',
            'grabbing': 'cursor6.ani',
            'not-allowed': 'cursor10.cur',
            'zoom-in': 'cursor9.ani'
        };
        
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el && cursors[type]) {
            el.style.cursor = `url('../cursors/${cursors[type]}'), ${type}`;
        }
    };
    
    window.resetCursor = function(element) {
        if (!isDesktop) return;
        const el = typeof element === 'string' ? document.querySelector(element) : element;
        if (el) {
            el.style.cursor = '';
        }
    };
    
    window.showLoading = function() {
        if (isDesktop) document.body.style.cursor = 'wait';
        document.body.classList.add('loading');
    };
    
    window.hideLoading = function() {
        if (isDesktop) document.body.style.cursor = '';
        document.body.classList.remove('loading');
    };
    
    // ========== INISIALISASI ==========
    function init() {
        loadCursors();
        enableTouchFeedback();
        
        // Export status
        window.isTouchDevice = isTouch;
        window.isAndroidDevice = isAndroid;
        window.isDesktopDevice = isDesktop;
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();