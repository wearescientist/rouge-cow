# 数据驱动架构设计方案

**版本**: v1.0  
**日期**: 2026-03-03  
**目标**: 实现数据与逻辑完全分离，支持热更新和MOD  

---

## 一、设计原则

### 1.1 核心理念

```
数据驱动 = 配置决定行为，代码提供能力
```

**传统方式**:
```javascript
// 硬编码
if (weapon.type === 'sword') {
    damage = 10;
    range = 50;
}
```

**数据驱动**:
```javascript
// 配置驱动
const weapon = DataManager.get('weapons', 'sword');
this.combatSystem.attack(weapon);
```

### 1.2 优势

1. **无需代码修改即可调整平衡**
2. **支持运行时热更新**
3. **方便 MOD 开发**
4. **更好的版本控制**（JSON 比 JS 更易 diff）
5. **策划可直接修改数据**

---

## 二、数据架构

### 2.1 数据分类

```
data/
├── runtime/              # 运行时生成/修改的数据
│   ├── saves/            # 存档
│   ├── configs/          # 用户配置
│   └── cache/            # 缓存
├── static/               # 静态数据（只读）
│   ├── weapons/          # 武器
│   ├── items/            # 道具
│   ├── enemies/          # 敌人
│   ├── rooms/            # 房间
│   ├── skills/           # 技能
│   └── events/           # 事件
└── i18n/                 # 本地化
    ├── zh-CN/
    └── en-US/
```

### 2.2 数据格式规范

#### 武器数据

```json
{
    "id": "whip",
    "name": "鞭子",
    "name_en": "Whip",
    "description": "近战武器，攻击范围为扇形",
    "type": "melee",
    "rarity": "common",
    
    "stats": {
        "damage": 35,
        "cooldown": 1.2,
        "range": 80,
        "angle": 90,
        "knockback": 5
    },
    
    "visual": {
        "icon": "🪓",
        "color": "#ff6b6b",
        "particle": "slash_red",
        "sound": "whip_crack"
    },
    
    "upgrades": {
        "maxLevel": 8,
        "perLevel": {
            "damage": 1.2,
            "range": 1.1
        },
        "special": {
            "4": { "effect": "pierce", "value": 2 },
            "8": { "evolution": "blood_whip" }
        }
    },
    
    "evolution": {
        "target": "blood_whip",
        "requirements": [
            { "type": "item", "id": "hollow_heart" }
        ]
    },
    
    "tags": ["melee", "slash", "upgradeable"]
}
```

#### 道具数据

```json
{
    "id": 1,
    "name": "心之容器",
    "name_en": "Heart Container",
    "description": "最大生命值 +1",
    "rarity": "common",
    "category": "defense",
    
    "effect": {
        "type": "stat_modifier",
        "target": "maxHP",
        "value": 1,
        "stackType": "linear",
        "maxStacks": 0
    },
    
    "visual": {
        "icon": "❤️",
        "color": "#ff4444",
        "pickupSound": "heart_pickup"
    },
    
    "synergies": [
        { "item": "mom_knife", "effect": "mad_chef_bonus" }
    ],
    
    "tags": ["hp", "permanent", "stackable"]
}
```

#### 敌人数据

```json
{
    "id": "rabbit_t1",
    "name": "感染兔",
    "name_en": "Infected Rabbit",
    "tier": 1,
    "type": "ground",
    
    "stats": {
        "hp": 12,
        "speed": 60,
        "damage": 5,
        "exp": 2,
        "gold": 1
    },
    
    "ai": {
        "behavior": "chase",
        "sightRange": 200,
        "attackRange": 30,
        "skills": ["jump"],
        "fleeThreshold": 0.2
    },
    
    "visual": {
        "sprite": "rabbit",
        "outline": "white",
        "scale": 1.0,
        "animations": {
            "idle": "rabbit_idle",
            "run": "rabbit_run",
            "attack": "rabbit_attack",
            "death": "rabbit_death"
        }
    },
    
    "loot": {
        "exp": { "min": 2, "max": 3 },
        "gold": { "min": 0, "max": 1, "chance": 0.8 },
        "items": [
            { "id": "health_small", "chance": 0.02 }
        ]
    },
    
    "tags": ["ground", "fast", "jumper"]
}
```

