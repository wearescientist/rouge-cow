# 深根之疫 v0.23 架构演进计划

**规划版本**: v0.23  
**规划日期**: 2026-03-03  
**规划人**: AI Agent (Role A)  
**预计工期**: 3-4 周  

---

## 一、现状分析

### 1.1 项目规模

| 指标 | 数值 | 评估 |
|------|------|------|
| index.html | 660KB | ⚠️ 严重超标 |
| 代码行数 | ~18,000+ 行 | ⚠️ 难以维护 |
| 类定义 | 27 个 | ✅ 合理 |
| 精灵图 | 25 个 | ✅ 合理 |
| src/ 历史文件 | 15+ 个 | ⚠️ 需清理 |
| localStorage 使用 | 17 处 | ✅ 正常 |

### 1.2 架构问题

```
当前架构:
┌─────────────────────────────────────┐
│         index.html (660KB)           │
│  ┌─────────────────────────────┐    │
│  │      内联 CSS (~800行)       │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │      内联 JS (~18000行)      │    │
│  │  - 27个类定义                │    │
│  │  - 武器/道具/敌人数据        │    │
│  │  - 游戏逻辑                  │    │
│  │  - 渲染逻辑                  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
         ↓ 依赖
┌─────────────────────────────────────┐
│    src/core/animation.css (外链)     │
└─────────────────────────────────────┘
```

**问题**:
1. 单体文件难以维护
2. 数据与逻辑耦合
3. 无法使用构建工具优化
4. 加载性能受限

### 1.3 数据现状

| 数据类型 | 数量 | 存储方式 | 评估 |
|----------|------|----------|------|
| 武器 | 8+ | 内联 JS 对象 | ⚠️ 需提取 |
| 道具 | 200 | 内联 JS 对象 | ⚠️ 需提取 |
| 敌人 | 22 | 内联 JS 对象 | ⚠️ 需提取 |
| 房间配置 | 6层 | 内联 JS 对象 | ⚠️ 需提取 |
| 本地化文本 | - | 硬编码 | ⚠️ 需提取 |

---

## 二、优化目标

### 2.1 核心目标

1. **架构现代化** - 从单体架构迁移到模块化架构
2. **数据驱动** - 数据与逻辑分离，支持热更新
3. **性能提升** - 减少首屏加载时间 50%+
4. **可维护性** - 代码结构清晰，便于扩展

### 2.2 具体指标

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| 首屏加载 | ~3s | <1.5s | 50% |
| 文件大小 | 660KB | <300KB | 55% |
| 代码复用率 | 低 | 高 | - |
| 构建工具 | 无 | Vite | - |
| 类型安全 | 无 | TypeScript | - |

---

## 三、详细方案

### Phase 1: 数据层重构 (Week 1)

#### 3.1.1 数据提取策略

将内联数据提取为独立 JSON 文件：

```
data/
├── weapons/
│   ├── melee.json      # 近战武器
│   ├── ranged.json     # 远程武器
│   └── magic.json      # 魔法武器
├── items/
│   ├── common.json     # 普通道具
│   ├── rare.json       # 稀有道具
│   ├── epic.json       # 史诗道具
│   ├── legendary.json  # 传说道具
│   └── cursed.json     # 诅咒道具
├── enemies/
│   ├── tier1.json      # T1 敌人
│   ├── tier2.json      # T2 敌人
│   ├── tier3.json      # T3 敌人
│   ├── tier4.json      # T4 敌人
│   └── bosses.json     # Boss
├── rooms/
│   ├── floor1.json     # 第1层配置
│   ├── floor2.json
│   ├── floor3.json
│   ├── floor4.json
│   ├── floor5.json
│   └── floor6.json
└── i18n/
    ├── zh-CN.json      # 简体中文
    └── en-US.json      # 英文 (预留)
```

#### 3.1.2 数据管理器

创建 `DataManager` 统一加载和管理数据：

```javascript
// src/core/DataManager.js
class DataManager {
    constructor() {
        this.cache = new Map();
        this.loading = new Map();
    }

    async load(category, id) {
        const key = `${category}/${id}`;
        if (this.cache.has(key)) return this.cache.get(key);
        
        const data = await fetch(`data/${category}/${id}.json`).then(r => r.json());
        this.cache.set(key, data);
        return data;
    }

    async loadBatch(category, ids) {
        return Promise.all(ids.map(id => this.load(category, id)));
    }

    get(category, id) {
        return this.cache.get(`${category}/${id}`);
    }
}
```

#### 3.1.3 数据验证

创建数据验证工具确保数据完整性：

```javascript
// tools/validate_data.js
const schemas = {
    weapon: {
        required: ['id', 'name', 'damage', 'cooldown'],
        types: { id: 'string', damage: 'number' }
    },
    item: {
        required: ['id', 'name', 'rarity', 'effect'],
        types: { id: 'number', rarity: 'string' }
    }
};
```

### Phase 2: 核心系统重构 (Week 1-2)

#### 3.2.1 ECS 架构引入

引入 Entity-Component-System 架构：

