class SynergyManager {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.activeSynergies = new Map(); // id -> synergy
        this.checkSynergies();
    }
    
    // 检查并更新协同
    checkSynergies() {
        const owned = Object.keys(this.itemManager.owned).map(Number);
        this.activeSynergies.clear();
        
        for (const rule of SynergyManager.SYNERGY_RULES) {
            const hasAll = rule.items.every(id => owned.includes(id));
            if (hasAll) {
                this.activeSynergies.set(rule.id, rule);
            }
        }
        
        return this.activeSynergies;
    }
    
    // 应用协同效果到stats
    applySynergies(stats) {
        for (const synergy of this.activeSynergies.values()) {
            synergy.effect(stats);
        }
        return stats;
    }
    
    // 获取当前激活的协同列表（用于UI显示）
    getActiveSynergies() {
        return Array.from(this.activeSynergies.values()).map(s => ({
            id: s.id,
            name: s.name,
            items: s.items.map(id => ITEMS[id]).filter(Boolean)
        }));
    }
    
    // 检查特定协同是否激活
    hasSynergy(synergyId) {
        return this.activeSynergies.has(synergyId);
    }
}

// 静态属性定义（浏览器兼容性）
SynergyManager.SYNERGY_RULES = [
    {
        id: 'fire_hell',
        name: '燃烧地狱',
        items: [13, 17], // 火焰附魔 + 爆炸弹
        effect: (stats) => { 
            stats.fireDmg = (stats.fireDmg || 0) + 10;
            stats.fireSpread = true; // 火焰扩散
        }
    },
    {
        id: 'tesla_coil',
        name: '特斯拉线圈',
        items: [15, 26], // 雷电宝珠 + 雷电之刃
        effect: (stats) => {
            stats.auraDamage = (stats.auraDamage || 0) + 10;
            stats.thunderAura = true;
        }
    },
    {
        id: 'mad_knife',
        name: '疯狂厨娘',
        items: [6, 52], // 心之容器 + 妈妈的刀
        effect: (stats) => {
            stats.chargeKnife = true;
            stats.knifeDamage = 2.0; // 飞刀伤害翻倍
        }
    },
    {
        id: 'vampire_lord',
        name: '吸血鬼领主',
        items: [8, 84], // 吸血獠牙 + 犹大的影子
        effect: (stats) => {
            stats.lifeSteal += 0.1;
            stats.lifeStealCap = 0.5; // 吸血上限提高到50%
        }
    },
    {
        id: 'holy_knight',
        name: '圣骑士',
        items: [61, 65], // 圣盾 + 守护者
        effect: (stats) => {
            stats.shield += 1;
            stats.holyMantle = true;
            stats.angelOrbit = 2; // 额外2个天使环绕
        }
    },
    {
        id: 'glass_master',
        name: '玻璃大师',
        items: [47, 88], // 狂暴模式 + 玻璃大炮
        effect: (stats) => {
            stats.glassCannon = 3; // 伤害+200%
            stats.invincibleTime = 3; // 3秒无敌帧
        }
    },
    {
        id: 'tech_master',
        name: '科技大师',
        items: [51, 99], // 科技X + 科技2
        effect: (stats) => {
            stats.laserBeam = true;
            stats.tech2 = true;
            stats.laserDamage = 2.0; // 激光伤害翻倍
        }
    },
    {
        id: 'explosion_expert',
        name: '爆破专家',
        items: [55, 100], // 导弹遥控器 + 婴儿博士
        effect: (stats) => {
            stats.drBaby = true;
            stats.missile = true;
            stats.explosionRadius = 1.5; // 爆炸范围+50%
        }
    },
    {
        id: 'twin_gods',
        name: '双子神',
        items: [79, 65], // 孪生姐妹 + 守护者
        effect: (stats) => {
            stats.sister += 1;
            stats.guardianAngel += 1;
            stats.familiarDamage = 0.75; // 跟班伤害提升到75%
        }
    },
    {
        id: 'time_lord',
        name: '时间领主',
        items: [81, 39], // 时间暂停 + 时间怀表
        effect: (stats) => {
            stats.stopwatch = true;
            stats.slowTime = 0.5; // 子弹时间50%
            stats.timeFreezeDuration = 5; // 时间暂停5秒
        }
    }
];



// 被动道具管理器（吸血鬼幸存者风格）


// Export to global
window.SynergyManager = SynergyManager;
