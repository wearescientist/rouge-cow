/**
 * SynergySystem - 道具连携系统
 * 道具组合产生额外效果
 */

class SynergySystem {
    constructor(world) {
        this.world = world;
        this.priority = 46; // CraftingSystem之后
        this.enabled = true;
        
        // 连携配方
        this.synergies = new Map();
        
        // 玩家激活的连携
        this.activeSynergies = new Map(); // playerId -> Set<synergyKey>
        
        this.initSynergies();
    }
    
    init() {
        // 监听被动道具变化
        this.world.on('passiveChanged', (data) => {
            this.checkSynergies(data.player);
        });
        
        // 监听道具拾取
        this.world.on('itemPickedUp', (data) => {
            if (data.player) {
                this.checkSynergies(data.player);
            }
        });
    }
    
    /**
     * 初始化连携配方
     */
    initSynergies() {
        // ===== 元素连携 =====
        
        // 燃烧地狱：火焰附魔 + 爆炸弹药
        this.synergies.set('burning_hell', {
            name: '燃烧地狱',
            description: '攻击附带燃烧，死亡时爆炸',
            icon: '🔥',
            required: ['fire_enchantment', 'explosive_rounds'],
            effects: {
                burnDamage: 20,
                burnDuration: 5,
                deathExplosion: true,
                explosionRadius: 100,
                explosionDamage: 50
            },
            onActivate: (player) => {
                console.log('激活: 燃烧地狱');
            }
        });
        
        // 冰霜领域：冰霜附魔 + 冰冻炸弹
        this.synergies.set('frost_domain', {
            name: '冰霜领域',
            description: '冰冻范围×2，被冰冻敌人易碎+50%伤害',
            icon: '❄️',
            required: ['ice_enchantment', 'ice_bomb'],
            effects: {
                freezeRangeMultiplier: 2,
                shatteredDamage: 0.5,
                slowAura: true,
                auraRadius: 150,
                auraSlow: 0.3
            }
        });
        
        // 雷电风暴：闪电附魔 + 连锁闪电棒
        this.synergies.set('thunder_storm', {
            name: '雷电风暴',
            description: '连锁次数+5，每次弹射伤害不减',
            icon: '⚡',
            required: ['lightning_enchantment', 'chain_lightning_rod'],
            effects: {
                chainBonus: 5,
                noChainDecay: true,
                stormChance: 0.1, // 10%召唤落雷
                stormDamage: 100
            }
        });
        
        // 元素大师：同时拥有火+冰+电
        this.synergies.set('elemental_master', {
            name: '元素大师',
            description: '所有元素伤害+100%，攻击随机附加一种元素',
            icon: '🌟',
            required: ['fire_enchantment', 'ice_enchantment', 'lightning_enchantment'],
            effects: {
                elementalDamageBonus: 1.0,
                randomElementProc: true,
                elementDamage: 30
            }
        });
        
        // ===== 生存连携 =====
        
        // 永生者：再生戒指 + 吸血鬼之牙 + 凤凰羽毛
        this.synergies.set('immortal', {
            name: '永生者',
            description: '每秒恢复5%生命，复活次数+1',
            icon: '♾️',
            required: ['regeneration_ring', 'vampire_fang', 'phoenix_feather'],
            effects: {
                regenPercent: 0.05,
                extraRevive: 1,
                reviveHealthPercent: 1.0
            }
        });
        
        // 钢铁之躯：装甲板 + 荆棘护甲 + 护盾发生器
        this.synergies.set('iron_body', {
            name: '钢铁之躯',
            description: '护甲+20，受到伤害反弹100%，护盾恢复速度×2',
            icon: '🛡️',
            required: ['armor_plate', 'thorn_armor', 'barrier_generator'],
            effects: {
                armorBonus: 20,
                thornReflect: 1.0,
                shieldRechargeMultiplier: 2
            }
        });
        
        // ===== 攻击连携 =====
        
        // 狂战士：狂战士之血 + 痛苦之力 + 背水一战
        this.synergies.set('berserker', {
            name: '狂战士',
            description: '生命低于30%时，伤害+300%，攻速+100%，移速+50%',
            icon: '😤',
            required: ['berserk_blood', 'pain_for_power', 'last_stand'],
            effects: {
                berserkHealthThreshold: 0.3,
                berserkDamage: 3.0,
                berserkAttackSpeed: 1.0,
                berserkMoveSpeed: 0.5
            }
        });
        
        // 狙击手：狙击镜片 + 暴击戒指 + 暴伤手镯
        this.synergies.set('sniper', {
            name: '狙击手',
            description: '距离越远伤害越高（最多+500%），暴击率+30%',
            icon: '🎯',
            required: ['sniper_lens', 'critical_ring', 'critical_damage_bracelet'],
            effects: {
                sniperMaxBonus: 5.0,
                sniperRange: 800,
                criticalChanceBonus: 0.3,
                headshotChance: 0.1 // 10%爆头即死
            }
        });
        
        // 召唤师：死灵法典 + 宠物伙伴 + 克隆投影器
        this.synergies.set('summoner', {
            name: '召唤师',
            description: '召唤物伤害+100%，可同时存在+3个召唤物',
            icon: '👥',
            required: ['necromancy_tome', 'pet_companion', 'clone_projector'],
            effects: {
                minionDamageBonus: 1.0,
                minionCountBonus: 3,
                minionHealthBonus: 0.5
            }
        });
        
        // ===== 特殊连携 =====
        
        // 炼金术士：炼金知识 + 毒液涂层 + 变异药水
        this.synergies.set('alchemist', {
            name: '炼金术士',
            description: '药水效果+100%，持续时间+50%，攻击附带随机药水效果',
            icon: '⚗️',
            required: ['alchemy_knowledge', 'poison_coating', 'mutation_potion'],
            effects: {
                potionEffectMultiplier: 2.0,
                potionDurationMultiplier: 1.5,
                randomPotionProc: 0.15
            }
        });
        
        // 幸运儿：幸运币 + 双倍经验护符 + 富人印章
        this.synergies.set('lucky_one', {
            name: '幸运儿',
            description: '掉宝率+50%，宝箱房出现率+30%，商店免费刷新一次',
            icon: '🍀',
            required: ['lucky_coin', 'double_exp_charm', 'rich_man_signet'],
            effects: {
                dropRateBonus: 0.5,
                chestRoomChance: 0.3,
                freeRefresh: true,
                criticalGoldChance: 0.1 // 10%金币暴击×10
            }
        });
        
        // 时空行者：时间膨胀装置 + 紧急召回 + 超频芯片
        this.synergies.set('time_walker', {
            name: '时空行者',
            description: '敌人减速40%，技能冷却-40%，濒死时时间停止5秒',
            icon: '⌛',
            required: ['time_dilation_device', 'emergency_recall', 'overclock_chip'],
            effects: {
                timeSlow: 0.4,
                cooldownReduction: 0.4,
                deathTimeStop: 5
            }
        });
        
        // 特斯拉线圈：雷电权杖 + 连锁闪电棒 + 雷电风暴连携
        this.synergies.set('tesla_coil', {
            name: '特斯拉线圈',
            description: '永久雷电光环，每秒对周围敌人造成50伤害',
            icon: '⚡',
            required: ['lightningRod', 'chain_lightning_rod'],
            requiresSynergy: 'thunder_storm',
            effects: {
                lightningAura: true,
                auraDamage: 50,
                auraRadius: 200
            }
        });
        
        // 吸血鬼之王：吸血鬼之牙 + 吸血护盾 + 血刃 + 血金契约
        this.synergies.set('vampire_lord', {
            name: '吸血鬼之王',
            description: '生命偷取+30%，生命上限+100%，过量治疗转化为护盾',
            icon: '🧛',
            required: ['vampire_fang', 'vampiric_shield', 'blood_blade', 'health_for_gold'],
            effects: {
                lifeStealBonus: 0.3,
                healthCapBonus: 1.0,
                overHealToShield: true,
                healOnKill: 20
            }
        });
        
        // 神射手：多重射击 + 穿透箭矢 + 瞄准辅助 + 弹射射击
        this.synergies.set('god_archer', {
            name: '神射手',
            description: '投射物数量+3，穿透+5，自动追踪，弹射3次',
            icon: '🏹',
            required: ['multishot_charm', 'piercing_arrow', 'aim_assist', 'ricochet_shots'],
            effects: {
                projectileBonus: 3,
                pierceBonus: 5,
                autoAim: true,
                ricochetBonus: 3
            }
        });
        
        // 终极连携：同时拥有5个以上连携
        this.synergies.set('ultimate_synergy', {
            name: '万物归一',
            description: '所有属性+100%，获得所有元素效果',
            icon: '👑',
            specialCondition: (player, system) => {
                const playerSynergies = system.activeSynergies.get(player.id);
                return playerSynergies && playerSynergies.size >= 5;
            },
            effects: {
                allStatsBonus: 1.0,
                allElements: true,
                godMode: true
            }
        });
    }
    
