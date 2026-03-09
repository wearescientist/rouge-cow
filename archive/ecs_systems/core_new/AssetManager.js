/**
 * AssetManager - 资源管理器
 * 统一加载和管理游戏资源（图片、音频、数据）
 */

class AssetManager {
    constructor() {
        // 资源缓存
        this.images = new Map();
        this.audio = new Map();
        this.data = new Map();
        
        // 加载状态
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.failedAssets = 0;
        
        // 基础路径
        this.basePath = this.detectBasePath();
        
        // 版本号（用于缓存刷新）
        this.version = 'v024';
    }
    
    /**
     * 检测基础路径（本地或远程）
     */
    detectBasePath() {
        const isLocal = location.hostname === 'localhost' || 
                        location.hostname === '127.0.0.1' || 
                        location.protocol === 'file:';
        
        return isLocal ? './assets/sprites/' : 'https://wearescientist.github.io/rouge-cow/assets/sprites/';
    }
    
    /**
     * 获取完整URL
     */
    getUrl(path) {
        const sep = path.includes('?') ? '&' : '?';
        return `${this.basePath}${path}${sep}v=${this.version}`;
    }
    
    /**
     * 加载单张图片
     */
    loadImage(key, path) {
        return new Promise((resolve, reject) => {
            this.totalAssets++;
            
            const img = new Image();
            const url = path.startsWith('http') ? path : this.getUrl(path);
            
            img.onload = () => {
                this.images.set(key, img);
                this.loadedAssets++;
                resolve(img);
            };
            
            img.onerror = () => {
                this.failedAssets++;
                console.warn(`Failed to load image: ${url}`);
                reject(new Error(`Failed to load: ${key}`));
            };
            
            img.src = url;
        });
    }
    
    /**
     * 批量加载图片
     */
    async loadImages(tasks) {
        const results = await Promise.allSettled(
            tasks.map(t => this.loadImage(t.key, t.path).catch(() => null))
        );
        
        return results.map((r, i) => ({
            key: tasks[i].key,
            success: r.status === 'fulfilled',
            image: r.status === 'fulfilled' ? r.value : null
        }));
    }
    
    /**
     * 获取已加载的图片
     */
    getImage(key) {
        return this.images.get(key);
    }
    
    /**
     * 检查图片是否存在
     */
    hasImage(key) {
        return this.images.has(key);
    }
    
    /**
     * 创建回退纹理（当图片加载失败时）
     */
    createFallbackTexture(key, options = {}) {
        const canvas = document.createElement('canvas');
        const size = options.size || 32;
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        const color = options.color || '#666';
        
        // 绘制背景
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);
        
        // 绘制边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, size, size);
        