### 2.3 数据继承系统

支持数据继承，减少重复：

```json
{
    "id": "rabbit_t2",
    "extends": "rabbit_t1",
    "name": "狂暴兔",
    "tier": 2,
    "stats": {
        "hp": 25,
        "speed": 80,
        "damage": 8
    },
    "visual": {
        "outline": "green"
    }
}
```

---

## 三、DataManager 设计

### 3.1 核心 API

```typescript
class DataManager {
    // 同步获取（已缓存）
    get<T>(category: string, id: string): T | null;
    
    // 异步加载（自动缓存）
    load<T>(category: string, id: string): Promise<T>;
    
    // 批量加载
    loadBatch<T>(category: string, ids: string[]): Promise<T[]>;
    
    // 条件查询
    query<T>(category: string, filter: FilterFn<T>): T[];
    
    // 按标签查询
    findByTag<T>(category: string, tag: string): T[];
    
    // 热更新
    reload(category: string, id: string): Promise<void>;
    
    // 数据验证
    validate<T>(category: string, data: unknown): ValidationResult;
}
```

### 3.2 实现代码

```javascript
// src/core/DataManager.js
class DataManager {
    constructor() {
        this.cache = new Map();
        this.schemas = new Map();
        this.listeners = new Map();
        this.baseUrl = './data';
    }

    /**
     * 注册数据验证模式
     */
    registerSchema(category, schema) {
        this.schemas.set(category, schema);
    }

    /**
     * 获取数据（同步）
     */
    get(category, id) {
        const key = `${category}/${id}`;
        return this.cache.get(key) || null;
    }

    /**
     * 加载数据（异步）
     */
    async load(category, id, options = {}) {
        const key = `${category}/${id}`;
        
        // 检查缓存
        if (!options.forceReload && this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        // 加载数据
        try {
            const url = `${this.baseUrl}/${category}/${id}.json`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${key}: ${response.status}`);
            }
            
            let data = await response.json();
            
            // 处理继承
            if (data.extends) {
                data = await this.resolveInheritance(category, data);
            }
            
            // 验证数据
            const schema = this.schemas.get(category);
            if (schema) {
                const result = this.validateAgainstSchema(data, schema);
                if (!result.valid) {
                    console.error(`[DataManager] Validation failed for ${key}:`, result.errors);
                }
            }
            
            // 缓存
            this.cache.set(key, data);
            
            // 通知监听器
            this.notify(key, data);
            
            return data;
            
        } catch (error) {
            console.error(`[DataManager] Error loading ${key}:`, error);
            throw error;
        }
    }

    /**
     * 批量加载
     */
    async loadBatch(category, ids) {
        return Promise.all(ids.map(id => this.load(category, id)));
    }

    /**
     * 条件查询
     */
    query(category, filter) {
        const results = [];
        const prefix = `${category}/`;
        
        for (const [key, data] of this.cache) {
            if (key.startsWith(prefix) && filter(data)) {
                results.push(data);
            }
        }
        
        return results;
    }

    /**
     * 按标签查询
     */
    findByTag(category, tag) {
        return this.query(category, data => 
            data.tags && data.tags.includes(tag)
        );
    }

    /**
     * 解析继承
     */
    async resolveInheritance(category, data) {
        const parent = await this.load(category, data.extends);
        return this.deepMerge(parent, data);
    }

    /**
     * 深度合并
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (key === 'extends') continue;
            
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * 订阅数据变化
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        return () => this.listeners.get(key).delete(callback);
    }

    /**
     * 通知监听器
     */
    notify(key, data) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(cb => cb(data));
        }
    }

    /**
     * 验证数据
     */
    validateAgainstSchema(data, schema) {
        const errors = [];
        
        for (const [key, rule] of Object.entries(schema)) {
            if (rule.required && !(key in data)) {
                errors.push(`Missing required field: ${key}`);
            }
            
            if (key in data && rule.type) {
                const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
                if (actualType !== rule.type) {
                    errors.push(`Type mismatch for ${key}: expected ${rule.type}, got ${actualType}`);
                }
            }
        }
        
        return { valid: errors.length === 0, errors };
    }

    /**
     * 预加载分类数据
     */
    async preload(category, ids) {
        console.log(`[DataManager] Preloading ${category}: ${ids.length} items`);
        return this.loadBatch(category, ids);
    }

    /**
     * 清空缓存
     */
    clear() {
        this.cache.clear();
    }
}