    /**
     * 检查玩家可激活的连携
     */
    checkSynergies(player) {
        const playerComp = player.get(PlayerComponent);
        if (!playerComp) return;
        
        const passives = playerComp.passives || [];
        const passiveIds = new Set(passives.map(p => p.id));
        
        const activated = new Set();
        
        // 检查每个连携
        for (const [key, synergy] of this.synergies) {
            // 特殊条件连携
            if (synergy.specialCondition) {
                if (synergy.specialCondition(player, this)) {
                    activated.add(key);
                }
                continue;
            }
            
            // 需要其他连携作为前提
            if (synergy.requiresSynergy) {
                const currentSynergies = this.activeSynergies.get(player.id) || new Set();
                if (!currentSynergies.has(synergy.requiresSynergy)) {
                    continue;
                }
            }
            
            // 检查是否有所需道具
            const hasAll = synergy.required.every(req => passiveIds.has(req));
            if (hasAll) {
                activated.add(key);
            }
        }
        
        // 更新激活状态
        const previous = this.activeSynergies.get(player.id) || new Set();
        
        // 找出新激活的
        for (const key of activated) {
            if (!previous.has(key)) {
                this.activateSynergy(player, key);
            }
        }
        
        // 找出失效的
        for (const key of previous) {
            if (!activated.has(key)) {
                this.deactivateSynergy(player, key);
            }
        }
        
        this.activeSynergies.set(player.id, activated);
    }
    
