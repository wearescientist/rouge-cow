const ENEMY_TYPES = {

    // ==================== T1: 普通怪（白色 #ffffff）====================
    // 基础属性: HP 15, 速度 120, 伤害 1, size=22

    chick: { name: '变异小鸡', tier: 1, hp: 12, speed: 140, dmg: 1, exp: 3, gold: 2, color: '#ffffff', sprite: 'chick', anim: 'hop', size: 32, offsetX: 0, offsetY: 4 },  // size=32: 小型贴图高度
    snail: { name: '寄生蜗牛', tier: 1, hp: 25, speed: 50, dmg: 1, exp: 2, gold: 2, color: '#ffffff', sprite: 'snail', anim: 'slide', size: 22, offsetX: 0, offsetY: 2 },  // offset: 贴图向下偏移2像素
    pigeon: { name: '变异鸽子', tier: 1, hp: 15, speed: 130, dmg: 1, exp: 3, gold: 3, color: '#ffffff', sprite: 'pigeon', anim: 'flutter', size: 28, offsetX: 0, offsetY: 2 },  // offset: 贴图向下偏移2像素
    duck3: { name: '小野鸭', tier: 1, hp: 12, speed: 120, dmg: 1, exp: 3, gold: 2, color: '#ffffff', sprite: 'duck3', anim: 'waddle', size: 24, offsetX: 0, offsetY: 3 },  // offset: 贴图向下偏移3像素
    bat: { name: '蝙蝠', tier: 1, hp: 10, speed: 180, dmg: 1, exp: 3, gold: 3, color: '#ffffff', sprite: 'bird', anim: 'fly', size: 40, offsetX: 0, offsetY: 2 },  // offset: 贴图向下偏移2像素

    // ==================== T2: 精英怪（四色）====================
    
    // ---- 速度型（蓝色 #48f）速度 x2 = 240+ ----
    rabbit2: { name: '暴走兔', tier: 2, type: 'speed', hp: 20, speed: 280, dmg: 2, exp: 10, gold: 5, color: '#4488ff', sprite: 'rabbit2', anim: 'hopfast', special: 'jump', desc: '速度极快，会跳跃突击', size: 30, offsetX: 0, offsetY: 4 },  // offset: 贴图向下偏移4像素
    bee: { name: '毒蜂', tier: 2, type: 'speed', hp: 12, speed: 300, dmg: 1, exp: 8, gold: 4, color: '#4488ff', sprite: 'bird', anim: 'fly', desc: '极速飞行', size: 40, offsetX: 0, offsetY: 2 },  // offset: 贴图向下偏移2像素
    panther: { name: '黑豹', tier: 2, type: 'speed', hp: 35, speed: 260, dmg: 2, exp: 15, gold: 10, color: '#4488ff', sprite: 'cat', anim: 'prowl', desc: '隐身瞬移', size: 36, offsetX: 0, offsetY: 3 },  // offset: 贴图向下偏移3像素
    
    // ---- 肉盾型（绿色 #4a4）HP x2-3 = 30-50 ----
    crab: { name: '铁甲蟹', tier: 2, type: 'tank', hp: 45, speed: 60, dmg: 2, exp: 15, gold: 10, color: '#44aa44', sprite: 'crab', anim: 'sidle', armor: 3, desc: '缩壳减伤', size: 48, offsetX: 0, offsetY: 2 },  // offset: 贴图向下偏移2像素
    nibei: { name: '泥背', tier: 2, type: 'tank', hp: 60, speed: 50, dmg: 2, exp: 20, gold: 15, color: '#44aa44', sprite: 'turtle', anim: 'crawl', armor: 4, special: 'tank', desc: '坦克模式，减速80%', size: 50, offsetX: 0, offsetY: 3 },  // offset: 贴图向下偏移3像素
    bear: { name: '巨熊', tier: 2, type: 'tank', hp: 50, speed: 70, dmg: 3, exp: 18, gold: 12, color: '#44aa44', sprite: 'bear', anim: 'heavy', desc: '拍击眩晕', size: 42, offsetX: 0, offsetY: 4 },  // offset: 贴图向下偏移4像素
    
    // ---- 射手型（红色 #f44）可发射子弹 ----
    snake: { name: '毒蛇', tier: 2, type: 'ranged', hp: 20, speed: 120, dmg: 2, exp: 12, gold: 8, color: '#ff4444', sprite: 'snake', anim: 'slither', special: 'poison', desc: '喷毒液攻击', size: 48, offsetX: 0, offsetY: 3 },  // offset: 贴图向下偏移3像素
    goose: { name: '守卫鹅', tier: 2, type: 'ranged', hp: 30, speed: 110, dmg: 2, exp: 14, gold: 8, color: '#ff4444', sprite: 'goose', anim: 'charge', special: 'charge', desc: '羽毛齐射3发', size: 24 },
    fox: { name: '狡猾狐狸', tier: 2, type: 'ranged', hp: 25, speed: 150, dmg: 2, exp: 12, gold: 8, color: '#ff4444', sprite: 'dog', anim: 'run', desc: '飞扑+火球', size: 48, offsetX: 0, offsetY: 3 },  // offset: 贴图向下偏移3像素
    
    // ---- 刺客型（紫色 #a4f）高伤害+瞬移 ----
    tiaotiao: { name: '跳跳', tier: 2, type: 'assassin', hp: 22, speed: 200, dmg: 3, exp: 15, gold: 10, color: '#aa44ff', sprite: 'rabbit', anim: 'hop', special: 'jump', desc: '200内跳跃，速度x2', size: 36, offsetX: 0, offsetY: 4 },  // offset: 贴图向下偏移4像素
    tiezhua: { name: '铁爪', tier: 2, type: 'assassin', hp: 20, speed: 250, dmg: 3, exp: 18, gold: 12, color: '#aa44ff', sprite: 'bird', anim: 'dive', special: 'dive', desc: '俯冲攻击，速度x3', size: 40, offsetX: 0, offsetY: 2 },  // offset: 贴图向下偏移2像素
    yinya: { name: '银牙', tier: 2, type: 'assassin', hp: 35, speed: 180, dmg: 3, exp: 20, gold: 12, color: '#aa44ff', sprite: 'dog2', anim: 'run', special: 'summon', desc: '召唤小狗+撕裂', size: 22, offsetX: 0, offsetY: 3 },  // offset: 贴图向下偏移3像素

    // ==================== T3: 小Boss（金色 #fa0）====================
    // HP = T1 x5 = 75-100

    wolf_king: { name: '狼王', tier: 3, hp: 1500, speed: 140, dmg: 4, exp: 40, gold: 30, color: '#ffaa00', sprite: 'dog2', anim: 'run', special: 'howl', desc: '召唤3白狼+狼嚎加速', size: 22 },
    turtle: { name: '玄龟', tier: 3, hp: 1500, speed: 40, dmg: 3, exp: 50, gold: 35, color: '#ffaa00', sprite: 'turtle', anim: 'crawl', armor: 5, desc: 'armor5+水弹连射', size: 50 },
    mimic: { name: '宝箱怪', tier: 3, hp: 1500, speed: 80, dmg: 4, exp: 45, gold: 40, color: '#ffaa00', sprite: 'bear', anim: 'heavy', special: 'mimic', desc: '伪装+扑击', size: 42 },
    ghost: { name: '幽灵', tier: 3, hp: 1500, speed: 160, dmg: 3, exp: 35, gold: 30, color: '#ffaa00', sprite: 'pigeon', anim: 'flutter', special: 'ethereal', desc: '穿墙+追踪弹', size: 30 },

    // ==================== T4: Boss（深红 #800→#f00）====================
    // 血量由BOSS_TYPES动态计算 - 此定义仅用于占位，实际属性见BOSS_TYPES

    mother: { name: '深渊母体', tier: 4, hp: 5000, speed: 40, dmg: 5, exp: 150, gold: 80, color: '#880000', sprite: 'bear', anim: 'heavy', desc: '使用BOSS_TYPES配置', size: 72 }

};
