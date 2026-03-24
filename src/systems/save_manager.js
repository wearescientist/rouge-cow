/**
 * 存档管理系统 - v0.14.0
 * 第4轮迭代：存档系统优化
 * 
 * 功能：
 * 1. 多存档槽位
 * 2. 自动备份
 * 3. 存档压缩
 * 4. 云存档接口
 * 5. 存档迁移
 */

class SaveManager {
    constructor() {
        this.prefix = 'rougecow_';
        this.maxSlots = 5;
        this.autoSaveInterval = 60000; // 60秒
        this.lastAutoSave = 0;
        this.currentSlot = 1;
        
        // 存档版本（用于迁移）
        this.version = window.AppVersion?.saveVersion || window.AppVersion?.number || '0.35.0';
    }
    
    // ========== 基础存档操作 ==========
    
    save(slot = this.currentSlot, data) {
        try {
            const key = `${this.prefix}save_${slot}`;
            const metaKey = `${this.prefix}meta_${slot}`;
            
            // 添加元数据
            const saveData = {
                version: this.version,
                timestamp: Date.now(),
                playTime: data.playTime || 0,
                floor: data.currentFloor || 1,
                data: this.compress(data)
            };
            
            // 创建备份（如果存档已存在）
            if (localStorage.getItem(key)) {
                this.createBackup(slot);
            }
            
            // 保存
            localStorage.setItem(key, JSON.stringify(saveData));
            
            // 更新元数据
            const meta = {
                slot,
                timestamp: saveData.timestamp,
                floor: saveData.floor,
                playTime: this.formatPlayTime(saveData.playTime),
                version: this.version
            };
            localStorage.setItem(metaKey, JSON.stringify(meta));
            
            console.log(`💾 存档 ${slot} 已保存`);
            return true;
        } catch (e) {
            console.error('存档失败:', e);
            return false;
        }
    }
    
    load(slot = this.currentSlot) {
        try {
            const key = `${this.prefix}save_${slot}`;
            const saveJson = localStorage.getItem(key);
            
            if (!saveJson) {
                console.log(`存档 ${slot} 不存在`);
                return null;
            }
            
            const saveData = JSON.parse(saveJson);
            
            // 版本检查与迁移
            if ((saveData.version || saveData.saveVersion) !== this.version) {
                return this.migrate(saveData);
            }
            
            return this.normalizeData(this.decompress(saveData.data));
        } catch (e) {
            console.error('读档失败:', e);
            return null;
        }
    }
    
    delete(slot) {
        try {
            const key = `${this.prefix}save_${slot}`;
            const metaKey = `${this.prefix}meta_${slot}`;
            
            localStorage.removeItem(key);
            localStorage.removeItem(metaKey);
            
            console.log(`🗑️ 存档 ${slot} 已删除`);
            return true;
        } catch (e) {
            console.error('删除存档失败:', e);
            return false;
        }
    }
    
    // ========== 存档列表 ==========
    
    getSaveList() {
        const list = [];
        
        for (let slot = 1; slot <= this.maxSlots; slot++) {
            const metaKey = `${this.prefix}meta_${slot}`;
            const metaJson = localStorage.getItem(metaKey);
            
            if (metaJson) {
                list.push(JSON.parse(metaJson));
            } else {
                list.push({
                    slot,
                    empty: true,
                    timestamp: null,
                    floor: null,
                    playTime: null
                });
            }
        }
        
        return list;
    }
    
    // ========== 自动存档 ==========
    
    enableAutoSave(game, interval = this.autoSaveInterval) {
        this.autoSaveInterval = interval;
        
        // 清理旧的定时器
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        
        this.autoSaveTimer = setInterval(() => {
            if (game.state === 'playing' && game.player) {
                const data = this.extractGameData(game);
                this.save(this.currentSlot, data);
                console.log('💾 自动存档完成');
            }
        }, interval);
        
        console.log(`✅ 自动存档已启用 (${interval/1000}秒间隔)`);
    }
    
    disableAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('⏹️ 自动存档已禁用');
        }
    }
    
    // ========== 备份系统 ==========
    
    createBackup(slot) {
        try {
            const key = `${this.prefix}save_${slot}`;
            const backupKey = `${this.prefix}backup_${slot}_${Date.now()}`;
            
            const data = localStorage.getItem(key);
            if (data) {
                localStorage.setItem(backupKey, data);
                this.cleanOldBackups(slot);
            }
        } catch (e) {
            console.warn('创建备份失败:', e);
        }
    }
    
    cleanOldBackups(slot, keepCount = 3) {
        const backups = [];
        const prefix = `${this.prefix}backup_${slot}_`;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                const timestamp = parseInt(key.split('_').pop());
                backups.push({ key, timestamp });
            }
        }
        
        // 按时间排序，删除旧的
        backups.sort((a, b) => b.timestamp - a.timestamp);
        
        for (let i = keepCount; i < backups.length; i++) {
            localStorage.removeItem(backups[i].key);
        }
    }
    
    restoreBackup(slot, backupIndex = 0) {
        const prefix = `${this.prefix}backup_${slot}_`;
        const backups = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                backups.push(key);
            }
        }
        
        backups.sort().reverse();
        
        if (backupIndex < backups.length) {
            const backupData = localStorage.getItem(backups[backupIndex]);
            const saveKey = `${this.prefix}save_${slot}`;
            localStorage.setItem(saveKey, backupData);
            return true;
        }
        
        return false;
    }
    
    // ========== 存档压缩 ==========
    
    compress(data) {
        // 简单的压缩：删除默认值，缩短键名
        const compressed = {};
        
        for (const [key, value] of Object.entries(data)) {
            if (value !== null && value !== undefined) {
                compressed[key] = value;
            }
        }
        
        return compressed;
    }
    
    decompress(data) {
        return this.normalizeData(data);
    }

    normalizeData(data = {}) {
        return {
            player: {
                hp: data.player?.hp ?? data.playerHp ?? 100,
                maxHp: data.player?.maxHp ?? data.playerMaxHp ?? 100,
                exp: data.player?.exp ?? 0,
                lv: data.player?.lv ?? data.player?.level ?? 1,
                gold: data.player?.gold ?? data.gold ?? 0
            },
            items: data.items || {},
            weapons: Array.isArray(data.weapons) ? data.weapons : [],
            currentFloor: data.currentFloor || data.floor || 1,
            currentRoom: data.currentRoom ?? null,
            playTime: data.playTime || 0,
            score: data.score || 0,
            totems: Array.isArray(data.totems) ? data.totems : [],
            hiddenRooms: data.hiddenRooms || null
        };
    }

    // ========== 版本迁移 ==========
    
    migrate(saveData) {
        console.log(`🔄 迁移存档: ${saveData.version} -> ${this.version}`);
        
        // 根据版本进行迁移
        const migrations = {
            '0.13.0': (data) => {
                // v0.13.0 -> v0.14.0 的迁移
                data.items = data.items || {};
                data.totems = data.totems || [];
                return data;
            },
            '0.12.0': (data) => {
                // 先迁移到 0.13.0，再到 0.14.0
                data = migrations['0.13.0'](data);
                return data;
            }
        };
        
        let data = this.decompress(saveData.data);
        const fromVersion = saveData.version || saveData.saveVersion || '0.12.0';
        
        if (migrations[fromVersion]) {
            data = migrations[fromVersion](data);
        }
        
        return data;
    }
    
    // ========== 云存档接口 ==========
    
    exportToJSON(slot = this.currentSlot) {
        const data = this.load(slot);
        if (!data) return null;
        
        return JSON.stringify({
            version: this.version,
            exportedAt: Date.now(),
            data
        }, null, 2);
    }
    
    importFromJSON(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            
            if (!imported.data) {
                throw new Error('无效的存档格式');
            }
            
            // 找到空槽位
            const emptySlot = this.getSaveList().find(s => s.empty);
            if (!emptySlot) {
                throw new Error('没有空存档槽位');
            }
            
            this.save(emptySlot.slot, imported.data);
            return emptySlot.slot;
        } catch (e) {
            console.error('导入失败:', e);
            return null;
        }
    }
    
    // ========== 工具方法 ==========
    
    extractGameData(game) {
        return {
            player: {
                hp: game.player.hp,
                maxHp: game.player.maxHp,
                exp: game.player.exp,
                lv: game.player.lv,
                gold: game.player.gold
            },
            items: game.items ? game.items.owned : {},
            weapons: game.weapons ? game.weapons.map(w => ({
                key: w.baseKey,
                level: w.level,
                evolution: w.evolution
            })) : [],
            currentFloor: game.currentFloor || 1,
            currentRoom: game.curRoom ? game.curRoom.id : null,
            playTime: game.playTime || 0,
            score: game.scoreManager ? game.scoreManager.score : 0,
            totems: game.totems ? Array.from(game.totems.collected) : [],
            hiddenRooms: game.hiddenRooms ? JSON.parse(JSON.stringify(game.hiddenRooms)) : null
        };
    }
    
    formatPlayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}小时${mins}分`;
        }
        return `${mins}分钟`;
    }
    
    // ========== 存储管理 ==========
    
    getStorageInfo() {
        let used = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            used += key.length + value.length;
        }
        
        // localStorage 通常限制 5-10MB
        const limit = 5 * 1024 * 1024; // 5MB
        
        return {
            used: used,
            limit: limit,
            usedMB: (used / 1024 / 1024).toFixed(2),
            limitMB: (limit / 1024 / 1024).toFixed(2),
            percentage: (used / limit * 100).toFixed(1)
        };
    }
    
    clearAllData() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log('🗑️ 所有存档数据已清除');
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveManager };
}
