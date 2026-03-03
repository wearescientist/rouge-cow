/**
 * EnemyAI - 敌人AI系统
 * 基于行为树的数据驱动AI
 * v0.23
 */

class EnemyAI {
    constructor(enemy) {
        this.enemy = enemy;
        this.behaviorTree = null;
        this.context = {
            enemy: enemy,
            player: null,
            dt: 0,
            distanceToPlayer: Infinity,
            canSeePlayer: false,
            lastAttackTime: 0
        };
        
        this.buildBehaviorTree();
    }

    /**
     * 构建行为树
     */
    buildBehaviorTree() {
        const config = this.enemy.aiConfig || this.getDefaultAIConfig();
        
        this.behaviorTree = new Selector([
            // 死亡检查
            new Condition(ctx => ctx.enemy.hp <= 0),
            
            // 眩晕检查
            new Sequence([
                new Condition(ctx => ctx.enemy.isStunned),
                new Action(ctx => this.handleStun(ctx))
            ]),
            
            // 受击反应
            new Sequence([
                new Condition(ctx => ctx.enemy.wasHitRecently),
                new Condition(ctx => Math.random() < (ctx.enemy.aiConfig?.reactionChance || 0.3)),
                new Action(ctx => this.handleHitReaction(ctx))
            ]),
            
            // 战斗行为
            new Sequence([
                new Condition(ctx => ctx.distanceToPlayer < (ctx.enemy.aiConfig?.attackRange || 50)),
                new Action(ctx => this.handleCombat(ctx))
            ]),
            
            // 追击行为
            new Sequence([
                new Condition(ctx => ctx.canSeePlayer),
                new Action(ctx => this.handleChase(ctx))
            ]),
            
            // 待机/巡逻
            new Action(ctx => this.handleIdle(ctx))
        ]);
    }

    /**
     * 更新AI
     */
    update(dt, player) {
        this.context.dt = dt;
        this.context.player = player;
        this.context.distanceToPlayer = this.calculateDistanceToPlayer(player);
        this.context.canSeePlayer = this.checkLineOfSight(player);
        
        if (this.behaviorTree) {
            this.behaviorTree.tick(this.context);
        }
    }

    /**
     * 计算与玩家的距离
     */
    calculateDistanceToPlayer(player) {
        const dx = this.enemy.x - player.x;
        const dy = this.enemy.y - player.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 检查视线
     */
    checkLineOfSight(player) {
        const sightRange = this.enemy.aiConfig?.sightRange || 200;
        if (this.context.distanceToPlayer > sightRange) return false;
        
        // TODO: 射线检测障碍物
        return true;
    }

    /**
     * 处理眩晕
     */
    handleStun(ctx) {
        ctx.enemy.stunTimer -= ctx.dt;
        if (ctx.enemy.stunTimer <= 0) {
            ctx.enemy.isStunned = false;
        }
        return NodeStatus.SUCCESS;
    }

    /**
     * 处理受击反应
     */
    handleHitReaction(ctx) {
        const reactions = ctx.enemy.aiConfig?.onHitReactions || ['none'];
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];
        
        switch (reaction) {
            case 'retreat':
                this.moveAwayFromPlayer();
                break;
            case 'counter':
                this.tryAttack();
                break;
            case 'enrage':
                ctx.enemy.damageMultiplier *= 1.5;
                break;
        }
        
        ctx.enemy.wasHitRecently = false;
        return NodeStatus.SUCCESS;
    }

    /**
     * 处理战斗
     */
    handleCombat(ctx) {
        const config = ctx.enemy.aiConfig;
        const now = Date.now();
        
        // 检查攻击冷却
        if (now - ctx.lastAttackTime < (config?.attackCooldown || 1000)) {
            return NodeStatus.RUNNING;
        }
        
        // 选择技能
        const skill = this.selectSkill();
        
        if (skill) {
            this.executeSkill(skill);
            ctx.lastAttackTime = now;
            return NodeStatus.SUCCESS;
        }
        
        return NodeStatus.FAILURE;
    }