        // 绘制文字
        if (options.text) {
            ctx.fillStyle = '#fff';
            ctx.font = `${size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(options.text, size / 2, size / 2);
        }
        
        this.images.set(key, canvas);
        return canvas;
    }
    
    /**
     * 加载所有游戏资源
     */
    async loadAllAssets(onProgress = null) {
        const tasks = [];
        
        // ===== 1. 玩家精灵 (8帧) =====
        for (let i = 0; i < 8; i++) {
            tasks.push({ key: `player_${i}`, path: `player/player_${i}.png` });
        }
        
        // ===== 2. 敌人精灵 =====
        const enemies = [
            'chick', 'mouse', 'snail', 'pigeon', 'duck3', 'rabbit', 'rabbit2', 
            'bird', 'duck2', 'pig2', 'cat', 'duck', 'squirrel', 'goose', 
            'dog', 'pig', 'sheep', 'snake', 'bear', 'crab', 'dog2', 'turtle', 'boss6'
        ];
        enemies.forEach(name => {
            tasks.push({ key: name, path: `${name}.png` });
        });
        
        // ===== 3. 武器贴图 =====
        const weapons = [
            'weapon_whip', 'weapon_wand', 'weapon_knife', 'weapon_axe',
            'weapon_bible', 'weapon_fireball', 'weapon_lightning', 'weapon_holywater'
        ];
        weapons.forEach(name => {
            tasks.push({ key: name, path: `weapons/${name}.png` });
        });
        
        // ===== 4. 道具贴图 (16个) =====
        for (let i = 1; i <= 16; i++) {
            const num = String(i).padStart(2, '0');
            tasks.push({ key: `item_${num}`, path: `items/item_${num}.png` });
        }
        
        // ===== 5. 地形贴图 - 地板 =====
        const floors = [
            'layer1_floor_mycelium', 'layer2_floor_greenhouse', 'layer3_floor_nerve',
            'layer4_floor_furnace', 'layer5_floor_courtyard', 'layer6_floor_core'
        ];
        floors.forEach(name => {
            tasks.push({ key: name, path: `tiles/floors/${name}.png` });
        });
        
        // ===== 6. 地形贴图 - 墙壁和门 =====
        for (let layer = 1; layer <= 6; layer++) {
            tasks.push({ key: `layer${layer}_wall`, path: `tiles/walls/layer${layer}_wall.png` });
            tasks.push({ key: `layer${layer}_door_closed`, path: `tiles/walls/layer${layer}_door_closed.png` });
            tasks.push({ key: `layer${layer}_door_open`, path: `tiles/walls/layer${layer}_door_open.png` });
        }
        
        // ===== 7. 地形贴图 - 角落 =====
        const cornerMap = { 1: 'tr', 2: 'br', 3: 'bl', 4: 'tl' };
        for (let layer = 1; layer <= 6; layer++) {
            for (let i = 1; i <= 4; i++) {
                tasks.push({ 
                    key: `layer${layer}_corner_${cornerMap[i]}`, 
                    path: `tiles/corner/layer${layer}_v3_gradient_corner${i}.png` 
                });
            }
        }
        
        // ===== 8. 特效贴图 =====
        const effects = [
            'bullet_arrow', 'bullet_fireball', 'bullet_ice', 'bullet_lightning',
            'effect_coin', 'effect_explosion_large', 'effect_explosion_small',
            'effect_gem_blue', 'effect_gem_gold', 'effect_gem_red',
            'effect_hit_pierce', 'effect_hit_slash',
            'effect_particle_blood', 'effect_particle_glow', 'effect_particle_smoke', 'effect_particle_spark',
            'status_buff', 'status_burn', 'status_poison', 'status_slow', 'status_stun'
        ];
        effects.forEach(name => {
            tasks.push({ key: name, path: `effects/${name}.png` });
        });
        
        // ===== 9. UI贴图 =====
        const ui = [
            'ui_bar_exp_bg', 'ui_bar_exp_fill', 'ui_bar_hp_bg', 'ui_bar_hp_fill',
            'ui_button_hover', 'ui_button_normal', 'ui_button_pressed',
            'ui_heart_empty', 'ui_heart_full', 'ui_heart_gold', 'ui_heart_half',
            'ui_icon_coin', 'ui_icon_gem', 'ui_icon_level', 'ui_icon_time',
            'ui_minimap_current', 'ui_minimap_room', 'ui_minimap_secret', 'ui_minimap_visited',
            'ui_panel_9slice', 'ui_slot_item', 'ui_slot_passive', 'ui_slot_weapon', 'ui_slot_weapon_active'
        ];
        ui.forEach(name => {
            tasks.push({ key: name, path: `ui/${name}.png` });
        });
        
        // ===== 10. 杂项贴图 =====
        const misc = [
            'chest_closed', 'chest_glowing', 'chest_open',
            'deco_bone', 'deco_crystal', 'deco_egg', 'deco_mushroom',
            'npc_healer', 'npc_shopkeeper',
            'totem_attack', 'totem_defense', 'totem_speed'
        ];
        misc.forEach(name => {
            tasks.push({ key: name, path: `misc/${name}.png` });
        });
        
        // 批量加载（每批10个）
        const batchSize = 10;
        const results = [];
        
        for (let i = 0; i < tasks.length; i += batchSize) {
            const batch = tasks.slice(i, i + batchSize);
            const batchResults = await this.loadImages(batch);
            results.push(...batchResults);
            
            if (onProgress) {
                const progress = Math.min(100, ((i + batch.length) / tasks.length) * 100);
                onProgress(progress, batch[batch.length - 1]?.key || '');
            }
        }
        
        // 为失败的资源创建回退纹理
        results.filter(r => !r.success).forEach(r => {
            this.createFallbackTexture(r.key, { 
                color: '#444', 
                text: r.key.substring(0, 2).toUpperCase() 
            });
        });
        
        console.log(`Asset loading complete: ${this.loadedAssets}/${this.totalAssets} loaded, ${this.failedAssets} failed`);
        
        return results;
    }
    
    /**
     * 获取加载进度
     */
    getProgress() {
        if (this.totalAssets === 0) return 1;
        return this.loadedAssets / this.totalAssets;
    }
    
    /**
     * 清除所有资源
     */
    clear() {
        this.images.clear();
        this.audio.clear();
        this.data.clear();
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.failedAssets = 0;
    }
}

// 全局实例
window.assetManager = new AssetManager();
