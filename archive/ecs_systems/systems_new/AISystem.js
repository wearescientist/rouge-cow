/**
 * AISystem - AI 系统
 * 处理敌人的 AI 行为：追踪、攻击、巡逻
 */

class AISystem {
    constructor(world) {
        this.world = world;
        this.priority = 35;
        this.enabled = true;
        
        this.decisionTimer = 0;
        this.decisionInterval = 0.5; // AI 决策间隔
    }
    
    init() {}
    
    update(dt) {
        this.decisionTimer += dt;
        
        const enemies = this.world.getEntitiesWithTag('enemy');
        
        for (const enemy of enemies) {
            this.processAI(enemy, dt);
        }
    }
    
    processAI(enemy, dt) {
        const ai = enemy.get(AIComponent);
        const enemyComp = enemy.get(EnemyComponent);
        const transform = enemy.get(TransformComponent);
        const movement = enemy.get(MovementComponent);
        const combat = enemy.get(CombatComponent);
        
        if (!ai || !transform || !movement) return;
        
        // 查找目标（玩家）
        if (!ai.targetEntity || !ai.targetEntity.active) {
            ai.targetEntity = this.findTarget(enemy);
        }
        
        const target = ai.targetEntity;
        
        if (!target) {
            // 没有目标，巡逻或待机
            this.patrol(enemy, dt);
            return;
        }
        
        const targetTransform = target.get(TransformComponent);
        if (!targetTransform) return;
        
        // 计算距离
        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 检查是否在仇恨范围内
        const aggroRange = enemyComp ? enemyComp.aggroRange : 300;
        
        if (dist > aggroRange && ai.currentState !== 'chase') {
            // 丢失目标，返回巡逻
            ai.targetEntity = null;
            ai.currentState = 'idle';
            this.patrol(enemy, dt);
            return;
        }
        
        // 状态机
        switch (ai.currentState) {
            case 'idle':
                if (dist <= aggroRange) {
                    ai.currentState = 'chase';
                }
                break;
                
            case 'chase':
                this.chase(enemy, target, dist, dt);
                
                // 检查攻击范围
                const attackRange = combat ? combat.attackRange : 50;
                if (dist <= attackRange) {
                    ai.currentState = 'attack';
                }
                break;
                
            case 'attack':
                this.attack(enemy, target, dist, dt);
                
                // 目标离开攻击范围
                const attackRangeExit = (combat ? combat.attackRange : 50) * 1.5;
                if (dist > attackRangeExit) {
                    ai.currentState = 'chase';
                }
                break;
                
            case 'flee':
                this.flee(enemy, target, dt);
                break;
        }
    }
    
    findTarget(enemy) {
        // 找最近的玩家
        const players = this.world.getEntitiesWithTag('player');
        let nearest = null;
        let nearestDist = Infinity;
        
        const enemyTransform = enemy.get(TransformComponent);
        if (!enemyTransform) return null;
        
        for (const player of players) {
            const playerTransform = player.get(TransformComponent);
            if (!playerTransform) continue;
            
            const dx = playerTransform.x - enemyTransform.x;
            const dy = playerTransform.y - enemyTransform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = player;
            }
        }
        
        return nearest;
    }
    
    chase(enemy, target, dist, dt) {
        const transform = enemy.get(TransformComponent);
        const movement = enemy.get(MovementComponent);
        const targetTransform = target.get(TransformComponent);
        
        if (!transform || !movement || !targetTransform) return;
        
        // 计算方向
        const dx = targetTransform.x - transform.x;
        const dy = targetTransform.y - transform.y;
        
        // 归一化
        if (dist > 0) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            // 设置速度
            movement.vx = dirX * movement.speed;
            movement.vy = dirY * movement.speed;
            movement.direction.x = dirX;
            movement.direction.y = dirY;
        }
    }
    
    attack(enemy, target, dist, dt) {
        const combat = enemy.get(CombatComponent);
        const movement = enemy.get(MovementComponent);
        
        if (!combat) return;
        
        // 停止移动
        if (movement) {
            movement.vx *= 0.5;
            movement.vy *= 0.5;
        }
        
        // 攻击冷却
        if (combat.attackTimer > 0) {
            combat.attackTimer -= dt;
            return;
        }
        
        // 执行攻击
        const targetTransform = target.get(TransformComponent);
        if (targetTransform) {
            const combatSystem = this.world.getSystem(CombatSystem);
            if (combatSystem) {
                combatSystem.dealDamage(enemy, target, combat.attackDamage);
            }
            
            combat.attackTimer = combat.attackCooldown;
            combat.isAttacking = true;
        }
    }
    
    flee(enemy, target, dt) {
        const transform = enemy.get(TransformComponent);
        const movement = enemy.get(MovementComponent);
        const targetTransform = target.get(TransformComponent);
        
        if (!transform || !movement || !targetTransform) return;
        
        // 远离目标
        const dx = transform.x - targetTransform.x;
        const dy = transform.y - targetTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            movement.vx = dirX * movement.speed * 1.5; // 逃跑更快
            movement.vy = dirY * movement.speed * 1.5;
        }
    }
    
    patrol(enemy, dt) {
        const ai = enemy.get(AIComponent);
        const movement = enemy.get(MovementComponent);
        
        if (!ai || !movement) return;
        
        if (ai.patrolPoints.length === 0) {
            // 随机巡逻
            if (Math.random() < 0.02) {
                const angle = Math.random() * Math.PI * 2;
                movement.vx = Math.cos(angle) * movement.speed * 0.3;
                movement.vy = Math.sin(angle) * movement.speed * 0.3;
            }
        } else {
            // 沿巡逻点移动
            const targetPoint = ai.patrolPoints[ai.patrolIndex];
            const transform = enemy.get(TransformComponent);
            
            if (transform) {
                const dx = targetPoint.x - transform.x;
                const dy = targetPoint.y - transform.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 10) {
                    // 到达巡逻点，前往下一个
                    ai.patrolIndex = (ai.patrolIndex + 1) % ai.patrolPoints.length;
                } else {
                    // 向巡逻点移动
                    movement.vx = (dx / dist) * movement.speed * 0.5;
                    movement.vy = (dy / dist) * movement.speed * 0.5;
                }
            }
        }
    }
    
    /**
     * 设置 AI 状态
     */
    setState(enemy, state) {
        const ai = enemy.get(AIComponent);
        if (ai) {
            ai.currentState = state;
        }
    }
    
    destroy() {}
}

window.AISystem = AISystem;
