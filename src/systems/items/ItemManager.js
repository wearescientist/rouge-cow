/**
 * ItemManager - 道具管理器
 * 从 index.html 迁移的独立模块
 */

class ItemManager {

    constructor(player) {

        this.player = player;

        this.owned = {};

        this.cache = null;

        this.dirty = true;

    }



    add(id) {
        const item = ITEMS[id];
        if (!item) return false;
        
        // v0.18.4 fix: 道具池机制，不可重复获取
        if (this.owned[id]) {
            // 已拥有该道具，不可再次获取
            return false;
        }
        
        this.owned[id] = 1; // 只记录是否拥有，不叠加数量
        this.dirty = true;
        
        // 立即应用maxHp效果
        if (item.effect === 'maxHp') {
            this.player.maxHp += item.value;
            this.player.hp += item.value;
        }
        
        // v0.22: 解锁宠物道具立即生效
        if (item.effect === 'unlockPet' && item.petId && window.game && window.game.petManager) {
            window.game.unlockPet(item.petId);
        }
        
        return true;
    }



    getStats() {

        if (!this.dirty) return this.cache;

        

        const s = {

            // 基础属性

            dmg: 1, projCount: 1, projSize: 1, fireRate: 1, pierce: 0,

            crit: 0, critDmg: 1.5, maxHp: 0, armor: 0, lifeSteal: 0,

            speed: 1, fly: false, magnet: 100, goldBonus: 1,

            // 伤害类型

            fireDmg: 0, thunderDmg: 0, poisonDmg: 0, curseDmg: 0,

            // 控制效果

            slowChance: 0, slowAmount: 0, stunChance: 0,

            // 新属性（第1次迭代）

            spread: 0, homing: 0, bounce: 0, burst: 0,

            regen: 0, thorn: 0, block: 0, shield: 0, revive: 0,

            dashDist: 1, slowTime: 0, luck: 0, goldOnKill: 0, expBonus: 0,

            pickupRange: 0, fairy: 0, orbit: 0, dragon: 0,

            glassCannon: 0, bloodMoney: 0, invincible: 0, upgradeAll: 0,

            // 治疗
            healOnHit: 0,
            
            // v0.19: 以撒风格新效果
            laserBeam: false,      // 科技X - 激光穿透
            chargeKnife: false,    // 妈妈的刀 - 蓄力飞刀
            soyMilk: false,        // 豆浆 - 高攻速低伤害
            brimstone: false,      // 硫磺火 - 持续激光
            missile: false,        // 导弹遥控器
            splitTear: false,      // 眼泪炸弹 - 分裂
            stickyBomb: false,     // 爆炸眼泪
            quad: false,           // 四向射击
            holyMantle: false,     // 圣盾 - 每层无敌
            oakHeart: false,       // 橡树心
            nineLives: 0,          // 九命猫
            guardianAngel: 0,      // 守护者
            autoHeal: false,       // 自动血袋
            ironWomb: false,       // 铁子宫
            mapReveal: false,      // 指南针
            specialReveal: false,  // 藏宝图
            itemReveal: false,     // 水晶球
            discount: false,       // 优惠券
            copyLast: false,       // 复制机
            reroll: 0,             // 神圣骰子
            converter: false,      // 转换器
            mystery: false,        // 神秘礼物
            chaos: false,          // 混沌
            sister: 0,             // 孪生姐妹
            shadow: false,         // 分身术
            stopwatch: false,      // 时间暂停
            blackHole: false,      // 黑洞
            bloodSacrifice: false, // 献血袋
            judas: false,          // 犹大的影子
            lost: false,           // 失落的灵魂
            cain: false,           // 该隐之眼
            samson: false,         // 参孙之怒
            samsonBonus: 0,        // 参孙之怒增伤累计
            bloodPact: false,      // 血之契约
            deathMoney: false,     // 冥币
            holyGrail: false,      // 圣杯
            sacredHeart: false,    // 圣心
            godhead: false,        // 神性
            giant: false,          // 巨人
            planet: false,         // 小星球
            antiGravity: false,    // 反重力
            soda: false,           // 弹珠soda
            marked: false,         // 标记 - 自动瞄准
            tech2: false,          // 科技2
            drBaby: false,         // 婴儿博士
            parasite: false,       // 寄生虫
            
            // v0.25: 精简后的效果系统 - 只保留实际可实现的效果
            // 概率进化类（保留）
            evolution: false,      // 进化因子 - 每层随机属性+10%
            adaptiveArmor: false,  // 适应装甲 - 受击增加对应抗性
            
            // 特殊效果类（保留2个 - 尚未有对应道具，预留实现）
            slowAura: false,       // 减速领域 - 周围敌人减速
            substitute: false,     // 替身娃娃 - 一次性死亡免疫
            
            // 七宗罪类（保留2个）
            prideCrown: false,     // 傲慢王冠 - 满血伤害翻倍，不满血减半
            collector: false,      // 收藏家 - 每收集一个道具增加全局加成
            
            // v0.20: 第4轮-主动道具标记
            blink: false,          // 瞬移卷轴
            timeStop: false,       // 时间沙漏
            summon: false,         // 召唤号角
            heal5: false,          // 治疗药水
            placeBomb: false,      // 炸弹袋
            decoy: false,          // 诱饵人偶
            invincible5: false,    // 护盾发生器
            throwBlackHole: false, // 黑洞手雷
            copyShots: false,      // 复制魔镜
            berserk: false,        // 狂暴药剂
            swapEnemy: false,      // 置换器
            freezeAll: false,      // 冰封宝珠
            mapScan: false,        // 全图扫描
            sacrifice: false,      // 生命献祭
            autoRevive: false,      // 复活十字架
            
            // v0.26: 基础属性道具系统 - 属性累加值
            dmgMult: 0,            // 伤害倍率累加 (101-104)
            fireRateMult: 0,       // 射速倍率累加 (105-108)
            speedMult: 0,          // 移速倍率累加 (109-112)
            critAdd: 0,            // 暴击率累加 (113-116)
            maxHpAdd: 0,           // 生命上限累加 (117-120)
            armorAdd: 0,           // 护甲累加 (121-124)
            pierceAdd: 0,          // 穿透累加 (125-127)
            projCountAdd: 0,       // 子弹数量累加 (128-130)
            projSpreadAdd: 0       // 子弹散射角累加
        };

        

        // v0.18.4: 道具池机制，每个道具只生效一次
        for (const id of Object.keys(this.owned)) {
            const item = ITEMS[id];
            if (!item) continue;
            const v = item.value; // 不再乘count

            

            switch (item.effect) {

                // 基础攻击

                case 'projCount': s.projCount += v; break;

                case 'projSize': s.projSize += v; break;

                case 'fireRate': s.fireRate *= (1 + v); break;

                case 'pierce': s.pierce += v; break;

                case 'crit': s.crit = Math.min(1, s.crit + v); break;

                case 'critDmg': s.critDmg += v; break;

                // 防御

                case 'maxHp': s.maxHp += v; break;

                case 'armor': s.armor += v; break;

                case 'lifeSteal': s.lifeSteal += v; break;

                case 'regen': s.regen += v; break;

                case 'thorn': s.thorn += v; break;

                case 'armor': s.armor += v; break;

                case 'shield': s.shield += v; break;

                case 'revive': s.revive += v; break;

                // 移动

                case 'speed': s.speed += v; break;

                case 'fly': s.fly = true; break;

                case 'dashDist': s.dashDist += v; break;

                case 'slowTime': s.slowTime += v; break;

                // 资源

                case 'magnet': s.magnet += v; break;

                case 'goldBonus': s.goldBonus += v; break;

                case 'luck': s.luck += v; break;

                case 'goldOnKill': s.goldOnKill += v; break;

                case 'expBonus': s.expBonus += v; break;

                case 'pickupRange': s.pickupRange += v; break;

                // 伤害类型

                case 'fireDmg': s.fireDmg += v; break;

                case 'thunderDmg': s.thunderDmg += v; break;

                case 'poisonDmg': s.poisonDmg += v; break;

                case 'curseDmg': s.curseDmg += v; break;

                case 'slow': s.slowAmount += v; break;

                case 'chain': s.chain = (s.chain || 0) + v; break;

                // 特殊效果

                case 'spread': s.spread += v; break;

                case 'homing': s.homing += v; break;

                case 'bounce': s.bounce += v; break;

                case 'burst': s.burst += v; break;

                // 召唤

                case 'fairy': s.fairy += v; break;

                case 'orbit': s.orbit += v; break;

                case 'dragon': s.dragon += v; break;

                // 诅咒

                case 'glassCannon': s.glassCannon += v; break;

                case 'bloodMoney': s.bloodMoney += v; break;

                // 特殊

                case 'invincible': s.invincible += v; break;
                case 'upgradeAll': s.upgradeAll += v; break;
                
                // v0.19: 以撒风格新效果
                case 'laserBeam': s.laserBeam = true; break;
                case 'chargeKnife': s.chargeKnife = true; break;
                case 'soyMilk': s.soyMilk = true; break;
                case 'brimstone': s.brimstone = true; break;
                case 'missile': s.missile = true; break;
                case 'splitTear': s.splitTear = true; break;
                case 'stickyBomb': s.stickyBomb = true; break;
                case 'quad': s.quad = true; break;
                case 'holyMantle': s.holyMantle = true; break;
                case 'oakHeart': s.oakHeart = true; break;
                case 'nineLives': s.nineLives += v; break;
                case 'guardianAngel': s.guardianAngel += v; break;
                case 'autoHeal': s.autoHeal = true; break;
                case 'ironWomb': s.ironWomb = true; break;
                case 'mapReveal': s.mapReveal = true; break;
                case 'specialReveal': s.specialReveal = true; break;
                case 'itemReveal': s.itemReveal = true; break;
                case 'discount': s.discount = true; break;
                case 'copyLast': s.copyLast = true; break;
                case 'reroll': s.reroll += v; break;
                case 'converter': s.converter = true; break;
                case 'mystery': s.mystery = true; break;
                case 'chaos': s.chaos = true; break;
                case 'sister': s.sister += v; break;
                case 'shadow': s.shadow = true; break;
                case 'stopwatch': s.stopwatch = true; break;
                case 'blackHole': s.blackHole = true; break;
                case 'bloodSacrifice': s.bloodSacrifice = true; break;
                case 'judas': s.judas = true; break;
                case 'lost': s.lost = true; break;
                case 'cain': s.cain = true; break;
                case 'samson': s.samson = true; break;
                case 'bloodPact': s.bloodPact = true; break;
                case 'deathMoney': s.deathMoney = true; break;
                case 'holyGrail': s.holyGrail = true; break;
                case 'sacredHeart': s.sacredHeart = true; break;
                case 'godhead': s.godhead = true; break;
                case 'giant': s.giant = true; break;
                case 'planet': s.planet = true; break;
                case 'antiGravity': s.antiGravity = true; break;
                case 'soda': s.soda = true; break;
                case 'marked': s.marked = true; break;
                case 'tech2': s.tech2 = true; break;
                case 'drBaby': s.drBaby = true; break;
                case 'parasite': s.parasite = true; break;
                
                // v0.25: 精简保留的效果
                case 'evolution': s.evolution = true; break;
                case 'adaptiveArmor': s.adaptiveArmor = true; break;
                case 'slowAura': s.slowAura = true; break;         // 减速领域 - 预留
                case 'substitute': s.substitute = true; break;      // 替身娃娃 - 预留
                case 'prideCrown': s.prideCrown = true; break;
                case 'collector': s.collector = true; break;
                
                // v0.20: 第4轮-主动道具(只标记拥有，实际效果由主动系统处理)
                case 'blink': s.blink = true; break;
                case 'timeStop': s.timeStop = true; break;
                case 'summon': s.summon = true; break;
                case 'heal5': s.heal5 = true; break;
                case 'placeBomb': s.placeBomb = true; break;
                case 'decoy': s.decoy = true; break;
                case 'invincible5': s.invincible5 = true; break;
                case 'throwBlackHole': s.throwBlackHole = true; break;
                case 'copyShots': s.copyShots = true; break;
                case 'berserk': s.berserk = true; break;
                case 'swapEnemy': s.swapEnemy = true; break;
                case 'freezeAll': s.freezeAll = true; break;
                case 'mapScan': s.mapScan = true; break;
                case 'sacrifice': s.sacrifice = true; break;
                case 'autoRevive': s.autoRevive = true; break;
                
                // v0.26: 基础属性道具系统
                case 'dmgMult': s.dmgMult += v; break;
                case 'fireRateMult': s.fireRateMult += v; break;
                case 'speedMult': s.speedMult += v; break;
                case 'critAdd': s.critAdd += v; break;
                case 'maxHpAdd': s.maxHpAdd += v; break;
                case 'armorAdd': s.armorAdd += v; break;
                case 'pierceAdd': s.pierceAdd += v; break;
                case 'projCountAdd': 
                    s.projCountAdd += v; 
                    s.projSpreadAdd += (v * 5); // 每个子弹+5°散射
                    break;
            }

        }

        

        // 诅咒效果处理

        if (s.glassCannon > 0) {

            s.fireRate *= 1.5;

            s.maxHp *= 0.7;

        }

        if (s.bloodMoney > 0) {

            s.goldBonus *= 2;

        }

        if (s.upgradeAll > 0) {
            s.speed *= 1.1;
            s.fireRate *= 1.1;
            s.crit = Math.min(1, s.crit * 1.1 + 0.1);
        }
        
        // v0.19: 新诅咒效果处理
        // 豆浆: 伤害-80% 射速+300%
        if (s.soyMilk) {
            s.fireRate *= 4.0;
            s.projSize *= 0.5;
            s.dmg *= 0.28;
        }
        
        // 犹大的影子: 伤害+100% 只能1红心
        if (s.judas) {
            s.fireRate *= 2.0;
            s.maxHp = Math.min(s.maxHp, 2);
        }
        
        // 失落的灵魂: 飞行 无法获得红心
        if (s.lost) {
            s.fly = true;
        }
        
        // 该隐之眼: 射程+50% 50%miss率
        if (s.cain) {
            s.projSpeed = (s.projSpeed || 1) * 1.5;
        }
        
        // 参孙之怒: 受伤后+50%伤10秒(在受伤时触发，这里初始化)
        if (s.samson) {
            s.samsonBonus = 1.5;
        }
        
        // 血之契约: 伤害+200% 每秒掉1%血
        if (s.bloodPact) {
            s.fireRate *= 3.0;
        }
        
        // 铁子宫: 无敌时间+100% 移速-15%
        if (s.ironWomb) {
            s.speed *= 0.85;
        }
        
        // 硫磺火: 移速-20%
        if (s.brimstone) {
            s.speed *= 0.8;
        }
        
        // 四向射击: 单发-30%
        if (s.quad) {
            s.fireRate *= 0.7;
        }
        
        // 橡树心: 生命+4 移速-10%
        if (s.oakHeart) {
            s.maxHp += 4;
            s.speed *= 0.9;
        }
        
        // 圣杯: 飞行+圣盾
        if (s.holyGrail) {
            s.fly = true;
            s.holyMantle = true;
        }
        
        // 圣心: 伤害+100% 追踪+回复
        if (s.sacredHeart) {
            s.fireRate *= 2.0;
            s.homing = Math.max(s.homing, 0.8);
            s.regen += 0.5;
        }
        
        // 巨人: 体型+50% 伤害+50%
        if (s.giant) {
            s.fireRate *= 1.5;
            s.projSize *= 1.5;
        }
        
        // 神性: 神圣光环伤害
        if (s.godhead) {
            s.auraDamage = (s.auraDamage || 0) + 15;
        }
        
        // v0.25: 参孙之怒 - 计算增伤加成
        if (s.samson && this.player && this.player.samsonCount) {
            s.samsonBonus = Math.min(1.5, this.player.samsonCount * 0.5); // 最多3层，每层+50%
        }
        
        // v0.25: 收藏家 - 每收集一个道具增加少量稳态属性，不再放大暴击/数量乘区
        if (s.collector) {
            const itemCount = Object.keys(this.owned).length;
            const collectorBonus = 1 + (itemCount * 0.006); // 每个道具+0.6%
            s.dmg = (s.dmg || 1) * collectorBonus;
            s.speed *= 1 + (itemCount * 0.003);
        }
        
        // v0.25: 进化因子 - 每层随机属性+10%（简化：全属性+10%）
        if (s.evolution && window.game) {
            const floor = window.game.currentFloor || 1;
            const evolutionBonus = 1 + (floor * 0.1); // 每层+10%
            s.dmg = (s.dmg || 1) * evolutionBonus;
            s.speed *= evolutionBonus;
            s.projSize *= evolutionBonus;
        }
        
        // v0.25: 适应装甲 - 根据当前层数获得对应抗性（简化实现）
        if (s.adaptiveArmor && window.game) {
            const floor = window.game.currentFloor || 1;
            // 每层高一级，获得对应伤害类型的抗性
            s.fireDmg = (s.fireDmg || 0) + (floor * 0.05); // 每层+5%火焰伤害
            s.armor = (s.armor || 0) + floor; // 每层+1护甲
        }
        
        // v0.25: 减速领域 - 周围敌人减速（标记效果，在敌人AI中处理）
        if (s.slowAura) {
            s.slowAuraRadius = 150;  // 影响半径
            s.slowAuraAmount = 0.3;  // 减速30%
        }
        
        // v0.25: 替身娃娃 - 一次性死亡免疫（标记效果，在死亡处理中检查）
        if (s.substitute) {
            s.hasSubstitute = true;  // 拥有替身保护
        }
        
        // v0.26: 基础属性道具系统 - 应用属性加成
        // 伤害倍率 (101-104): 倍率叠加
        if (s.dmgMult > 0) {
            s.dmg = (s.dmg || 1) * (1 + s.dmgMult);
        }
        
        // 射速倍率 (105-108): 倍率叠加
        if (s.fireRateMult > 0) {
            s.fireRate *= (1 + s.fireRateMult);
        }
        
        // 移速倍率 (109-112): 倍率叠加
        if (s.speedMult > 0) {
            s.speed *= (1 + s.speedMult);
        }
        
        // 暴击率 (113-116): 加法叠加，上限90%
        if (s.critAdd > 0) {
            s.crit = Math.min(0.9, s.crit + s.critAdd);
        }
        
        // 生命上限 (117-120): 加法叠加
        if (s.maxHpAdd > 0) {
            s.maxHp += s.maxHpAdd;
        }
        
        // 护甲 (121-124): 加法叠加
        if (s.armorAdd > 0) {
            s.armor += s.armorAdd;
        }
        
        // 穿透 (125-127): 加法叠加
        if (s.pierceAdd > 0) {
            s.pierce += s.pierceAdd;
        }
        
        // 子弹数量 (128-130): 加法叠加
        if (s.projCountAdd > 0) {
            s.projCount += s.projCountAdd;
        }
        
        this.cache = s;

        this.dirty = false;

        return s;

    }



    has(id) { return (this.owned[id] || 0) > 0; }

    count(id) { return this.owned[id] || 0; }

    

    // 获取拥有的道具列表（用于UI显示）
    getOwnedItems() {
        const items = [];
        // v0.18.4: 道具池机制
        for (const id of Object.keys(this.owned)) {
            const item = ITEMS[id];
            if (item) {
                items.push({
                    id: id,
                    name: item.name,
                    icon: item.icon,
                    count: 1, // 道具池机制，只记录是否拥有
                    desc: item.desc,
                    rarity: item.rarity || 'common', // v0.22: 稀有度
                    rarityColor: RARITY_COLORS[item.rarity] || '#888' // v0.22: 稀有度颜色
                });
            }
        }
        
        // v0.22: 按稀有度排序（神话>传说>诅咒>史诗>稀有>普通）
        const rarityOrder = { mythic: 6, legendary: 5, cursed: 4, epic: 3, rare: 2, common: 1 };
        items.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
        
        return items;
    }

}



// v0.19: 道具协同系统（参考以撒的结合）
