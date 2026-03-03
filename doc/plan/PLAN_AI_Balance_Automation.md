# AI 行为树与平衡自动化方案

**版本**: v1.0  
**日期**: 2026-03-03  
**目标**: 实现智能敌人AI、自动化平衡测试  

---

## 一、AI 系统重构

### 1.1 行为树架构

```
当前敌人AI:
┌─────────────────────────────────────┐
│  if (distance < attackRange)        │
│      attack();                      │
│  else if (distance < sightRange)    │
│      chase();                       │
│  else                               │
│      idle();                        │
└─────────────────────────────────────┘

目标行为树:
┌─────────────────────────────────────┐
│  [Root] Selector                    │
│    ├── [Dead] 死亡处理               │
│    ├── [Stunned] 眩晕处理            │
│    ├── [Combat] Sequence             │
│    │   ├── 检查攻击CD                │
│    │   ├── 选择技能                  │
│    │   └── 执行攻击                  │
│    ├── [Chase] Sequence              │
│    │   ├── 寻路计算                  │
│    │   ├── 避障检测                  │
│    │   └── 移动执行                  │
│    └── [Idle] 待机行为               │
└─────────────────────────────────────┘
```

### 1.2 行为树实现

```javascript
// src/ai/BehaviorTree.js

// 节点基类
class BTNode {
    constructor() {
        this.status = 'ready'; // ready, running, success, failure
    }

    tick(context) {
        throw new Error('Must implement tick()');
    }

    reset() {
        this.status = 'ready';
    }
}

// 选择器：顺序执行子节点，直到有一个成功
class Selector extends BTNode {
    constructor(children = []) {
        super();
        this.children = children;
        this.currentIndex = 0;
    }

    tick(context) {
        while (this.currentIndex < this.children.length) {
            const child = this.children[this.currentIndex];
            const status = child.tick(context);

            if (status === 'success') {
                this.reset();
                return 'success';
            }

            if (status === 'running') {
                this.status = 'running';
                return 'running';
            }

            this.currentIndex++;
        }

        this.reset();
        return 'failure';
    }

    reset() {
        super.reset();
        this.currentIndex = 0;
        this.children.forEach(c => c.reset());
    }
}

// 序列：顺序执行子节点，直到有一个失败
class Sequence extends BTNode {
    constructor(children = []) {
        super();
        this.children = children;
        this.currentIndex = 0;
    }

    tick(context) {
        while (this.currentIndex < this.children.length) {
            const child = this.children[this.currentIndex];
            const status = child.tick(context);

            if (status === 'failure') {
                this.reset();
                return 'failure';
            }

            if (status === 'running') {
                this.status = 'running';
                return 'running';
            }

            this.currentIndex++;
        }

        this.reset();
        return 'success';
    }

    reset() {
        super.reset();
        this.currentIndex = 0;
        this.children.forEach(c => c.reset());
    }
}

// 条件节点
class Condition extends BTNode {
    constructor(checkFn) {
        super();
        this.checkFn = checkFn;
    }

    tick(context) {
        return this.checkFn(context) ? 'success' : 'failure';
    }
}

// 动作节点
class Action extends BTNode {
    constructor(actionFn) {
        super();
        this.actionFn = actionFn;
    }

    tick(context) {
        return this.actionFn(context);
    }
}

// 装饰器：反转结果
class Inverter extends BTNode {
    constructor(child) {
        super();
        this.child = child;
    }

    tick(context) {
        const status = this.child.tick(context);
        if (status === 'success') return 'failure';
        if (status === 'failure') return 'success';
        return status;
    }
}
```

### 1.3 敌人AI定义

```javascript
// src/ai/EnemyAI.js
class EnemyAI {
    static createBehaviorTree(enemy) {
        const config = enemy.aiConfig;
        
        return new Selector([
            // 死亡检查
            new Condition(ctx => ctx.enemy.hp <= 0),
            
            // 眩晕检查
            new Sequence([
                new Condition(ctx => ctx.enemy.isStunned),
                new Action(ctx => {
                    ctx.enemy.stunTimer -= ctx.dt;
                    return ctx.enemy.stunTimer <= 0 ? 'success' : 'running';
                })
            ]),
            
            // 战斗行为
            new Sequence([
                new Condition(ctx => ctx.distanceToPlayer < config.attackRange),
                new Selector([
                    // 技能攻击
                    new Sequence([
                        new Condition(ctx => ctx.canUseSkill()),
                        new Action(ctx => ctx.useSkill())
                    ]),
                    // 普通攻击
                    new Action(ctx => ctx.attack())
                ])
            ]),
            
            // 追击行为
            new Sequence([
                new Condition(ctx => ctx.distanceToPlayer < config.sightRange),
                new Selector([
                    // 特殊移动
                    new Sequence([
                        new Condition(ctx => ctx.shouldJump()),
                        new Action(ctx => ctx.jump())
                    ]),
                    // 普通追击
                    new Action(ctx => ctx.chase())
                ])
            ]),
            
            // 巡逻/待机
            new Action(ctx => ctx.idle())
        ]);
    }
}
```

