# 渲染系统深度优化方案

**版本**: v1.0  
**日期**: 2026-03-03  
**目标**: FPS 稳定在 60，减少掉帧和卡顿  

---

## 一、现状分析

### 1.1 渲染流程

```
当前渲染流程 (每帧):
┌─────────────────────────────────────────┐
│ 1. 清空画布                             │
│ 2. 绘制地图背景                         │
│ 3. 绘制所有房间                         │
│ 4. 绘制敌人 (遍历 allEnemies)            │
│ 5. 绘制子弹 (遍历 allBullets)            │
│ 6. 绘制粒子 (遍历 allParticles)          │
│ 7. 绘制玩家                             │
│ 8. 绘制特效                             │
│ 9. 绘制 UI                              │
└─────────────────────────────────────────┘
```

**问题**:
1. 全量重绘，没有脏矩形检测
2. 所有实体每帧都遍历，即使不在屏幕内
3. 没有层级管理，绘制顺序混乱
4. 大量临时对象创建（GC 压力）

### 1.2 性能瓶颈

| 瓶颈 | 影响 | 频率 |
|------|------|------|
| 大量粒子渲染 | CPU/GPU | 高 |
| 全量碰撞检测 | CPU | 高 |
| 阴影/特效计算 | GPU | 中 |
| 文字渲染 | CPU | 中 |

---

## 二、优化策略

### 2.1 空间分割 - 四叉树

```javascript
// src/core/QuadTree.js
class QuadTree {
    constructor(boundary, capacity = 10) {
        this.boundary = boundary;  // {x, y, w, h}
        this.capacity = capacity;
        this.entities = [];
        this.divided = false;
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }

    insert(entity) {
        if (!this.boundary.contains(entity)) return false;
        
        if (this.entities.length < this.capacity && !this.divided) {
            this.entities.push(entity);
            return true;
        }
        
        if (!this.divided) {
            this.subdivide();
        }
        
        return this.northeast.insert(entity) ||
               this.northwest.insert(entity) ||
               this.southeast.insert(entity) ||
               this.southwest.insert(entity);
    }

    query(range, found = []) {
        if (!this.boundary.intersects(range)) return found;
        
        for (const entity of this.entities) {
            if (range.contains(entity)) {
                found.push(entity);
            }
        }
        
        if (this.divided) {
            this.northeast.query(range, found);
            this.northwest.query(range, found);
            this.southeast.query(range, found);
            this.southwest.query(range, found);
        }
        
        return found;
    }

    subdivide() {
        const { x, y, w, h } = this.boundary;
        const hw = w / 2;
        const hh = h / 2;
        
        this.northeast = new QuadTree({ x: x + hw, y: y, w: hw, h: hh });
        this.northwest = new QuadTree({ x: x, y: y, w: hw, h: hh });
        this.southeast = new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh });
        this.southwest = new QuadTree({ x: x, y: y + hh, w: hw, h: hh });
        
        this.divided = true;
    }

    clear() {
        this.entities = [];
        if (this.divided) {
            this.northeast = null;
            this.northwest = null;
            this.southeast = null;
            this.southwest = null;
            this.divided = false;
        }
    }
}
```

**使用**:
```javascript
// 游戏循环中
update(dt) {
    // 重建四叉树
    this.quadTree.clear();
    for (const enemy of this.enemies) {
        this.quadTree.insert(enemy);
    }
    
    // 只查询视野范围内的敌人
    const visible = this.quadTree.query(this.camera.viewBounds);
    for (const enemy of visible) {
        enemy.update(dt);
    }
}
```

### 2.2 脏矩形渲染

```javascript
// src/core/DirtyRectRenderer.js
class DirtyRectRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.dirtyRects = [];
        this.layers = new Map();
    }

    markDirty(x, y, w, h) {
        // 合并重叠的脏矩形
        const newRect = { x, y, w, h };
        const merged = [];
        
        for (const rect of this.dirtyRects) {
            if (this.rectsIntersect(newRect, rect)) {
                // 合并
                newRect.x = Math.min(newRect.x, rect.x);
                newRect.y = Math.min(newRect.y, rect.y);
                newRect.w = Math.max(newRect.x + newRect.w, rect.x + rect.w) - newRect.x;
                newRect.h = Math.max(newRect.y + newRect.h, rect.y + rect.h) - newRect.y;
            } else {
                merged.push(rect);
            }
        }
        
        merged.push(newRect);
        this.dirtyRects = merged;
    }

    render() {
        for (const rect of this.dirtyRects) {
            // 只重绘脏矩形区域
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(rect.x, rect.y, rect.w, rect.h);
            this.ctx.clip();
            
            // 清空区域
            this.ctx.clearRect(rect.x, rect.y, rect.w, rect.h);
            
            // 重绘该区域的实体
            this.renderRegion(rect);
            
            this.ctx.restore();
        }
        
        this.dirtyRects = [];
    }

    renderRegion(rect) {
        // 按层级排序
        const entities = this.getEntitiesInRegion(rect)
            .sort((a, b) => a.zIndex - b.zIndex);
        
        for (const entity of entities) {
            entity.draw(this.ctx);
        }
    }
}
```