    /**
     * 处理追击
     */
    handleChase(ctx) {
        const config = ctx.enemy.aiConfig;
        
        // 检查是否失去兴趣
        if (ctx.distanceToPlayer > (config?.loseInterestRange || 300)) {
            return NodeStatus.FAILURE;
        }
        
        // 使用技能追击
        if (config?.chaseSkills) {
            for (const skillName of config.chaseSkills) {
                if (this.canUseSkill(skillName)) {
                    return this.executeSkill(skillName) ? NodeStatus.SUCCESS : NodeStatus.RUNNING;
                }
            }
        }
        
        // 普通追击
        this.moveTowardsPlayer();
        return NodeStatus.RUNNING;
    }

    /**
     * 处理待机
     */
    handleIdle(ctx) {
        const config = ctx.enemy.aiConfig;
        
        // 巡逻
        if (config?.patrolRadius > 0) {
            this.patrol();
        }
        
        return NodeStatus.RUNNING;
    }

    /**
     * 选择技能
     */
    selectSkill() {
        const config = this.enemy.aiConfig;
        const skills = config?.skills || [];
        
        if (skills.length === 0) return null;
        
        // 优先选择可用的技能
        const availableSkills = skills.filter(s => this.canUseSkill(s));
        
        if (availableSkills.length === 0) return null;
        
        // 随机选择
        return availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }

    /**
     * 检查能否使用技能
     */
    canUseSkill(skillName) {
        const skill = this.enemy.skills?.[skillName];
        if (!skill) return false;
        
        return skill.cooldownRemaining <= 0;
    }

    /**
     * 执行技能
     */
    executeSkill(skillName) {
        const skill = this.enemy.skills?.[skillName];
        if (!skill) return false;
        
        skill.execute(this.enemy, this.context.player);
        skill.cooldownRemaining = skill.cooldown;
        
        return true;
    }

    /**
     * 移向玩家
     */
    moveTowardsPlayer() {
        const player = this.context.player;
        const speed = this.enemy.speed;
        
        const dx = player.x - this.enemy.x;
        const dy = player.y - this.enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.enemy.vx = (dx / dist) * speed;
            this.enemy.vy = (dy / dist) * speed;
        }
    }

    /**
     * 远离玩家
     */
    moveAwayFromPlayer() {
        const player = this.context.player;
        const speed = this.enemy.speed * 1.2;
        
        const dx = this.enemy.x - player.x;
        const dy = this.enemy.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.enemy.vx = (dx / dist) * speed;
            this.enemy.vy = (dy / dist) * speed;
        }
    }

    /**
     * 巡逻
     */
    patrol() {
        // 简单的巡逻逻辑
        if (!this.patrolTarget || this.distanceTo(this.patrolTarget) < 10) {
            // 选择新的巡逻点
            const config = this.enemy.aiConfig;
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * config.patrolRadius;
            
            this.patrolTarget = {
                x: this.enemy.spawnX + Math.cos(angle) * radius,
                y: this.enemy.spawnY + Math.sin(angle) * radius
            };
        }
        
        // 移向巡逻点
        const dx = this.patrolTarget.x - this.enemy.x;
        const dy = this.patrolTarget.y - this.enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.enemy.vx = (dx / dist) * this.enemy.speed * 0.5;
            this.enemy.vy = (dy / dist) * this.enemy.speed * 0.5;
        }
    }

    /**
     * 尝试攻击
     */
    tryAttack() {
        return this.handleCombat(this.context);
    }

    /**
     * 计算距离
     */
    distanceTo(target) {
        const dx = this.enemy.x - target.x;
        const dy = this.enemy.y - target.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 获取默认AI配置
     */
    getDefaultAIConfig() {
        return {
            behavior: 'chase',
            sightRange: 200,
            attackRange: 40,
            loseInterestRange: 300,
            attackCooldown: 1000,
            reactionChance: 0.3,
            skills: ['attack']
        };
    }
}

window.EnemyAI = EnemyAI;
