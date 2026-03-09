/**
 * AnimationSystem - 动画系统
 * 管理精灵动画、状态切换、混合动画
 */

class AnimationSystem {
    constructor(world) {
        this.world = world;
        this.priority = 45;
        this.enabled = true;
        
        // 动画状态机配置
        this.animations = new Map();
        
        // 默认动画配置
        this.defaultAnimations = {
            player: {
                idle: { frames: 4, speed: 0.2, loop: true },
                walk: { frames: 8, speed: 0.1, loop: true },
                attack: { frames: 6, speed: 0.05, loop: false },
                dash: { frames: 4, speed: 0.05, loop: false },
                hurt: { frames: 2, speed: 0.1, loop: false },
                death: { frames: 6, speed: 0.1, loop: false }
            },
            enemy: {
                idle: { frames: 4, speed: 0.25, loop: true },
                walk: { frames: 6, speed: 0.15, loop: true },
                attack: { frames: 5, speed: 0.08, loop: false },
                hurt: { frames: 2, speed: 0.1, loop: false },
                death: { frames: 4, speed: 0.1, loop: false }
            }
        };
    }
    
    init() {
        // 监听事件来触发动画
        this.world.on('entityStateChanged', (data) => {
            this.onStateChanged(data.entity, data.newState);
        });
    }
    
    update(dt) {
        const entities = this.world.getEntitiesWithComponents(SpriteComponent);
        
        for (const entity of entities) {
            const sprite = entity.get(SpriteComponent);
            if (!sprite || !sprite.currentAnimation) continue;
            
            this.updateAnimation(entity, sprite, dt);
        }
    }
    
    /**
     * 更新动画
     */
    updateAnimation(entity, sprite, dt) {
        const anim = sprite.animations[sprite.currentAnimation];
        if (!anim) return;
        
        // 更新动画计时器
        sprite.animationTimer += dt * sprite.animationSpeed;
        
        // 计算当前帧
        const frameDuration = 1 / anim.speed;
        const totalDuration = frameDuration * anim.frames;
        
        if (sprite.animationTimer >= totalDuration) {
            if (anim.loop) {
                // 循环动画
                sprite.animationTimer = sprite.animationTimer % totalDuration;
            } else {
                // 非循环动画，停留在最后一帧
                sprite.animationTimer = totalDuration - 0.001;
                
                // 触发动画完成事件
                if (!anim.onCompleteCalled) {
                    anim.onCompleteCalled = true;
                    this.onAnimationComplete(entity, sprite.currentAnimation);
                }
            }
        }
        
        // 计算帧索引
        sprite.frameIndex = Math.floor(sprite.animationTimer / frameDuration);
        sprite.frameIndex = Math.min(sprite.frameIndex, anim.frames - 1);
    }
    
    /**
     * 播放动画
     */
    playAnimation(entity, animationName, options = {}) {
        const sprite = entity.get(SpriteComponent);
        if (!sprite) return false;
        
        // 检查动画是否存在
        if (!sprite.animations[animationName]) {
            // 使用默认动画配置
            const entityType = entity.hasTag('player') ? 'player' : 'enemy';
            const defaultConfig = this.defaultAnimations[entityType]?.[animationName];
            
            if (defaultConfig) {
                sprite.animations[animationName] = { ...defaultConfig };
            } else {
                return false;
            }
        }
        
        // 如果是相同动画且不允许重启，则跳过
        if (sprite.currentAnimation === animationName && !options.force) {
            return false;
        }
        
        // 切换动画
        sprite.currentAnimation = animationName;
        sprite.animationTimer = 0;
        sprite.frameIndex = 0;
        sprite.animationSpeed = options.speed || 1;
        
        // 重置完成标记
        const anim = sprite.animations[animationName];
        if (anim) {
            anim.onCompleteCalled = false;
        }
        
        return true;
    }
    
    /**
     * 根据状态自动播放对应动画
     */
    onStateChanged(entity, newState) {
        const stateToAnim = {
            'idle': 'idle',
            'walking': 'walk',
            'running': 'walk',
            'attacking': 'attack',
            'dashing': 'dash',
            'hurt': 'hurt',
            'dead': 'death'
        };
        
        const animName = stateToAnim[newState];
        if (animName) {
            this.playAnimation(entity, animName);
        }
    }
    
    /**
     * 动画完成回调
     */
    onAnimationComplete(entity, animationName) {
        // 根据动画类型决定后续动作
        switch (animationName) {
            case 'attack':
                // 攻击完成后回到待机或行走
                const movement = entity.get(MovementComponent);
                if (movement && movement.isMoving) {
                    this.playAnimation(entity, 'walk');
                } else {
                    this.playAnimation(entity, 'idle');
                }
                break;
                
            case 'dash':
                // 翻滚完成后恢复正常
                const move = entity.get(MovementComponent);
                if (move && move.isMoving) {
                    this.playAnimation(entity, 'walk');
                } else {
                    this.playAnimation(entity, 'idle');
                }
                break;
                
            case 'hurt':
                // 受伤完成后恢复
                const health = entity.get(HealthComponent);
                if (health && health.currentHealth > 0) {
                    const moveComp = entity.get(MovementComponent);
                    if (moveComp && moveComp.isMoving) {
                        this.playAnimation(entity, 'walk');
                    } else {
                        this.playAnimation(entity, 'idle');
                    }
                }
                break;
                
            case 'death':
                // 死亡动画完成，可以销毁实体或显示尸体
                this.world.emit('deathAnimationComplete', entity);
                break;
        }
    }
    
    /**
     * 获取当前动画进度 (0-1)
     */
    getAnimationProgress(entity) {
        const sprite = entity.get(SpriteComponent);
        if (!sprite || !sprite.currentAnimation) return 0;
        
        const anim = sprite.animations[sprite.currentAnimation];
        if (!anim) return 0;
        
        const frameDuration = 1 / anim.speed;
        const totalDuration = frameDuration * anim.frames;
        
        return Math.min(1, sprite.animationTimer / totalDuration);
    }
    
    /**
     * 检查动画是否正在播放
     */
    isPlaying(entity, animationName) {
        const sprite = entity.get(SpriteComponent);
        return sprite && sprite.currentAnimation === animationName;
    }
    
    /**
     * 检查动画是否完成
     */
    isComplete(entity) {
        const sprite = entity.get(SpriteComponent);
        if (!sprite || !sprite.currentAnimation) return true;
        
        const anim = sprite.animations[sprite.currentAnimation];
        if (!anim || anim.loop) return false;
        
        return anim.onCompleteCalled;
    }
    
    /**
     * 暂停动画
     */
    pause(entity) {
        const sprite = entity.get(SpriteComponent);
        if (sprite) {
            sprite.animationSpeed = 0;
        }
    }
    
    /**
     * 恢复动画
     */
    resume(entity) {
        const sprite = entity.get(SpriteComponent);
        if (sprite) {
            sprite.animationSpeed = 1;
        }
    }
    
    /**
     * 设置动画速度
     */
    setSpeed(entity, speed) {
        const sprite = entity.get(SpriteComponent);
        if (sprite) {
            sprite.animationSpeed = speed;
        }
    }
    
    destroy() {}
}

window.AnimationSystem = AnimationSystem;