### 2.3 离屏渲染缓存

```javascript
// src/core/OffscreenCache.js
class OffscreenCache {
    constructor() {
        this.cache = new Map();
        this.maxSize = 50;  // 最大缓存数量
    }

    get(key, width, height) {
        if (this.cache.has(key)) {
            const entry = this.cache.get(key);
            entry.lastUsed = Date.now();
            return entry.canvas;
        }
        
        // 创建新的离屏画布
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // 缓存
        this.cache.set(key, {
            canvas,
            lastUsed: Date.now()
        });
        
        // 清理旧缓存
        this.cleanup();
        
        return canvas;
    }

    cleanup() {
        if (this.cache.size <= this.maxSize) return;
        
        // LRU 清理
        const entries = Array.from(this.cache.entries())
            .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        
        const toRemove = entries.slice(0, this.cache.size - this.maxSize);
        for (const [key] of toRemove) {
            this.cache.delete(key);
        }
    }
}

// 使用示例：缓存静态地图
const mapCache = new OffscreenCache();

function renderMap(mapData) {
    const cacheKey = `map_${mapData.id}`;
    let canvas = mapCache.get(cacheKey, mapData.width, mapData.height);
    
    // 首次渲染
    const ctx = canvas.getContext('2d');
    if (ctx.getImageData(0, 0, 1, 1).data[3] === 0) {
        // 画布为空，需要渲染
        for (const tile of mapData.tiles) {
            drawTile(ctx, tile);
        }
    }
    
    // 绘制到主画布
    mainCtx.drawImage(canvas, 0, 0);
}
```

### 2.4 粒子系统优化

```javascript
// src/core/OptimizedParticleSystem.js
class OptimizedParticleSystem {
    constructor(maxParticles = 1000) {
        this.maxParticles = maxParticles;
        this.particles = new Float32Array(maxParticles * 8); // x, y, vx, vy, life, maxLife, size, color
        this.activeCount = 0;
        this.pool = new ParticlePool(maxParticles);
    }

    spawn(x, y, config) {
        if (this.activeCount >= this.maxParticles) return;
        
        const idx = this.activeCount * 8;
        this.particles[idx] = x;
        this.particles[idx + 1] = y;
        this.particles[idx + 2] = config.vx || 0;
        this.particles[idx + 3] = config.vy || 0;
        this.particles[idx + 4] = config.life || 100;
        this.particles[idx + 5] = config.life || 100;
        this.particles[idx + 6] = config.size || 5;
        this.particles[idx + 7] = config.color || 0xFFFFFF;
        
        this.activeCount++;
    }

    update(dt) {
        let writeIdx = 0;
        
        for (let i = 0; i < this.activeCount; i++) {
            const idx = i * 8;
            
            // 更新位置
            this.particles[idx] += this.particles[idx + 2] * dt;
            this.particles[idx + 1] += this.particles[idx + 3] * dt;
            
            // 更新生命
            this.particles[idx + 4] -= dt;
            
            // 如果粒子还存活，保留
            if (this.particles[idx + 4] > 0) {
                if (writeIdx !== i) {
                    // 移动到前面（紧凑数组）
                    const writePos = writeIdx * 8;
                    for (let j = 0; j < 8; j++) {
                        this.particles[writePos + j] = this.particles[idx + j];
                    }
                }
                writeIdx++;
            }
        }
        
        this.activeCount = writeIdx;
    }

    render(ctx) {
        ctx.save();
        
        for (let i = 0; i < this.activeCount; i++) {
            const idx = i * 8;
            const x = this.particles[idx];
            const y = this.particles[idx + 1];
            const life = this.particles[idx + 4];
            const maxLife = this.particles[idx + 5];
            const size = this.particles[idx + 6];
            const color = this.particles[idx + 7];
            
            const alpha = life / maxLife;
            const actualSize = size * alpha;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
            ctx.beginPath();
            ctx.arc(x, y, actualSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
```

### 2.5 批量绘制

