#!/usr/bin/env node
/**
 * Game Sounds Generator - 武器 + 系统音效
 * v0.27 - 移除环刃，添加系统音效(冲刺/金币/经验/进化/开门)
 * 
 * 生成列表:
 * - 9个武器(各2变体): 魔杖,飞刀,斧头,十字架,火球,手里剑,冰锥,毒镖,闪电
 * - 5个系统(各1变体): 冲刺,金币,经验,武器进化,开门
 * 
 * 总计: (9×2) + (5×1) = 23次调用 = 4,600积分
 * 
 * 已排除:
 * - 鞭子,镰刀(用户已生成)
 * - 辉耀,圣经,圣水(持续型无需音效)
 * - 环刃(移除武器)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 读取API密钥
function getApiKey() {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf-8');
        const match = env.match(/ELEVENLABS_API_KEY=([\w-]+)/);
        if (match) return match[1];
    }
    return process.env.ELEVENLABS_API_KEY;
}

// 调用API
async function generateSound(prompt, apiKey) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            text: prompt,
            voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        });
        
        const options = {
            hostname: 'api.elevenlabs.io',
            port: 443,
            path: '/v1/sound-generation',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey,
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            if (res.statusCode === 200) {
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            } else {
                let errorData = '';
                res.on('data', chunk => errorData += chunk);
                res.on('end', () => reject(new Error(`${res.statusCode}: ${errorData}`)));
            }
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ========== 音效配置 ==========
const SOUNDS = [
    // --- 武器 (2变体) ---
    {
        id: 'wand_cast',
        name: '魔杖',
        category: 'weapon',
        prompt: 'Magic wand casting sound, soft sparkly shimmer, high pitched magical ping, airy mystical, video game SFX, 0.2 seconds'
    },
    {
        id: 'knife_throw',
        name: '飞刀',
        category: 'weapon',
        prompt: 'Sharp knife throwing sound, quick metallic slice through air, swift and precise, ninja assassin weapon, video game SFX, 0.08 seconds'
    },
    {
        id: 'axe_throw',
        name: '斧头',
        category: 'weapon',
        prompt: 'Heavy axe spinning throw, deep whoosh with rotation, impact thud, barbarian weapon, video game SFX, 0.1 seconds'
    },
    {
        id: 'cross_launch',
        name: '十字架',
        category: 'weapon',
        prompt: 'Holy cross projectile launch, blessed metal sound, light chime with whoosh, angelic pure, video game SFX, 0.15 seconds'
    },
    {
        id: 'fireball',
        name: '火球',
        category: 'weapon',
        prompt: 'Fireball launch sound, flame burst with whoosh, crackling fire energy, deep rumble start, video game SFX, 0.3 seconds'
    },
    {
        id: 'shuriken',
        name: '手里剑',
        category: 'weapon',
        prompt: 'Ninja star throw, sharp metal spinning, quick multiple swishes, stealthy and fast, video game SFX, 0.1 seconds'
    },
    {
        id: 'icicle',
        name: '冰锥',
        category: 'weapon',
        prompt: 'Ice crystal launch, sharp crystalline ping, frozen whoosh, magical frost sound, video game SFX, 0.2 seconds'
    },
    {
        id: 'dart_shoot',
        name: '毒镖',
        category: 'weapon',
        prompt: 'Blow dart shoot sound, soft puff with whistle, subtle poison hiss, stealth weapon, video game SFX, 0.1 seconds'
    },
    {
        id: 'lightning',
        name: '闪电',
        category: 'weapon',
        prompt: 'Lightning zap sound, electric crackle burst, high energy discharge, sharp and shocking, video game SFX, 0.05 seconds'
    },
    
    // --- 系统音效 (1变体) ---
    {
        id: 'dash',
        name: '冲刺',
        category: 'system',
        prompt: 'Quick dash swoosh sound, fast air displacement, swift movement whoosh, ninja dash, video game SFX, 0.15 seconds'
    },
    {
        id: 'coin_pickup',
        name: '金币',
        category: 'system',
        prompt: 'Coin pickup sound, bright metallic ching, satisfying gold collection, treasure RPG, video game SFX, 0.1 seconds'
    },
    {
        id: 'exp_gain',
        name: '经验',
        category: 'system',
        prompt: 'Experience gain sound, magical chime shimmer, level up essence, ethereal ascending, video game SFX, 0.2 seconds'
    },
    {
        id: 'weapon_evolve',
        name: '进化',
        category: 'system',
        prompt: 'Weapon evolution sound, powerful magical transformation, epic upgrade chime, divine enhancement, video game SFX, 0.5 seconds'
    },
    {
        id: 'door_open',
        name: '开门',
        category: 'system',
        prompt: 'Dungeon door opening sound, heavy stone creak, mysterious ancient gate, ominous entrance, video game SFX, 0.4 seconds'
    },
];

const WEAPON_VARIANTS = 2;
const SYSTEM_VARIANTS = 1;

const weaponCount = SOUNDS.filter(s => s.category === 'weapon').length;
const systemCount = SOUNDS.filter(s => s.category === 'system').length;
const TOTAL_CALLS = (weaponCount * WEAPON_VARIANTS) + (systemCount * SYSTEM_VARIANTS);
const ESTIMATED_COST = TOTAL_CALLS * 200;

// 主函数
async function main() {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        console.error('❌ 未找到 API 密钥');
        console.log('请在 .env 文件中设置 ELEVENLABS_API_KEY=你的密钥');
        process.exit(1);
    }
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║  🎵 游戏音效生成器 - 武器 + 系统音效                                             ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════════════════╣');
    console.log('║  【武器】魔杖,飞刀,斧头,十字架,火球,手里剑,冰锥,毒镖,闪电 (各2变体)              ║');
    console.log('║  【系统】冲刺,金币,经验,进化,开门 (各1变体)                                       ║');
    console.log('║  【排除】鞭子,镰刀(已生成) | 辉耀,圣经,圣水(持续型) | 环刃(已移除)               ║');
    console.log('╠═══════════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║  费用: ${weaponCount}武器×${WEAPON_VARIANTS} + ${systemCount}系统×${SYSTEM_VARIANTS} = ${TOTAL_CALLS}次调用 × 200积分 = ${ESTIMATED_COST}积分                     ║`);
    console.log('╚═══════════════════════════════════════════════════════════════════════════════════╝');
    console.log('');
    
    const outputDir = path.join(__dirname, '..', 'generated_audio');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    let completed = 0;
    let failed = 0;
    
    console.log('🎹 开始生成...');
    
    for (const sound of SOUNDS) {
        const variants = sound.category === 'weapon' ? WEAPON_VARIANTS : SYSTEM_VARIANTS;
        process.stdout.write(`   ${sound.name.padEnd(6)} ${sound.category === 'system' ? '[系]' : '[武]'} ... `);
        
        const promises = [];
        for (let v = 1; v <= variants; v++) {
            promises.push(
                generateSound(sound.prompt, apiKey)
                    .then(buffer => {
                        const filename = variants === 1 
                            ? `${sound.id}.mp3` 
                            : `${sound.id}_v${v}.mp3`;
                        fs.writeFileSync(path.join(outputDir, filename), buffer);
                        completed++;
                        return true;
                    })
                    .catch(err => {
                        console.error(`\n     ❌ v${v}: ${err.message}`);
                        failed++;
                        return false;
                    })
            );
        }
        
        await Promise.all(promises);
        process.stdout.write('✓\n');
        
        // 延迟避免API限制
        await new Promise(r => setTimeout(r, 300));
    }
    
    console.log('');
    console.log('═════════════════════════════════════════════════════════════════════════════════════');
    console.log(`✅ 完成: ${completed}/${TOTAL_CALLS}  ${failed > 0 ? `| ❌ 失败: ${failed}` : ''}`);
    console.log('📁 输出: generated_audio/');
    console.log('📊 实际消耗: ' + (completed * 200) + '积分');
    console.log('');
    console.log('使用方法:');
    console.log('   1. 武器: 打开 scripts/sound-selector.html 选择最佳变体');
    console.log('   2. 系统: 直接使用生成的 dash.mp3, coin_pickup.mp3 等');
    console.log('   3. 复制到 assets/audio/ 目录');
}

main().catch(console.error);
