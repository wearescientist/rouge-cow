// 诊断脚本 - 在浏览器控制台运行
console.log("=== ENEMY_TYPES_NEW 诊断 ===");
console.log("ENEMY_TYPES_NEW 存在:", typeof ENEMY_TYPES_NEW !== 'undefined');
console.log("ENEMY_TYPES_NEW 键数:", Object.keys(ENEMY_TYPES_NEW).length);
console.log("示例条目:", ENEMY_TYPES_NEW['bat_v2']);
console.log("spritePaths:", ENEMY_TYPES_NEW['bat_v2']?.spritePaths);
console.log("ready 路径:", ENEMY_TYPES_NEW['bat_v2']?.spritePaths?.ready);
console.log("\n=== FLOOR_DATA 诊断 ===");
console.log("FLOOR_DATA 存在:", typeof window.FLOOR_DATA !== 'undefined');
console.log("floor1 怪物数:", window.FLOOR_DATA?.floors?.floor1?.monsters?.length);