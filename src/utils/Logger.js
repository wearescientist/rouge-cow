/**
 * Logger - 日志管理工具
 * 生产环境自动禁用 debug 日志，支持日志级别控制
 * v0.22.1 - Phase 1 修复
 */

const LogLevel = {
    NONE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4
};

class Logger {
    constructor() {
        // 生产环境默认只显示 error，开发环境显示 debug
        this.level = this._detectDevMode() ? LogLevel.DEBUG : LogLevel.ERROR;
        this.prefix = '[RogueCow]';
    }

    /**
     * 检测是否为开发模式
     */
    _detectDevMode() {
        // 本地开发检测
        const isLocalhost = location.hostname === 'localhost' || 
                           location.hostname === '127.0.01';
        const hasDevFlag = location.search.includes('debug=1');
        return isLocalhost || hasDevFlag;
    }

    /**
     * 设置日志级别
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * 调试日志（开发环境）
     */
    debug(...args) {
        if (this.level >= LogLevel.DEBUG) {
            console.log(this.prefix, '[DEBUG]', ...args);
        }
    }

    /**
     * 信息日志
     */
    info(...args) {
        if (this.level >= LogLevel.INFO) {
            console.info(this.prefix, '[INFO]', ...args);
        }
    }

    /**
     * 警告日志
     */
    warn(...args) {
        if (this.level >= LogLevel.WARN) {
            console.warn(this.prefix, '[WARN]', ...args);
        }
    }

    /**
     * 错误日志（始终显示）
     */
    error(...args) {
        if (this.level >= LogLevel.ERROR) {
            console.error(this.prefix, '[ERROR]', ...args);
        }
    }

    /**
     * 分组日志
     */
    group(label) {
        if (this.level >= LogLevel.DEBUG) {
            console.group(this.prefix, label);
        }
    }

    groupEnd() {
        if (this.level >= LogLevel.DEBUG) {
            console.groupEnd();
        }
    }

    /**
     * 性能计时
     */
    time(label) {
        if (this.level >= LogLevel.DEBUG) {
            console.time(`${this.prefix} ${label}`);
        }
    }

    timeEnd(label) {
        if (this.level >= LogLevel.DEBUG) {
            console.timeEnd(`${this.prefix} ${label}`);
        }
    }

    /**
     * 表格输出
     */
    table(data) {
        if (this.level >= LogLevel.DEBUG) {
            console.table(data);
        }
    }
}

// 全局单例
window.Logger = Logger;
window.LogLevel = LogLevel;
window.logger = new Logger();

/**
 * 快速替换 console.log 的辅助函数
 * 将现有代码中的 console.log 替换为 log.debug
 */
function patchGlobalConsole() {
    // 保存原始方法
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    
    // 重写 console 方法
    console.log = (...args) => logger.debug(...args);
    console.info = (...args) => logger.info(...args);
    console.warn = (...args) => logger.warn(...args);
    
    // error 保持原样（重要错误需要显示）
    
    return {
        restore: () => {
            console.log = originalLog;
            console.info = originalInfo;
            console.warn = originalWarn;
        }
    };
}

window.patchGlobalConsole = patchGlobalConsole;
