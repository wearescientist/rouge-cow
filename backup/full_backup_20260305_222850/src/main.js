/**
 * main.js - 游戏入口文件
 * 模块加载和游戏初始化
 * v0.22.1 - Phase 2 重构
 */

(function() {
    'use strict';

    // 游戏版本
    const VERSION = '0.22.1';
    
    // 加载状态
    const loadState = {
        phase: 'initializing',
        progress: 0,
        modulesLoaded: 0,
        modulesTotal: 0,
        errors: []
    };

    /**
     * 初始化加载
     */
    async function init() {
        console.log(`[RogueCow] 初始化 v${VERSION}...`);
        
        updateLoadingStatus('loading-core', 0);
        
        try {
            // 加载核心模块
            await loadCoreModules();
            updateLoadingStatus('core-loaded', 30);
            
            // 加载数据模块
            await loadDataModules();
            updateLoadingStatus('data-loaded', 50);
            
            // 加载系统模块
            await loadSystemModules();
            updateLoadingStatus('systems-loaded', 70);
            
            // 初始化游戏
            await initializeGame();
            updateLoadingStatus('complete', 100);
            
            console.log('[RogueCow] 初始化完成');
            
        } catch (e) {
            console.error('[RogueCow] 初始化失败:', e);
            handleInitError(e);
        }
    }

    /**
     * 加载核心模块
     */
    async function loadCoreModules() {
        const modules = [
            'utils/EventManager.js',
            'utils/Logger.js',
            'core/Entity.js',
            'core/StateManager.js',
            'core/AssetManager.js',
            'core/PerformanceMonitor.js'
        ];
        
        loadState.modulesTotal += modules.length;
        
        for (const mod of modules) {
            try {
                await moduleLoader.load(mod);
                loadState.modulesLoaded++;
                updateProgress();
            } catch (e) {
                loadState.errors.push({ module: mod, error: e.message });
                throw e;
            }
        }
    }

    /**
     * 加载数据模块
     */
    async function loadDataModules() {
        const modules = [
            'data/balance_config.js',
            'data/enemyCodex.js',
            'data/totemData.js'
        ];
        
        loadState.modulesTotal += modules.length;
        
        for (const mod of modules) {
            try {
                await moduleLoader.load(mod);
                loadState.modulesLoaded++;
                updateProgress();
            } catch (e) {
                console.warn(`[RogueCow] 可选模块加载失败: ${mod}`);
                loadState.modulesLoaded++;
                updateProgress();
            }
        }
    }

    /**
     * 加载系统模块
     */
    async function loadSystemModules() {
        const modules = [
            'systems/save_manager.js',
            'systems/stats_achievements.js'
        ];
        
        loadState.modulesTotal += modules.length;
        
        for (const mod of modules) {
            try {
                await moduleLoader.load(mod);
                loadState.modulesLoaded++;
                updateProgress();
            } catch (e) {
                console.warn(`[RogueCow] 可选模块加载失败: ${mod}`);
                loadState.modulesLoaded++;
                updateProgress();
            }
        }
    }

    /**
     * 初始化游戏
     */
    async function initializeGame() {
        // 检查游戏类是否存在
        if (typeof Game === 'undefined') {
            console.warn('[RogueCow] Game类未通过模块加载，使用内联代码');
            return;
        }
        
        // 初始化性能监控
        if (window.perfMonitor) {
            perfMonitor.initDisplay('perfCanvas');
        }
        
        // 初始化日志
        if (window.logger) {
            // 根据环境设置日志级别
            const isDev = location.hostname === 'localhost' || location.search.includes('debug=1');
            logger.setLevel(isDev ? LogLevel.DEBUG : LogLevel.WARN);
        }
        
        // 初始化状态管理
        if (window.stateManager) {
            // 加载保存的状态
            stateManager.load('roguecow', true);
        }
    }

    /**
     * 更新加载进度
     */
    function updateProgress() {
        if (loadState.modulesTotal > 0) {
            loadState.progress = Math.floor(
                (loadState.modulesLoaded / loadState.modulesTotal) * 100
            );
        }
    }

    /**
     * 更新加载状态显示
     */
    function updateLoadingStatus(phase, progress) {
        loadState.phase = phase;
        loadState.progress = progress;
        
        // 触发自定义事件
        window.dispatchEvent(new CustomEvent('gameLoading', {
            detail: { phase, progress, state: loadState }
        }));
    }

    /**
     * 处理初始化错误
     */
    function handleInitError(error) {
        loadState.phase = 'error';
        
        // 显示错误信息
        const loadingTip = document.getElementById('loadingTip');
        if (loadingTip) {
            loadingTip.textContent = `加载失败: ${error.message}`;
            loadingTip.style.color = '#f44';
        }
        
        // 触发错误事件
        window.dispatchEvent(new CustomEvent('gameLoadError', {
            detail: { error, state: loadState }
        }));
    }

    /**
     * 暴露全局API
     */
    window.RogueCow = {
        version: VERSION,
        loadState: loadState,
        init: init,
        
        // 工具方法
        getLoadProgress() {
            return loadState.progress;
        },
        
        getLoadErrors() {
            return [...loadState.errors];
        },
        
        isReady() {
            return loadState.phase === 'complete';
        }
    };

    // 自动初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