### 1.4 数据驱动的AI配置

```json
{
    "id": "rabbit_t2",
    "ai": {
        "type": "aggressive",
        "behaviors": {
            "combat": {
                "attackRange": 40,
                "attackCooldown": 1.5,
                "preferSkill": true,
                "skills": ["jump_attack", "quick_strike"]
            },
            "chase": {
                "sightRange": 300,
                "loseInterestRange": 400,
                "pathfinding": "astar",
                "avoidObstacles": true
            },
            "idle": {
                "patrolRadius": 100,
                "patrolWaitTime": [2, 5]
            }
        },
        "reactions": {
            "onHit": {
                "chance": 0.3,
                "actions": ["retreat", "counter"]
            },
            "onAllyDeath": {
                "chance": 0.5,
                "actions": ["flee", "enrage"]
            }
        }
    }
}
```

---

## 二、寻路系统

### 2.1 A* 寻路

```javascript
// src/ai/Pathfinder.js
class Pathfinder {
    constructor(grid) {
        this.grid = grid;
        this.openSet = new PriorityQueue();
        this.closedSet = new Set();
    }

    findPath(start, goal) {
        this.openSet.clear();
        this.closedSet.clear();
        
        const startNode = {
            x: start.x,
            y: start.y,
            g: 0,
            h: this.heuristic(start, goal),
            parent: null
        };
        startNode.f = startNode.g + startNode.h;
        
        this.openSet.enqueue(startNode, startNode.f);
        
        while (!this.openSet.isEmpty()) {
            const current = this.openSet.dequeue();
            
            if (current.x === goal.x && current.y === goal.y) {
                return this.reconstructPath(current);
            }
            
            this.closedSet.add(`${current.x},${current.y}`);
            
            for (const neighbor of this.getNeighbors(current)) {
                if (this.closedSet.has(`${neighbor.x},${neighbor.y}`)) {
                    continue;
                }
                
                const tentativeG = current.g + this.distance(current, neighbor);
                
                const existing = this.openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
                if (!existing || tentativeG < existing.g) {
                    neighbor.g = tentativeG;
                    neighbor.h = this.heuristic(neighbor, goal);
                    neighbor.f = neighbor.g + neighbor.h;
                    neighbor.parent = current;
                    
                    if (!existing) {
                        this.openSet.enqueue(neighbor, neighbor.f);
                    }
                }
            }
        }
        
        return null; // 无路径
    }

    heuristic(a, b) {
        // 曼哈顿距离
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 }
        ];
        
        for (const dir of directions) {
            const x = node.x + dir.x;
            const y = node.y + dir.y;
            
            if (this.grid.isWalkable(x, y)) {
                neighbors.push({ x, y });
            }
        }
        
        return neighbors;
    }

    reconstructPath(node) {
        const path = [];
        let current = node;
        
        while (current) {
            path.unshift({ x: current.x, y: current.y });
            current = current.parent;
        }
        
        return path;
    }
}
```

### 2.2 流场寻路（群体AI）

```javascript
// src/ai/FlowField.js
class FlowField {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.field = new Array(width * height);
    }

    compute(targetX, targetY, obstacles) {
        // 初始化
        for (let i = 0; i < this.field.length; i++) {
            this.field[i] = { cost: Infinity, direction: null };
        }
        
        // 目标点
        const targetIdx = targetY * this.width + targetX;
        this.field[targetIdx].cost = 0;
        
        // 波前传播
        const queue = [{ x: targetX, y: targetY, cost: 0 }];
        
        while (queue.length > 0) {
            const { x, y, cost } = queue.shift();
            const idx = y * this.width + x;
            
            if (cost > this.field[idx].cost) continue;
            
            const neighbors = this.getNeighbors(x, y);
            
            for (const neighbor of neighbors) {
                if (obstacles.has(`${neighbor.x},${neighbor.y}`)) continue;
                
                const nIdx = neighbor.y * this.width + neighbor.x;
                const newCost = cost + 1;
                
                if (newCost < this.field[nIdx].cost) {
                    this.field[nIdx].cost = newCost;
                    this.field[nIdx].direction = { x: x - neighbor.x, y: y - neighbor.y };
                    queue.push({ x: neighbor.x, y: neighbor.y, cost: newCost });
                }
            }
        }
    }

    getDirection(x, y) {
        const idx = y * this.width + x;
        return this.field[idx]?.direction || { x: 0, y: 0 };
    }
}
```