    /**
     * 激活连携
     */
    activateSynergy(player, key) {
        const synergy = this.synergies.get(key);
        if (!synergy) return;
        
        console.log(`激活连携: ${synergy.name}`);
        
        // 应用效果
        this.applySynergyEffects(player, synergy);
        
        // 发送事件
        this.world.emit('synergyActivated', {
            player,
            synergy: {
                key,
                name: synergy.name,
                description: synergy.description,
                icon: synergy.icon
            }
        });
        
        // 执行自定义激活逻辑
        if (synergy.onActivate) {
            synergy.onActivate(player);
        }
    }
    
    /**
     * 失效连携
     */
    deactivateSynergy(player, key) {
        const synergy = this.synergies.get(key);
        if (!synergy) return;
        
        console.log(`失效连携: ${synergy.name}`);
        
        // 移除效果
        this.removeSynergyEffects(player, synergy);
        
        this.world.emit('synergyDeactivated', {
            player,
            synergy: {
                key,
                name: synergy.name
            }
        });
    }
    
    /**
     * 应用连携效果
     */
    applySynergyEffects(player, synergy) {
        const effects = synergy.effects;
        if (!effects) return;
        
        // 存储效果到玩家组件
        let synergyEffects = player.getComponent('SynergyEffects');
        if (!synergyEffects) {
            synergyEffects = { active: {} };
            player.add({ type: 'SynergyEffects', ...synergyEffects });
        }
        
        synergyEffects.active[synergy.name] = effects;
        
        // 应用各种效果...
        this.applyCombatEffects(player, effects);
        this.applyDefenseEffects(player, effects);
        this.applyUtilityEffects(player, effects);
    }
    
    /**
     * 移除连携效果
     */
    removeSynergyEffects(player, synergy) {
        const synergyEffects = player.getComponent('SynergyEffects');
        if (synergyEffects && synergyEffects.active) {
            delete synergyEffects.active[synergy.name];
        }
    }
    
    /**
     * 应用战斗效果
     */
    applyCombatEffects(player, effects) {
        const weapon = player.get(WeaponComponent);
        const combat = player.get(CombatComponent);
        
        if (!weapon && !combat) return;
        
        // 伤害加成
        if (effects.damageBonus && weapon) {
            weapon.damage *= (1 + effects.damageBonus);
        }
        
        // 攻击速度
        if (effects.attackSpeedBonus && weapon) {
            weapon.attackSpeed *= (1 + effects.attackSpeedBonus);
        }
        
        // 暴击加成
        if (effects.criticalChanceBonus && weapon) {
            weapon.criticalChance = Math.min(1, weapon.criticalChance + effects.criticalChanceBonus);
        }
        
        // 元素伤害
        if (effects.elementalDamageBonus && combat) {
            combat.elementalDamageBonus = (combat.elementalDamageBonus || 0) + effects.elementalDamageBonus;
        }
    }
    
    /**
     * 应用防御效果
     */
    applyDefenseEffects(player, effects) {
        const health = player.get(HealthComponent);
        
        if (!health) return;
        
        // 护甲加成
        if (effects.armorBonus) {
            health.armor += effects.armorBonus;
        }
        
        // 生命上限
        if (effects.healthCapBonus) {
            const bonus = health.maxHealth * effects.healthCapBonus;
            health.maxHealth += bonus;
            health.currentHealth += bonus;
        }
    }
    
    /**
     * 应用实用效果
     */
    applyUtilityEffects(player, effects) {
        const playerComp = player.get(PlayerComponent);
        
        if (!playerComp) return;
        
        // 移速加成
        if (effects.moveSpeedBonus) {
            const movement = player.get(MovementComponent);
            if (movement) {
                movement.speed *= (1 + effects.moveSpeedBonus);
            }
        }
        
        // 冷却缩减
        if (effects.cooldownReduction) {
            playerComp.cooldownReduction = (playerComp.cooldownReduction || 0) + effects.cooldownReduction;
        }
    }
    
    /**
     * 获取玩家激活的连携
     */
    getPlayerSynergies(player) {
        return this.activeSynergies.get(player.id) || new Set();
    }
    
    update(dt) {
        // 持续检查（被动道具可能通过其他方式获得）
        // 实际可通过事件优化，减少检查频率
    }
}

window.SynergySystem = SynergySystem;