// 全局单例
window.DataManager = DataManager;
window.dataManager = new DataManager();
```

---

## 四、编辑器支持

### 4.1 JSON Schema

为编辑器提供代码提示：

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Weapon",
    "type": "object",
    "required": ["id", "name", "type", "stats"],
    "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "type": {
            "type": "string",
            "enum": ["melee", "ranged", "magic", "summon"]
        },
        "stats": {
            "type": "object",
            "properties": {
                "damage": { "type": "number", "minimum": 0 },
                "cooldown": { "type": "number", "minimum": 0 },
                "range": { "type": "number", "minimum": 0 }
            },
            "required": ["damage", "cooldown"]
        }
    }
}
```

### 4.2 数据验证工具

```javascript
// tools/validate_data.js
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true });

async function validateAll() {
    const schemas = loadSchemas();
    const dataDir = './data/static';
    let errors = 0;
    
    for (const category of fs.readdirSync(dataDir)) {
        const categoryPath = path.join(dataDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;
        
        const schema = schemas[category];
        if (!schema) {
            console.warn(`No schema for category: ${category}`);
            continue;
        }
        
        const validate = ajv.compile(schema);
        
        for (const file of fs.readdirSync(categoryPath)) {
            if (!file.endsWith('.json')) continue;
            
            const data = JSON.parse(fs.readFileSync(path.join(categoryPath, file), 'utf8'));
            const valid = validate(data);
            
            if (!valid) {
                console.error(`❌ ${category}/${file}:`);
                validate.errors.forEach(err => {
                    console.error(`   ${err.message}`);
                });
                errors++;
            } else {
                console.log(`✅ ${category}/${file}`);
            }
        }
    }
    
    if (errors > 0) {
        process.exit(1);
    }
}

validateAll();
```

---

## 五、热更新实现

### 5.1 开发模式热更新

```javascript
// src/core/HotReload.js
class HotReload {
    constructor(dataManager) {
        this.dm = dataManager;
        this.ws = null;
        this.enabled = false;
    }

    enable() {
        if (this.enabled) return;
        
        // 连接开发服务器 WebSocket
        this.ws = new WebSocket('ws://localhost:3000/hot-reload');
        
        this.ws.onmessage = (event) => {
            const { category, id } = JSON.parse(event.data);
            this.dm.load(category, id, { forceReload: true });
            console.log(`[HotReload] Reloaded ${category}/${id}`);
        };
        
        this.enabled = true;
    }
}
```

### 5.2 Vite 插件

```javascript
// vite-plugin-data-hot-reload.js
export default function dataHotReload() {
    return {
        name: 'data-hot-reload',
        
        configureServer(server) {
            server.ws.on('connection', (socket) => {
                // 监听数据文件变化
                const watcher = chokidar.watch('./data/**/*.json');
                
                watcher.on('change', (path) => {
                    const match = path.match(/data\/(\w+)\/(\w+)\.json/);
                    if (match) {
                        socket.send(JSON.stringify({
                            category: match[1],
                            id: match[2]
                        }));
                    }
                });
            });
        }
    };
}
```

---

## 六、实施计划

### Phase 1: 基础设施 (3天)
- [ ] 创建 DataManager
- [ ] 实现数据验证
- [ ] 创建目录结构

### Phase 2: 数据迁移 (5天)
- [ ] 提取武器数据
- [ ] 提取道具数据
- [ ] 提取敌人数据
- [ ] 编写验证脚本

### Phase 3: 代码适配 (5天)
- [ ] 修改武器系统
- [ ] 修改道具系统
- [ ] 修改敌人系统
- [ ] 测试验证

### Phase 4: 工具链 (2天)
- [ ] JSON Schema
- [ ] 数据验证 CI
- [ ] 热更新支持

---

## 七、预期收益

| 指标 | 当前 | 目标 | 收益 |
|------|------|------|------|
| 平衡调整时间 | 30分钟 | 5分钟 | 6x |
| 新武器开发 | 2小时 | 30分钟 | 4x |
| Bug 引入率 | 中 | 低 | -50% |
| MOD 支持 | 无 | 完整 | 新增 |