---

## 三、平衡自动化

### 3.1 模拟战斗系统

```javascript
// tools/balance/Simulator.js
class BattleSimulator {
    constructor() {
        this.results = [];
    }

    /**
     * 模拟单场战斗
     */
    simulateBattle(playerConfig, enemyWave, duration = 60) {
        const player = this.createPlayer(playerConfig);
        const enemies = this.createEnemies(enemyWave);
        
        let time = 0;
        const dt = 1/60;
        const log = [];
        
        while (time < duration && player.hp > 0) {
            // 更新玩家
            player.update(dt, enemies);
            
            // 更新敌人
            for (const enemy of enemies) {
                if (enemy.hp > 0) {
                    enemy.update(dt, player);
                }
            }
            
            // 记录数据
            if (Math.floor(time) % 5 === 0 && Math.floor(time) !== Math.floor(time - dt)) {
                log.push({
                    time,
                    playerHP: player.hp,
                    enemyCount: enemies.filter(e => e.hp > 0).length
                });
            }
            
            time += dt;
        }
        
        return {
            survived: player.hp > 0,
            duration: time,
            playerHP: player.hp,
            enemiesKilled: enemies.filter(e => e.hp <= 0).length,
            log
        };
    }

    /**
     * 批量测试武器平衡
     */
    testWeaponBalance(weaponId, iterations = 100) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const result = this.simulateBattle(
                { weapon: weaponId, items: [] },
                this.generateRandomWave()
            );
            results.push(result);
        }
        
        return this.analyzeResults(results);
    }

    analyzeResults(results) {
        const survived = results.filter(r => r.survived).length;
        const avgDuration = results.reduce((a, b) => a + b.duration, 0) / results.length;
        const avgKills = results.reduce((a, b) => a + b.enemiesKilled, 0) / results.length;
        
        return {
            survivalRate: survived / results.length,
            avgDuration,
            avgKills,
            balance: this.calculateBalanceScore(results)
        };
    }

    calculateBalanceScore(results) {
        // 理想状态：生存率 70%，平均时长适中
        const survivalRate = results.filter(r => r.survived).length / results.length;
        const idealSurvival = 0.7;
        const survivalScore = 1 - Math.abs(survivalRate - idealSurvival) * 2;
        
        return Math.max(0, Math.min(1, survivalScore));
    }
}
```

### 3.2 平衡测试报告

```javascript
// tools/balance/generate_report.js
async function generateBalanceReport() {
    const simulator = new BattleSimulator();
    const report = {
        weapons: {},
        items: {},
        enemies: {},
        timestamp: new Date().toISOString()
    };
    
    // 测试所有武器
    const weapons = await dataManager.loadAll('weapons');
    for (const weapon of weapons) {
        console.log(`Testing weapon: ${weapon.id}`);
        report.weapons[weapon.id] = simulator.testWeaponBalance(weapon.id, 50);
    }
    
    // 测试道具组合
    const items = await dataManager.loadAll('items');
    for (const item of items.slice(0, 20)) { // 测试前20个
        console.log(`Testing item: ${item.id}`);
        report.items[item.id] = simulator.testItemBalance(item.id);
    }
    
    // 生成建议
    report.recommendations = generateRecommendations(report);
    
    // 保存报告
    fs.writeFileSync('balance_report.json', JSON.stringify(report, null, 2));
    
    return report;
}

function generateRecommendations(report) {
    const recommendations = [];
    
    // 检查过强武器
    for (const [id, data] of Object.entries(report.weapons)) {
        if (data.survivalRate > 0.9) {
            recommendations.push({
                type: 'weapon_too_strong',
                id,
                value: data.survivalRate,
                suggestion: `考虑降低 ${id} 的伤害或增加冷却`
            });
        }
        if (data.survivalRate < 0.3) {
            recommendations.push({
                type: 'weapon_too_weak',
                id,
                value: data.survivalRate,
                suggestion: `考虑增强 ${id} 的伤害或减少冷却`
            });
        }
    }
    
    return recommendations;
}
```

### 3.3 自动化平衡调整

```javascript
// tools/balance/auto_balance.js
class AutoBalancer {
    constructor(targetSurvivalRate = 0.7) {
        this.target = targetSurvivalRate;
        this.tolerance = 0.1;
    }

    async balanceWeapon(weaponId) {
        const simulator = new BattleSimulator();
        let iterations = 0;
        const maxIterations = 10;
        
        while (iterations < maxIterations) {
            const result = simulator.testWeaponBalance(weaponId, 30);
            
            // 检查是否在目标范围内
            if (Math.abs(result.survivalRate - this.target) < this.tolerance) {
                console.log(`✅ ${weaponId} 已平衡`);
                return true;
            }
            
            // 调整数值
            const weapon = await dataManager.load('weapons', weaponId);
            
            if (result.survivalRate > this.target) {
                // 太强，需要削弱
                weapon.stats.damage *= 0.95;
                weapon.stats.cooldown *= 1.05;
            } else {
                // 太弱，需要增强
                weapon.stats.damage *= 1.05;
                weapon.stats.cooldown *= 0.95;
            }
            
            // 保存调整
            await dataManager.save('weapons', weaponId, weapon);
            
            iterations++;
        }
        
        console.log(`⚠️ ${weaponId} 无法自动平衡，需要手动调整`);
        return false;
    }
}
```

