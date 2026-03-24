#!/usr/bin/env node
/**
 * ElevenLabs Audio Generator - Optimized for 10K credits
 * v0.26 - 优化版：核心音效2变体，次要音效1变体
 * 跳过已生成的鞭子和镰刀
 * 总计: 41次调用 = 8,200积分 < 10,000限制
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

// 调用ElevenLabs API
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
                res.on('end', () => reject(new Error(`API ${res.statusCode}: ${errorData}`)));
            }
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ========== 音效配置 ==========
// 核心音效(武器/命中): 2变体 | 次要音效(玩家/环境/UI): 1变体
// 跳过: whip_crack(鞭子)、scythe_slash(镰刀) 已由用户生成

const CORE_SOUNDS = [
    // 武器攻击 - 2变体
    { id: 'wand_cast', name: '魔杖施法', prompt: 'Magic wand casting sound, soft sparkly shimmer, high pitched magical ping, airy mystical, 0.2 seconds' },
    { id: 'knife_throw', name: '飞刀投掷', prompt: 'Sharp knife throwing sound, quick metallic slice through air, swift and precise, assassin weapon, 0.08 seconds' },
    { id: 'axe_throw', name: '斧头投掷', prompt: 'Heavy axe spinning throw, deep whoosh with rotation, impact thud, barbarian weapon, 0.1 seconds' },
    { id: 'cross_launch', name: '十字架发射', prompt: 'Holy cross projectile launch, blessed metal sound, light chime with whoosh, angelic pure, 0.15 seconds' },
    { id: 'fireball', name: '火球术', prompt: 'Fireball launch sound, flame burst with whoosh, crackling fire energy, deep rumble start, 0.3 seconds' },
    { id: 'shuriken', name: '手里剑', prompt: 'Ninja star throw, sharp metal spinning, quick multiple swishes, stealthy and fast, 0.1 seconds' },
    { id: 'icicle', name: '冰锥', prompt: 'Ice crystal launch, sharp crystalline ping, frozen whoosh, magical frost sound, 0.2 seconds' },
    { id: 'dart_shoot', name: '毒镔', prompt: 'Blow dart shoot sound, soft puff with whistle, subtle poison hiss, stealth weapon, 0.1 seconds' },
    { id: 'lightning', name: '闪电', prompt: 'Lightning zap sound, electric crackle burst, high energy discharge, sharp and shocking, 0.05 seconds' },
    { id: 'laser', name: '激光', prompt: 'Laser beam fire sound, high energy discharge, sci-fi weapon blast, sharp and piercing, 0.15 seconds' },
    // 命中音效 - 2变体
    { id: 'hit_flesh', name: '命中肉体', prompt: 'Sword hitting flesh impact, wet squish with thud, organic damage sound, visceral, 0.08 seconds' },
    { id: 'hit_shell', name: '命中甲壳', prompt: 'Weapon hitting hard shell, dry crack impact, insect carapace break, sharp brittle sound, 0.08 seconds' },
    { id: 'hit_fur', name: '命中毛皮', prompt: 'Blade cutting through fur, soft fabric tear, muffled impact, beast damage, 0.08 seconds' },
    { id: 'hit_slime', name: '命中粘液', prompt: 'Weapon hitting slime, wet squelch splash, gooey impact, jelly creature damage, 0.1 seconds' },
    { id: 'crit_hit', name: '暴击', prompt: 'Critical strike impact, heavy metal crunch with power, deep bass thud, satisfying damage ping, 0.15 seconds' },
];

const SECONDARY_SOUNDS = [
    // 玩家动作 - 1变体
    { id: 'dash', name: '冲刺', prompt: 'Quick dash whoosh, air displacement sound, fast movement blur, ninja speed effect, 0.15 seconds' },
    { id: 'coin_pickup', name: '拾取金币', prompt: 'Gold coin pickup sound, bright metallic ching, satisfying treasure, rpg item collect, 0.1 seconds' },
    { id: 'gem_pickup', name: '拾取经验', prompt: 'Blue gem collect sound, magical chime sparkle, ethereal and light, level up essence, 0.1 seconds' },
    { id: 'level_up', name: '升级', prompt: 'Player level up fanfare, rising magical chimes, power surge sparkle, triumph and growth, 0.5 seconds' },
    { id: 'player_hurt', name: '受伤', prompt: 'Player taking damage grunt, pain impact sound, breath hit and low oof, character hurt, 0.15 seconds' },
    // 环境交互 - 1变体
    { id: 'chest_open', name: '开宝箱', prompt: 'Treasure chest unlock, metal latch click, wooden creak reveal, rpg loot box, 0.4 seconds' },
    { id: 'buy_item', name: '购买', prompt: 'Gold spend sound, coins clinking away, transaction complete, merchant shop buy, 0.2 seconds' },
    { id: 'explosion', name: '爆炸', prompt: 'Fireball explosion impact, flame burst and debris, rumble boom, area damage effect, 0.3 seconds' },
    { id: 'enemy_spawn', name: '敌人生成', prompt: 'Monster spawn sound, dark portal emergence, slime materialize, dungeon creature appear, 0.3 seconds' },
    // UI音效 - 1变体
    { id: 'button_click', name: '按钮点击', prompt: 'UI button click, soft mechanical tap, interface select, clean, 0.05 seconds' },
    { id: 'heal', name: '治疗', prompt: 'Health restore, warm magical glow, rising chime, recovery, 0.3 seconds' },
];

// 计算总费用
const CORE_VARIANTS = 2;
const SECONDARY_VARIANTS = 1;
const TOTAL_CALLS = (CORE_SOUNDS.length * CORE_VARIANTS) + (SECONDARY_SOUNDS.length * SECONDARY_VARIANTS);
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
    console.log('🎵 ElevenLabs 音效生成器 (优化版)');
    console.log('══════════════════════════════════════════════════════');
    console.log('');
    console.log('📊 费用估算:');
    console.log(`   核心音效: ${CORE_SOUNDS.length}个 × ${CORE_VARIANTS}变体 = ${CORE_SOUNDS.length * CORE_VARIANTS}次调用`);
    console.log(`   次要音效: ${SECONDARY_SOUNDS.length}个 × ${SECONDARY_VARIANTS}变体 = ${SECONDARY_SOUNDS.length * SECONDARY_VARIANTS}次调用`);
    console.log(`   总计: ${TOTAL_CALLS}次调用 × 200积分 = ${ESTIMATED_COST.toLocaleString()}积分`);
    console.log(`   余额预估: ${(10000 - ESTIMATED_COST).toLocaleString()}积分`);
    console.log('');
    console.log('⚠️ 跳过已生成: 鞭子(whip_crack)、镰刀(scythe_slash)');
    console.log('');
    
    // 创建输出目录
    const outputDir = path.join(__dirname, '..', 'generated_audio');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    
    const results = [];
    let completed = 0;
    let failed = 0;
    
    // 生成核心音效 (2变体)
    console.log('🎹 生成核心音效 (武器/命中) - 每个2个变体...');
    for (const sound of CORE_SOUNDS) {
        process.stdout.write(`   ${sound.name}... `);
        const soundResults = { id: sound.id, name: sound.name, category: 'core', files: [] };
        
        // 并行生成2个变体
        const promises = [1, 2].map(v => 
            generateSound(sound.prompt, apiKey)
                .then(buffer => {
                    const filename = `${sound.id}_v${v}.mp3`;
                    fs.writeFileSync(path.join(outputDir, filename), buffer);
                    completed++;
                    return { variant: v, filename, success: true };
                })
                .catch(err => {
                    console.error(`\n     ❌ v${v}: ${err.message}`);
                    failed++;
                    return { variant: v, success: false };
                })
        );
        
        const variants = await Promise.all(promises);
        soundResults.files = variants.filter(v => v.success);
        results.push(soundResults);
        process.stdout.write('✓\n');
        
        // 延迟避免API限制
        await new Promise(r => setTimeout(r, 300));
    }
    
    // 生成次要音效 (1变体)
    console.log('');
    console.log('🎹 生成次要音效 (玩家/环境/UI) - 每个1个变体...');
    for (const sound of SECONDARY_SOUNDS) {
        process.stdout.write(`   ${sound.name}... `);
        
        try {
            const buffer = await generateSound(sound.prompt, apiKey);
            const filename = `${sound.id}.mp3`;
            fs.writeFileSync(path.join(outputDir, filename), buffer);
            completed++;
            results.push({ id: sound.id, name: sound.name, category: 'secondary', files: [{ variant: 1, filename }] });
            process.stdout.write('✓\n');
        } catch (err) {
            console.error(`\n     ❌ ${err.message}`);
            failed++;
        }
        
        await new Promise(r => setTimeout(r, 200));
    }
    
    // 完成汇总
    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log(`✅ 完成: ${completed}/${TOTAL_CALLS}`);
    if (failed > 0) console.log(`❌ 失败: ${failed}`);
    console.log('');
    console.log('📁 输出目录: generated_audio/');
    console.log('📊 预计消耗积分: ' + (completed * 200).toLocaleString());
    console.log('');
    console.log('下一步:');
    console.log('   1. 检查 generated_audio/ 目录下的音频文件');
    console.log('   2. 核心音效(武器/命中)每个有2个变体(_v1, _v2)，选择最佳');
    console.log('   3. 次要音效直接使用(只有1个)');
    console.log('   4. 将选中的音效复制到 assets/audio/ 目录');
}

main().catch(console.error);
