#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const checks = [
  ['src/systems/Room.js', ['constructor']],
  ['src/systems/rooms/RoomLifecycle.js', ['Room.prototype.spawnEnemies', 'Room.prototype.update']],
  ['src/systems/rooms/RoomRendering.js', ['Room.prototype.draw', 'Room.prototype.drawAmbientEffects']],
  ['src/systems/weapons/Weapon.js', ['constructor', 'getDamage', 'canFire']],
  ['src/systems/weapons/WeaponFiring.js', ['Weapon.prototype.fire', 'Weapon.prototype.createProjectile']],
  ['src/systems/enemies/Enemy.js', ['constructor', 'update', 'takeDamage']],
  ['src/systems/enemies/EnemyBossBehavior.js', ['Enemy.prototype.updateBossAI']],
  ['src/systems/enemies/EnemyPresentation.js', ['Enemy.prototype.draw', 'Enemy.prototype.intersectsBullet']],
  ['src/systems/rooms/Room.js', ['兼容入口', 'global.Room']]
];

let failed = false;
for (const [rel, snippets] of checks) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`❌ Missing: ${rel}`);
    failed = true;
    continue;
  }
  const text = fs.readFileSync(full, 'utf8');
  for (const snippet of snippets) {
    if (!text.includes(snippet)) {
      console.error(`❌ ${rel} missing snippet: ${snippet}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log('✅ runtime structure verified');
