/**
 * MovementSystem - 移动系统
 * 处理所有实体的移动、物理和翻滚
 */

class MovementSystem {
    constructor(world) {
        this.world = world;
        this.priority = 10; // 较高优先级
        this.enabled = true;
    }
    
    init() {}
    
    update(dt) {
        const entities = this.world.getEntitiesWithComponents(
            TransformComponent,
            MovementComponent
        );
        
        for (const entity of entities) {
            this.processEntity(entity, dt);
        }
    }
    
    processEntity(entity, dt) {
        const transform = entity.get(TransformComponent);
        const movement = entity.get(MovementComponent);
        
        if (!movement || !transform) return;
        
        // 更新翻滚状态
        if (movement.isDashing) {
            movement.dashTimer -= dt;
            if (movement.dashTimer <= 0) {
                movement.isDashing = false;
                movement.dashInvincible = false;
                movement.dashCooldownTimer = movement.dashCooldown;
            }
        } else {
            // 更新翻滚冷却
            if (movement.dashCooldownTimer > 0) {
                movement.dashCooldownTimer -= dt;
            }
        }
        
        // 应用速度
        if (movement.isDashing) {
            // 翻滚时使用翻滚速度
            const dashVx = movement.direction.x * movement.dashSpeed;
            const dashVy = movement.direction.y * movement.dashSpeed;
            transform.x += dashVx * dt;
            transform.y += dashVy * dt;
        } else {
            // 正常移动
            transform.x += movement.vx * dt;
            transform.y += movement.vy * dt;
            
            // 应用摩擦力
            movement.vx *= movement.friction;
            movement.vy *= movement.friction;
            
            // 停止小速度
            if (Math.abs(movement.vx) < 1) movement.vx = 0;
            if (Math.abs(movement.vy) < 1) movement.vy = 0;
        }
        
        // 更新移动状态
        movement.isMoving = Math.abs(movement.vx) > 0.1 || Math.abs(movement.vy) > 0.1;
        
        // 更新朝向（如果正在移动）
        if (movement.isMoving && !movement.isDashing) {
            const speed = Math.sqrt(movement.vx * movement.vx + movement.vy * movement.vy);
            if (speed > 0) {
                movement.direction.x = movement.vx / speed;
                movement.direction.y = movement.vy / speed;
                transform.rotation = Math.atan2(movement.direction.y, movement.direction.x);
            }
        }
    }
    
    /**
     * 触发翻滚
     */
    startDash(entity) {
        const movement = entity.get(MovementComponent);
        if (!movement || movement.isDashing || movement.dashCooldownTimer > 0) {
            return false;
        }
        
        movement.isDashing = true;
        movement.dashTimer = movement.dashDuration;
        movement.dashInvincible = true;
        
        return true;
    }
    
    /**
     * 设置移动输入
     */
    setInput(entity, dx, dy) {
        const movement = entity.get(MovementComponent);
        if (!movement || movement.isDashing) return;
        
        // 归一化输入
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            dx /= length;
            dy /= length;
            
            // 应用加速度
            movement.vx += dx * movement.acceleration * 0.016;
            movement.vy += dy * movement.acceleration * 0.016;
            
            // 限制最大速度
            const speed = Math.sqrt(movement.vx * movement.vx + movement.vy * movement.vy);
            if (speed > movement.maxSpeed) {
                movement.vx = (movement.vx / speed) * movement.maxSpeed;
                movement.vy = (movement.vy / speed) * movement.maxSpeed;
            }
        }
    }
    
    destroy() {}
}

window.MovementSystem = MovementSystem;