```
src/
├── ecs/
│   ├── Entity.js           # 实体基类
│   ├── Component.js        # 组件基类
│   ├── System.js           # 系统基类
│   ├── World.js            # 世界管理器
│   └── components/
│       ├── Transform.js    # 位置组件
│       ├── Sprite.js       # 精灵组件
│       ├── Health.js       # 生命组件
│       ├── Movement.js     # 移动组件
│       └── Weapon.js       # 武器组件
└── systems/
    ├── RenderSystem.js     # 渲染系统
    ├── MovementSystem.js   # 移动系统
    ├── CombatSystem.js     # 战斗系统
    └── CollisionSystem.js  # 碰撞系统
```

#### 3.2.2 组件定义

```javascript
// src/ecs/components/Transform.js
class TransformComponent extends Component {
    constructor(x = 0, y = 0, rotation = 0) {
        super();
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scaleX = 1;
        this.scaleY = 1;
    }
    
    get cx() { return this.x; }
    get cy() { return this.y; }
}

// src/ecs/components/Health.js
class HealthComponent extends Component {
    constructor(maxHP = 100) {
        super();
        this.maxHP = maxHP;
        this.currentHP = maxHP;
        this.invulnerable = false;
    }
    
    takeDamage(amount) {
        if (this.invulnerable) return 0;
        const actual = Math.min(this.currentHP, amount);
        this.currentHP -= actual;
        return actual;
    }
}
```

#### 3.2.3 系统定义

```javascript
// src/systems/MovementSystem.js
class MovementSystem extends System {
    update(dt) {
        const entities = this.world.query([TransformComponent, MovementComponent]);
        
        for (const entity of entities) {
            const transform = entity.get(TransformComponent);
            const movement = entity.get(MovementComponent);
            
            transform.x += movement.vx * dt;
            transform.y += movement.vy * dt;
            
            // 应用摩擦力
            movement.vx *= movement.friction;
            movement.vy *= movement.friction;
        }
    }
}
```

### Phase 3: 渲染系统优化 (Week 2)

#### 3.3.1 分层渲染

```javascript
// src/core/Renderer.js
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 分层画布
        this.layers = {
            background: this._createLayer(),
            ground: this._createLayer(),
            entities: this._createLayer(),
            effects: this._createLayer(),
            ui: this._createLayer()
        };
        
        this.dirtyRects = [];
    }
    
    _createLayer() {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        return {
            canvas,
            ctx: canvas.getContext('2d'),
            dirty: true
        };
    }
    
    render() {
        // 只重绘脏图层
        for (const [name, layer] of Object.entries(this.layers)) {
            if (layer.dirty) {
                this._renderLayer(name, layer);
                layer.dirty = false;
            }
        }
        
        // 合成到主画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const layer of Object.values(this.layers)) {
            this.ctx.drawImage(layer.canvas, 0, 0);
        }
    }
}
```

#### 3.3.2 对象池优化

```javascript
// src/core/ObjectPool.js
class ObjectPool {
    constructor(factory, reset, initialSize = 10) {
        this.factory = factory;
        this.reset = reset;
        this.available = [];
        this.inUse = new Set();
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.factory());
        }
    }
    
    acquire() {
        let obj = this.available.pop();
        if (!obj) {
            obj = this.factory();
        }
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            this.reset(obj);
            this.available.push(obj);
        }
    }
}

// 使用示例
const bulletPool = new ObjectPool(
    () => new Bullet(),
    (bullet) => { bullet.reset(); },
    100
);
```

### Phase 4: 构建工具引入 (Week 2-3)

#### 3.4.1 Vite 配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'src',
    build: {
        outDir: '../dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'src/main.js')
            },
            output: {
                manualChunks: {
                    'core': ['./src/core/*.js'],
                    'ecs': ['./src/ecs/*.js'],
                    'systems': ['./src/systems/*.js'],
                    'data': ['./src/data/*.js']
                }
            }
        }
    },
    plugins: [
        // 数据文件处理
        {
            name: 'game-data',
            load(id) {
                if (id.endsWith('.json') && id.includes('/data/')) {
                    // 压缩和验证数据
                }
            }
        }
    ]
});
```

#### 3.4.2 开发服务器

```json
// package.json
{
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "lint": "eslint src/",
        "test": "vitest"
    }
}
```

### Phase 5: TypeScript 迁移 (Week 3-4)

#### 3.5.1 渐进式迁移策略

1. **第一阶段**: 添加类型定义文件 (.d.ts)
2. **第二阶段**: 新代码使用 TypeScript
3. **第三阶段**: 逐步迁移旧代码

```typescript
// src/types/game.d.ts
interface WeaponConfig {
    id: string;
    name: string;
    damage: number;
    cooldown: number;
    type: 'melee' | 'ranged' | 'magic';
    range: number;
    effects?: WeaponEffect[];
}

interface ItemConfig {
    id: number;
    name: string;
    rarity: Rarity;
    effect: EffectType;
    value: number;
    maxStacks: number;
}

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'cursed' | 'mythic';
```

#### 3.5.2 类型安全的数据加载

```typescript
// src/core/DataManager.ts
class DataManager {
    async loadWeapon(id: string): Promise<WeaponConfig> {
        const data = await this.load<WeaponConfig>('weapons', id);
        this.validateWeapon(data);
        return data;
    }
    
