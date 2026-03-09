/**
 * 怪物楼层分配配置
 * 基于游戏6层主题系统
 * 
 * 楼层主题（来自 data/floor_themes.js）：
 * - Floor 1: 菌丝区 (绿色) - 菌丝感染的初级生物
 * - Floor 2: 孵化温室 (蓝色) - 正在孵化的寄生生物
 * - Floor 3: 神经索 (紫色) - 神经系统被控制的生物
 * - Floor 4: 消化熔炉 (红色) - 高温、消化液环境
 * - Floor 5: 母虫庭院 (青色) - 母虫的亲卫队
 * - Floor 6: 千根之心 (黄色) - 母虫核心
 * 
 * 分配逻辑：
 * - Floor 1: 基础怪物（玩家最先遇到的、最简单的怪物）
 * - Floor 2-5: 新增怪物（相对于前一层的增量）
 * - Floor 6: Boss
 */

// 基础怪物（第1层核心怪物）
window.BASE_MONSTERS = [
  // 最基础的T1怪物
  { monster: "chick", version: "spr" },
  { monster: "snail", version: "spr" },
  { monster: "pigeon", version: "v1" }
];

window.MONSTER_FLOOR_ASSIGNMENT = {
  // ==================== Floor 1: 菌丝区 - 基础怪物 ====================
  // 主题：菌丝感染的草原动物，最简单的初级怪物
  // 环境：绿色系，菌丝蔓延的表层区域
  floor1: {
    name: "菌丝区",
    theme: "基础怪物 - 菌丝感染的初级生物",
    accentColor: "#4a4",
    enemyMod: 0.8,
    type: "base", // 基础层
    monsters: [
      { id: "chick", name: "变异小鸡", version: "spr", role: "common", tier: 1 },
      { id: "snail", name: "寄生蜗牛", version: "spr", role: "tank", tier: 1 },
      { id: "pigeon", name: "变异鸽子", version: "v1", role: "common", tier: 1 }
    ],
    boss: { id: "tiaotiao", name: "跳跳", version: "v6", title: "被寄生的草原袋鼠", desc: "牛牛的童年玩伴，双腿被菌丝强化" }
  },

  // ==================== Floor 2: 孵化温室 - 新增怪物 ====================
  // 主题：飞行类、速度型怪物
  // 新增：相对于第1层的增量
  floor2: {
    name: "孵化温室",
    theme: "新增怪物 - 飞行与寄生生物",
    accentColor: "#48f",
    enemyMod: 0.9,
    type: "incremental", // 增量层
    newMonsters: [
      { id: "bat", name: "蝙蝠", version: "v2", role: "common", tier: 1 },
      { id: "bat", name: "吸血蝙蝠", version: "v3", role: "common", tier: 2 },
      { id: "bat", name: "巨蝙蝠", version: "v8", role: "elite", tier: 2 },
      { id: "bee", name: "毒蜂", version: "v6", role: "ranged", tier: 2 }
    ],
    inheritedFrom: "floor1", // 继承第1层的基础怪物
    boss: { id: "tiezhua", name: "铁爪", version: "v10", title: "被寄生的天空霸主", desc: "曾经骄傲的金雕，翅膀长满菌丝羽毛" }
  },

  // ==================== Floor 3: 神经索 - 新增怪物 ====================
  // 主题：爬行类、诡异行为
  floor3: {
    name: "神经索",
    theme: "新增怪物 - 神经系统被控制的生物",
    accentColor: "#f4f",
    enemyMod: 1.0,
    type: "incremental",
    newMonsters: [
      { id: "rabbit2", name: "暴走兔", version: "spr", role: "speed", tier: 2 },
      { id: "rabbit2", name: "疾风兔", version: "v3", role: "speed", tier: 2 },
      { id: "rabbit2", name: "暴徒兔", version: "v4", role: "assassin", tier: 3 },
      { id: "snake", name: "小蛇", version: "v2", role: "common", tier: 1 },
      { id: "snake", name: "毒蛇", version: "v4", role: "ranged", tier: 2 },
      { id: "snake", name: "蛇王", version: "v10", role: "elite", tier: 3 }
    ],
    inheritedFrom: "floor2",
    boss: { id: "nibei", name: "泥背", version: "v6", title: "移动孵化场", desc: "象龟背甲变成孵化场，不断释放小寄生虫" }
  },

  // ==================== Floor 4: 消化熔炉 - 新增怪物 ====================
  // 主题：甲壳类、猛兽
  floor4: {
    name: "消化熔炉",
    theme: "新增怪物 - 高温环境下的凶猛生物",
    accentColor: "#f44",
    enemyMod: 1.1,
    type: "incremental",
    newMonsters: [
      { id: "crab", name: "小螃蟹", version: "spr", role: "common", tier: 1 },
      { id: "crab", name: "铁甲蟹", version: "v4", role: "tank", tier: 2 },
      { id: "crab", name: "巨钳蟹", version: "v6", role: "elite", tier: 3 },
      { id: "crab", name: "蟹王", version: "v8", role: "elite", tier: 3 },
      { id: "goose", name: "守卫鹅", version: "v6", role: "ranged", tier: 2 },
      { id: "goose", name: "鹅王", version: "v10", role: "elite", tier: 3 },
      { id: "panther", name: "幼豹", version: "v1", role: "speed", tier: 2 },
      { id: "panther", name: "黑豹", version: "v2", role: "assassin", tier: 2 },
      { id: "panther", name: "豹王", version: "v10", role: "elite", tier: 3 },
      { id: "yinya", name: "银牙", version: "v1", role: "elite", tier: 3 }
    ],
    inheritedFrom: "floor3",
    boss: { id: "wolf_king", name: "狼王", version: "v2", title: "共生狼群核心", desc: "狼群首领，脊椎外露连接神经索" }
  },

  // ==================== Floor 5: 母虫庭院 - 新增怪物 ====================
  // 主题：幽灵、宝箱怪
  floor5: {
    name: "母虫庭院",
    theme: "新增怪物 - 母虫的亲卫与幽灵",
    accentColor: "#4ff",
    enemyMod: 1.2,
    type: "incremental",
    newMonsters: [
      { id: "fox", name: "幼狐", version: "v1", role: "common", tier: 1 },
      { id: "fox", name: "狐狸", version: "v3", role: "assassin", tier: 2 },
      { id: "fox", name: "火狐", version: "v4", role: "ranged", tier: 2 },
      { id: "fox", name: "狐王", version: "v6", role: "elite", tier: 3 },
      { id: "ghost", name: "幽灵", version: "spr", role: "ethereal", tier: 2 },
      { id: "ghost", name: "怨灵", version: "v4", role: "ethereal", tier: 3 },
      { id: "ghost", name: "恶灵", version: "v6", role: "ethereal", tier: 3 },
      { id: "ghost", name: "幽灵王", version: "v10", role: "elite", tier: 4 },
      { id: "mimic", name: "小宝箱怪", version: "v1", role: "trickster", tier: 2 },
      { id: "mimic", name: "宝箱怪", version: "v4", role: "trickster", tier: 2 },
      { id: "mimic", name: "大宝箱怪", version: "v5", role: "trickster", tier: 3 },
      { id: "mimic", name: "精英宝箱怪", version: "v6", role: "elite", tier: 3 },
      { id: "mimic", name: "宝箱王", version: "v8", role: "elite", tier: 4 }
    ],
    inheritedFrom: "floor4",
    boss: { id: "ghost", name: "盲眼", version: "v8", title: "最后的清醒者", desc: "住在隔离腔室的老鼹鼠，唯一未被完全寄生的存在" }
  },

  // ==================== Floor 6: 千根之心 - Boss ====================
  floor6: {
    name: "千根之心",
    theme: "母虫核心",
    accentColor: "#ff0",
    enemyMod: 1.3,
    type: "boss",
    newMonsters: [],
    inheritedFrom: "floor5",
    boss: { id: "mother", name: "深渊母体", version: "v3", title: "母虫的显现形态", desc: "来自群星的格式塔意识" }
  }
};

