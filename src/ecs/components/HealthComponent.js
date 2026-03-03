/**
 * HealthComponent - 生命组件
 * 管理实体的生命值
 * v0.23
 */

class HealthComponent extends Component {
    constructor(maxHP = 100) {
        super();
        this.maxHP = maxHP;
        this.currentHP = maxHP;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        
        // 事件监听
        this.onDamage = null;
        this.onHeal = null;
        this.onDeath = null;
    }

    takeDamage(amount, source = null) {
        if (this.invulnerable || this.currentHP <= 0) return 0;
        
        const actual = Math.min(this.currentHP, amount);
        this.currentHP -= actual;
        
        if (this.onDamage) {
            this.onDamage(actual, source);
        }
        
        if (this.currentHP <= 0) {
            this.die(source);
        }
        
        return actual;
    }

    heal(amount) {
        if (this.currentHP <= 0) return 0;
        
        const actual = Math.min(amount, this.maxHP - this.currentHP);
        this.currentHP += actual;
        
        if (this.onHeal) {
            this.onHeal(actual);
        }
        
        return actual;
    }

    setInvulnerable(duration) {
        this.invulnerable = true;
        this.invulnerableTime = duration;
    }

    update(dt) {
        if (this.invulnerableTime > 0) {
            this.invulnerableTime -= dt;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }
    }

    die(source = null) {
        this.currentHP = 0;
        if (this.onDeath) {
            this.onDeath(source);
        }
    }

    isDead() {
        return this.currentHP <= 0;
    }

    getHealthPercent() {
        return this.currentHP / this.maxHP;
    }

    reset() {
        this.currentHP = this.maxHP;
        this.invulnerable = false;
        this.invulnerableTime = 0;
    }

    serialize() {
        return {
            maxHP: this.maxHP,
            currentHP: this.currentHP,
            invulnerable: this.invulnerable
        };
    }

    deserialize(data) {
        this.maxHP = data.maxHP || 100;
        this.currentHP = data.currentHP || this.maxHP;
        this.invulnerable = data.invulnerable || false;
    }
}

window.HealthComponent = HealthComponent;