    private validateWeapon(data: unknown): asserts data is WeaponConfig {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid weapon data');
        }
        // 更多验证...
    }
}
```

### Phase 6: 存储系统优化 (Week 3)

#### 3.6.1 存储架构重构

```javascript
// src/core/StorageManager.js
class StorageManager {
    constructor() {
        this.adapters = {
            local: new LocalStorageAdapter(),
            indexed: new IndexedDBAdapter(),
            memory: new MemoryAdapter()
        };
        this.defaultAdapter = 'local';
    }
    
    async save(key, data, options = {}) {
        const adapter = this.adapters[options.adapter || this.defaultAdapter];
        const serialized = this.serialize(data);
        await adapter.set(key, serialized);
    }
    
    async load(key, options = {}) {
        const adapter = this.adapters[options.adapter || this.defaultAdapter];
        const data = await adapter.get(key);
        return data ? this.deserialize(data) : null;
    }
    
    serialize(data) {
        // 压缩和加密
        const json = JSON.stringify(data);
        return this.compress(json);
    }
}
```

#### 3.6.2 IndexedDB 适配器

```javascript
// src/adapters/IndexedDBAdapter.js
class IndexedDBAdapter {
    constructor(dbName = 'RogueCow', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('saves')) {
                    db.createObjectStore('saves', { keyPath: 'id' });
                }
            };
        });
    }
    
    async set(key, value) {
        const transaction = this.db.transaction(['saves'], 'readwrite');
        const store = transaction.objectStore('saves');
        await store.put({ id: key, data: value, timestamp: Date.now() });
    }
}
```

### Phase 7: 工具链完善 (Week 4)

#### 3.7.1 自动化测试

```javascript
// tests/combat.test.js
import { describe, it, expect } from 'vitest';
import { CombatSystem } from '../src/systems/CombatSystem';

describe('CombatSystem', () => {
    it('should calculate damage correctly', () => {
        const system = new CombatSystem();
        const damage = system.calculateDamage({
            baseDamage: 10,
            critChance: 0.5,
            critMultiplier: 2
        });
        expect(damage).toBeGreaterThanOrEqual(10);
    });
});
```

#### 3.7.2 数据打包工具

```javascript
// tools/bundle_data.js
const fs = require('fs');
const path = require('path');

function bundleData() {
    const dataDir = './data';
    const output = {};
    
    // 读取所有数据文件
    const categories = fs.readdirSync(dataDir);
    for (const category of categories) {
        const categoryPath = path.join(dataDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;
        
        output[category] = {};
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
            const id = path.basename(file, '.json');
            const content = fs.readFileSync(path.join(categoryPath, file), 'utf8');
            output[category][id] = JSON.parse(content);
        }
    }
    
    // 压缩并输出
    const minified = JSON.stringify(output);
    fs.writeFileSync('./dist/data.bundle.json', minified);
    
    console.log(`Data bundled: ${minified.length} bytes`);
}

bundleData();
```

---

## 四、实施路线图

### Week 1: 数据层 + ECS 基础
- [ ] 提取武器数据到 JSON
- [ ] 提取道具数据到 JSON
- [ ] 提取敌人数据到 JSON
- [ ] 创建 DataManager
- [ ] 实现 ECS 核心类
- [ ] 迁移 Transform/Health 组件

### Week 2: 系统 + 渲染
- [ ] 实现 MovementSystem
- [ ] 实现 CombatSystem
- [ ] 实现 RenderSystem
- [ ] 分层渲染实现
- [ ] 对象池优化
- [ ] 引入 Vite

### Week 3: TypeScript + 存储
- [ ] 添加类型定义
- [ ] 迁移核心类到 TS
- [ ] 实现 IndexedDBAdapter
- [ ] 优化存储格式
- [ ] 数据压缩/加密

### Week 4: 测试 + 优化
- [ ] 单元测试
- [ ] 性能基准测试
- [ ] 数据打包工具
- [ ] 文档更新
- [ ] 清理旧代码

---

## 五、风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 重构引入 Bug | 高 | 分阶段迁移，充分测试 |
| 性能下降 | 中 | 持续性能监控，基准测试 |
| 工期延误 | 中 | 预留缓冲时间，优先级管理 |
| 数据丢失 | 高 | 完整备份，验证工具 |

---

## 六、成功标准

1. **功能完整** - 所有原有功能正常工作
2. **性能提升** - 首屏加载 < 1.5s，FPS 稳定 60
3. **代码质量** - 测试覆盖率 > 60%，零 Error 级别问题
4. **可维护性** - 新功能开发效率提升 30%+

---

## 七、附录

### 7.1 参考资源
- [Vite 官方文档](https://vitejs.dev/)
- [ECS 架构指南](https://github.com/SanderMertens/ecs-faq)
- [TypeScript 迁移指南](https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html)

### 7.2 相关文档
- `REPORT_Optimization_v0.22.1.md` - 上一期优化报告
- `UI_ISSUES_REPORT.md` - UI 问题检查报告
- `DESIGN.md` - 游戏设计文档