```javascript
// src/core/BatchRenderer.js
class BatchRenderer {
    constructor(ctx) {
        this.ctx = ctx;
        this.batches = new Map(); // 按纹理/颜色分组
    }

    add(sprite, x, y, options = {}) {
        const key = options.texture || options.color || 'default';
        
        if (!this.batches.has(key)) {
            this.batches.set(key, []);
        }
        
        this.batches.get(key).push({ sprite, x, y, ...options });
    }

    render() {
        for (const [key, items] of this.batches) {
            this.renderBatch(key, items);
        }
        
        this.batches.clear();
    }

    renderBatch(key, items) {
        this.ctx.save();
        
        // 设置通用状态
        this.ctx.fillStyle = key.startsWith('#') ? key : '#fff';
        
        // 批量绘制
        this.ctx.beginPath();
        for (const item of items) {
            if (item.sprite) {
                // 图片绘制
                this.ctx.drawImage(item.sprite, item.x, item.y);
            } else {
                // 形状绘制
                this.ctx.rect(item.x, item.y, item.w, item.h);
            }
        }
        
        if (!items[0]?.sprite) {
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
}
```

---

## 三、相机系统优化

### 3.1 视口剔除

```javascript
// src/core/Camera.js
class Camera {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.zoom = 1;
        
        // 视野边界（带缓冲）
        this.viewBounds = { x: 0, y: 0, w: 0, h: 0 };
        this.buffer = 100; // 缓冲区域
    }

    update() {
        // 计算视野边界
        this.viewBounds.x = this.x - this.buffer;
        this.viewBounds.y = this.y - this.buffer;
        this.viewBounds.w = this.width + this.buffer * 2;
        this.viewBounds.h = this.height + this.buffer * 2;
    }

    isVisible(entity) {
        return (
            entity.x + entity.width > this.viewBounds.x &&
            entity.x < this.viewBounds.x + this.viewBounds.w &&
            entity.y + entity.height > this.viewBounds.y &&
            entity.y < this.viewBounds.y + this.viewBounds.h
        );
    }

    worldToScreen(x, y) {
        return {
            x: (x - this.x) * this.zoom + this.width / 2,
            y: (y - this.y) * this.zoom + this.height / 2
        };
    }

    screenToWorld(x, y) {
        return {
            x: (x - this.width / 2) / this.zoom + this.x,
            y: (y - this.height / 2) / this.zoom + this.y
        };
    }
}
```

---

## 四、LOD（细节层次）

```javascript
// src/core/LODSystem.js
class LODSystem {
    constructor() {
        this.levels = [
            { distance: 0, scale: 1, effects: true },
            { distance: 300, scale: 0.8, effects: false },
            { distance: 600, scale: 0.5, effects: false }
        ];
    }

    getLOD(entity, camera) {
        const dx = entity.x - camera.x;
        const dy = entity.y - camera.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        for (const level of this.levels) {
            if (distance >= level.distance) {
                return level;
            }
        }
        
        return this.levels[this.levels.length - 1];
    }

    shouldRender(entity, camera) {
        const lod = this.getLOD(entity, camera);
        return lod.scale > 0.1; // 太远了就不渲染
    }
}
```

---

## 五、性能监控

```javascript
// 集成到 PerformanceMonitor
class RenderProfiler {
    constructor() {
        this.metrics = {
            drawCalls: 0,
            entitiesRendered: 0,
            particlesRendered: 0,
            cullRate: 0
        };
        this.history = [];
    }

    beginFrame() {
        this.metrics.drawCalls = 0;
        this.metrics.entitiesRendered = 0;
        this.metrics.particlesRendered = 0;
    }

    recordDrawCall() {
        this.metrics.drawCalls++;
    }

    recordEntityRendered() {
        this.metrics.entitiesRendered++;
    }

    endFrame() {
        this.history.push({ ...this.metrics, timestamp: performance.now() });
        if (this.history.length > 60) {
            this.history.shift();
        }
    }

    getAverageMetrics() {
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        
        return {
            drawCalls: avg(this.history.map(h => h.drawCalls)),
            entitiesRendered: avg(this.history.map(h => h.entitiesRendered))
        };
    }
}
```

---

## 六、实施计划

### Phase 1: 基础优化 (3天)
- [ ] 实现 Camera 视口剔除
- [ ] 集成 QuadTree
- [ ] 添加渲染性能监控

### Phase 2: 高级优化 (5天)
- [ ] 实现脏矩形渲染
- [ ] 离屏缓存静态元素
- [ ] 粒子系统优化

### Phase 3: 完善 (2天)
- [ ] LOD 系统
- [ ] 批量绘制
- [ ] 性能测试验证

---

## 七、预期效果

| 指标 | 当前 | 目标 | 优化手段 |
|------|------|------|----------|
| FPS | 45-55 | 60 | 视口剔除 + 脏矩形 |
| 掉帧率 | 10% | <2% | 四叉树 + 对象池 |
| 内存占用 | 120MB | 80MB | 离屏缓存管理 |
| 绘制调用 | 500+ | <200 | 批量绘制 |
