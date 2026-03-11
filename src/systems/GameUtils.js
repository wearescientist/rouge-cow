/**
 * GameUtils.js - 游戏工具函数
 * 从 Game 类分离的通用工具方法
 */

const GameUtils = {
    /**
     * 随机数生成
     */
    random: {
        range(min, max) {
            return Math.random() * (max - min) + min;
        },
        
        rangeInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        
        choice(arr) {
            return arr[Math.floor(Math.random() * arr.length)];
        },
        
        bool(chance = 0.5) {
            return Math.random() < chance;
        }
    },
    
    /**
     * 数学工具
     */
    math: {
        clamp(val, min, max) {
            return Math.max(min, Math.min(max, val));
        },
        
        lerp(start, end, t) {
            return start + (end - start) * t;
        },
        
        distance(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        },
        
        angle(x1, y1, x2, y2) {
            return Math.atan2(y2 - y1, x2 - x1);
        }
    },
    
    /**
     * 格式化
     */
    format: {
        number(num) {
            if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
            if (num >= 1000) return (num/1000).toFixed(1) + 'K';
            return num.toString();
        },
        
        time(seconds) {
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        }
    },
    
    /**
     * 颜色工具
     */
    color: {
        hexToRgb(hex) {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        rgba(hex, alpha) {
            const rgb = this.hexToRgb(hex);
            return rgb ? `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})` : hex;
        }
    }
};

// 导出到全局
window.GameUtils = GameUtils;