---

## 四、AI 训练系统

### 4.1 遗传算法优化AI参数

```javascript
// tools/ai/evolve_ai.js
class AIEvolution {
    constructor() {
        this.populationSize = 50;
        this.mutationRate = 0.1;
        this.generations = 100;
    }

    /**
     * 创建随机AI参数
     */
    createRandomGenome() {
        return {
            aggression: Math.random(),        // 攻击性
            caution: Math.random(),           // 谨慎度
            cooperation: Math.random(),       // 配合度
            reactionTime: 0.1 + Math.random() * 0.5,  // 反应时间
            prediction: Math.random(),        // 预判能力
            fleeThreshold: 0.1 + Math.random() * 0.5  // 逃跑阈值
        };
    }

    /**
     * 评估AI适应度
     */
    async evaluateFitness(genome) {
        const simulator = new BattleSimulator();
        let totalScore = 0;
        
        // 进行多场战斗
        for (let i = 0; i < 10; i++) {
            const result = simulator.simulateBattle(
                { ai: genome },
                this.generateWave(i)
            );
            
            // 评分：考虑伤害输出、生存能力、战斗效率
            const score = 
                result.damageDealt * 0.4 +
                result.survived ? 100 : 0 +
                result.enemiesKilled * 10;
            
            totalScore += score;
        }
        
        return totalScore / 10;
    }

    /**
     * 进化一代
     */
    async evolveGeneration(population) {
        // 评估适应度
        const evaluated = await Promise.all(
            population.map(async (genome) => ({
                genome,
                fitness: await this.evaluateFitness(genome)
            }))
        );
        
        // 排序
        evaluated.sort((a, b) => b.fitness - a.fitness);
        
        // 选择前50%
        const survivors = evaluated.slice(0, this.populationSize / 2);
        
        // 繁殖
        const nextGeneration = survivors.map(s => s.genome);
        
        while (nextGeneration.length < this.populationSize) {
            const parent1 = survivors[Math.floor(Math.random() * survivors.length)].genome;
            const parent2 = survivors[Math.floor(Math.random() * survivors.length)].genome;
            
            const child = this.crossover(parent1, parent2);
            this.mutate(child);
            
            nextGeneration.push(child);
        }
        
        return nextGeneration;
    }

    crossover(parent1, parent2) {
        const child = {};
        for (const key of Object.keys(parent1)) {
            child[key] = Math.random() < 0.5 ? parent1[key] : parent2[key];
        }
        return child;
    }

    mutate(genome) {
        for (const key of Object.keys(genome)) {
            if (Math.random() < this.mutationRate) {
                genome[key] += (Math.random() - 0.5) * 0.2;
                genome[key] = Math.max(0, Math.min(1, genome[key]));
            }
        }
    }

    async run() {
        let population = Array(this.populationSize)
            .fill(null)
            .map(() => this.createRandomGenome());
        
        for (let gen = 0; gen < this.generations; gen++) {
            population = await this.evolveGeneration(population);
            
            const best = await this.evaluateFitness(population[0]);
            console.log(`Generation ${gen}: Best fitness = ${best}`);
        }
        
        return population[0]; // 返回最佳AI
    }
}
```

---

## 五、实施计划

### Phase 1: 行为树 (Week 1)
- [ ] 实现行为树核心类
- [ ] 创建基础AI配置
- [ ] 迁移现有敌人AI

### Phase 2: 寻路 (Week 2)
- [ ] A* 寻路实现
- [ ] 流场寻路（群体）
- [ ] 障碍物动态更新

### Phase 3: 平衡系统 (Week 3)
- [ ] 战斗模拟器
- [ ] 批量测试工具
- [ ] 自动平衡调整

### Phase 4: AI进化 (Week 4)
- [ ] 遗传算法框架
- [ ] 适应度评估
- [ ] 参数优化

---

## 六、预期效果

| 指标 | 当前 | 目标 |
|------|------|------|
| AI智能度 | 基础 | 智能/策略性 |
| 平衡调整时间 | 数小时 | 数分钟 |
| 玩家挑战度 | 不稳定 | 稳定有趣 |
| 敌人多样性 | 低 | 高 |