// 怪物版本详细信息
// 注意：这里只包含 edits 文件中实际存在的怪物版本
window.MONSTER_VERSION_DETAILS = {
  // bat 系列
  "bat_v2": { name: "小蝙蝠", tier: 1, type: "common", hp: 10, speed: 180, dmg: 1 },
  "bat_v3": { name: "吸血蝙蝠", tier: 2, type: "speed", hp: 15, speed: 220, dmg: 2 },
  "bat_v8": { name: "巨蝙蝠", tier: 2, type: "elite", hp: 25, speed: 200, dmg: 3 },
  "bat_v9": { name: "蝙蝠王", tier: 3, type: "elite", hp: 40, speed: 190, dmg: 4 },
  
  // bee
  "bee_v6": { name: "毒蜂", tier: 2, type: "ranged", hp: 12, speed: 300, dmg: 1 },
  
  // chick
  "chick_spr": { name: "变异小鸡", tier: 1, type: "common", hp: 12, speed: 140, dmg: 1 },
  
  // crab 系列
  "crab_spr": { name: "小螃蟹", tier: 1, type: "common", hp: 20, speed: 70, dmg: 1 },
  "crab_v2": { name: "螃蟹", tier: 1, type: "common", hp: 25, speed: 65, dmg: 1 },
  "crab_v4": { name: "铁甲蟹", tier: 2, type: "tank", hp: 45, speed: 60, dmg: 2 },
  "crab_v6": { name: "巨钳蟹", tier: 3, type: "elite", hp: 70, speed: 50, dmg: 4 },
  "crab_v8": { name: "蟹王", tier: 3, type: "elite", hp: 90, speed: 45, dmg: 5 },
  
  // fox 系列
  "fox_v1": { name: "幼狐", tier: 1, type: "common", hp: 15, speed: 150, dmg: 1 },
  "fox_v2": { name: "狐狸", tier: 2, type: "assassin", hp: 25, speed: 180, dmg: 2 },
  "fox_v3": { name: "狡猾狐狸", tier: 2, type: "assassin", hp: 30, speed: 190, dmg: 3 },
  "fox_v4": { name: "火狐", tier: 2, type: "ranged", hp: 30, speed: 160, dmg: 3 },
  "fox_v6": { name: "狐王", tier: 3, type: "elite", hp: 80, speed: 170, dmg: 5 },
  "fox_v7": { name: "妖狐", tier: 3, type: "assassin", hp: 70, speed: 200, dmg: 4 },
  "fox_v8": { name: "九尾狐", tier: 4, type: "elite", hp: 100, speed: 180, dmg: 6 },
  "fox_v10": { name: "天狐", tier: 4, type: "elite", hp: 120, speed: 190, dmg: 7 },
  
  // ghost 系列
  "ghost_spr": { name: "幽灵", tier: 2, type: "ethereal", hp: 20, speed: 160, dmg: 2 },
  "ghost_v2": { name: "游荡幽灵", tier: 2, type: "ethereal", hp: 25, speed: 170, dmg: 2 },
  "ghost_v3": { name: "怨灵", tier: 2, type: "ethereal", hp: 30, speed: 165, dmg: 3 },
  "ghost_v4": { name: "恶灵", tier: 3, type: "ethereal", hp: 40, speed: 180, dmg: 3 },
  "ghost_v6": { name: "凶灵", tier: 3, type: "ethereal", hp: 60, speed: 200, dmg: 4 },
  "ghost_v8": { name: "盲眼", tier: 4, type: "boss", hp: 3000, speed: 160, dmg: 12 },
  "ghost_v10": { name: "幽灵王", tier: 4, type: "elite", hp: 100, speed: 220, dmg: 6 },
  
  // goose 系列
  "goose_v6": { name: "守卫鹅", tier: 2, type: "ranged", hp: 30, speed: 110, dmg: 2 },
  "goose_v10": { name: "鹅王", tier: 3, type: "elite", hp: 60, speed: 120, dmg: 4 },
  
  // mimic 系列
  "mimic_spr": { name: "小宝箱怪", tier: 2, type: "trickster", hp: 30, speed: 80, dmg: 2 },
  "mimic_v1": { name: "宝箱怪", tier: 2, type: "trickster", hp: 50, speed: 80, dmg: 3 },
  "mimic_v4": { name: "大宝箱怪", tier: 2, type: "trickster", hp: 70, speed: 75, dmg: 4 },
  "mimic_v5": { name: "守卫宝箱怪", tier: 3, type: "trickster", hp: 90, speed: 70, dmg: 5 },
  "mimic_v6": { name: "精英宝箱怪", tier: 3, type: "elite", hp: 120, speed: 90, dmg: 6 },
  "mimic_v7": { name: "宝箱守护者", tier: 3, type: "elite", hp: 150, speed: 60, dmg: 5 },
  "mimic_v8": { name: "宝箱王", tier: 4, type: "elite", hp: 200, speed: 80, dmg: 8 },
  "mimic_v10": { name: "传说宝箱怪", tier: 4, type: "elite", hp: 250, speed: 85, dmg: 10 },
  
  // mother 系列
  "mother_v2": { name: "母虫幼体", tier: 4, type: "boss", hp: 3000, speed: 50, dmg: 15 },
  "mother_v3": { name: "深渊母体", tier: 5, type: "final_boss", hp: 5000, speed: 40, dmg: 20 },
  "mother_v6": { name: "母虫", tier: 4, type: "boss", hp: 4000, speed: 45, dmg: 18 },
  "mother_v7": { name: "深渊母虫", tier: 5, type: "final_boss", hp: 5500, speed: 42, dmg: 22 },
  "mother_v8": { name: "千根母虫", tier: 5, type: "final_boss", hp: 6000, speed: 38, dmg: 25 },
  "mother_v10": { name: "群星母体", tier: 5, type: "final_boss", hp: 8000, speed: 35, dmg: 30 },
  
  // nibei 系列
  "nibei_spr": { name: "小泥龟", tier: 2, type: "tank", hp: 40, speed: 40, dmg: 1 },
  "nibei_v6": { name: "泥背", tier: 4, type: "boss", hp: 2000, speed: 50, dmg: 8 },
  "nibei_v8": { name: "巨泥龟", tier: 3, type: "elite", hp: 100, speed: 35, dmg: 5 },
  
  // panther 系列
  "panther_v1": { name: "幼豹", tier: 2, type: "speed", hp: 25, speed: 260, dmg: 2 },
  "panther_v2": { name: "黑豹", tier: 2, type: "assassin", hp: 35, speed: 260, dmg: 3 },
  "panther_v10": { name: "豹王", tier: 3, type: "elite", hp: 80, speed: 270, dmg: 6 },
  
  // pigeon 系列
  "pigeon_v1": { name: "变异鸽子", tier: 1, type: "common", hp: 15, speed: 130, dmg: 1 },
  "pigeon_v2": { name: "腐化鸽", tier: 1, type: "common", hp: 18, speed: 135, dmg: 1 },
  "pigeon_v4": { name: "毒鸽", tier: 2, type: "ranged", hp: 22, speed: 140, dmg: 2 },
  "pigeon_v6": { name: "巨鸽", tier: 2, type: "ranged", hp: 30, speed: 145, dmg: 2 },
  "pigeon_v7": { name: "飞鸽", tier: 2, type: "speed", hp: 28, speed: 160, dmg: 2 },
  "pigeon_v8": { name: "鸽王", tier: 3, type: "elite", hp: 50, speed: 150, dmg: 4 },
  "pigeon_v10": { name: "传说鸽", tier: 3, type: "elite", hp: 60, speed: 155, dmg: 5 },
  
  // rabbit2 系列
  "rabbit2_spr": { name: "暴走兔", tier: 2, type: "speed", hp: 20, speed: 280, dmg: 2 },
  "rabbit2_v2": { name: "疯兔", tier: 2, type: "speed", hp: 22, speed: 290, dmg: 2 },
  "rabbit2_v3": { name: "疾风兔", tier: 2, type: "speed", hp: 18, speed: 320, dmg: 2 },
  "rabbit2_v4": { name: "暴徒兔", tier: 3, type: "assassin", hp: 30, speed: 260, dmg: 4 },
  "rabbit2_v8": { name: "兔王", tier: 3, type: "elite", hp: 50, speed: 240, dmg: 5 },
  
  // snail 系列
  "snail_spr": { name: "寄生蜗牛", tier: 1, type: "tank", hp: 25, speed: 50, dmg: 1 },
  "snail_v1": { name: "蜗牛", tier: 1, type: "tank", hp: 30, speed: 45, dmg: 1 },
  "snail_v2": { name: "硬壳蜗牛", tier: 1, type: "tank", hp: 35, speed: 42, dmg: 1 },
  "snail_v4": { name: "铁壳蜗牛", tier: 2, type: "tank", hp: 40, speed: 40, dmg: 2 },
  "snail_v6": { name: "巨蜗牛", tier: 2, type: "tank", hp: 55, speed: 35, dmg: 2 },
  "snail_v7": { name: "蜗牛王", tier: 2, type: "tank", hp: 70, speed: 38, dmg: 3 },
  "snail_v8": { name: "传说蜗牛", tier: 3, type: "elite", hp: 100, speed: 30, dmg: 4 },
  "snail_v10": { name: "神蜗牛", tier: 3, type: "elite", hp: 120, speed: 32, dmg: 5 },
  
  // snake 系列
  "snake_v2": { name: "小蛇", tier: 1, type: "common", hp: 15, speed: 120, dmg: 1 },
  "snake_v4": { name: "毒蛇", tier: 2, type: "ranged", hp: 20, speed: 120, dmg: 2 },
  "snake_v7": { name: "蟒蛇", tier: 2, type: "tank", hp: 35, speed: 100, dmg: 3 },
  "snake_v8": { name: "巨蛇", tier: 3, type: "elite", hp: 55, speed: 105, dmg: 4 },
  "snake_v10": { name: "蛇王", tier: 3, type: "elite", hp: 80, speed: 110, dmg: 6 },
  
  // wolf_king
  "wolf_king_v2": { name: "狼王", tier: 4, type: "boss", hp: 2500, speed: 140, dmg: 15 },
  
  // yinya 系列
  "yinya_v1": { name: "银牙", tier: 3, type: "assassin", hp: 100, speed: 200, dmg: 5 },
  "yinya_v7": { name: "狼王银牙", tier: 4, type: "elite", hp: 150, speed: 210, dmg: 7 }
};

// 导出格式版本
window.FLOOR_ASSIGNMENT_VERSION = "1.1.0";
