#!/usr/bin/env node
/**
 * ElevenLabs Audio Generator
 * v0.26 - 自动生成游戏音效并创建选择器
 * 
 * 使用方法:
 * 1. 在 .env 文件填入 ELEVENLABS_API_KEY=你的密钥
 * 2. 运行: node scripts/generate-audio-elevenlabs.js
 * 3. 打开 generated-audio-selector.html 选择最佳音效
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 音效配置
const SOUNDS = [
    // 武器攻击
    { id: 'whip_crack', name: '鞭子攻击', prompt: 'Sharp leather whip crack, air whoosh, crisp and fast, video game SFX, 0.1 seconds', category: 'weapon' },
    { id: 'scythe_slash', name: '镰刀挥砍', prompt: 'Heavy scythe slash sound, blade cutting through air, metallic whoosh, medieval weapon, 0.15 seconds', category: 'weapon' },
    { id: 'wand_cast', name: '魔杖施法', prompt: 'Magic wand casting sound, soft sparkly shimmer, high pitched magical ping, airy mystical, 0.2 seconds', category: 'weapon' },
    { id: 'knife_throw', name: '飞刀投掷', prompt: 'Sharp knife throwing sound, quick metallic slice through air, swift and precise, assassin weapon, 0.08 seconds', category: 'weapon' },
    { id: 'axe_throw', name: '斧头投掷', prompt: 'Heavy axe spinning throw, deep whoosh with rotation, impact thud, barbarian weapon, 0.1 seconds', category: 'weapon' },
    { id: 'cross_launch', name: '十字架发射', prompt: 'Holy cross projectile launch, blessed metal sound, light chime with whoosh, angelic pure, 0.15 seconds', category: 'weapon' },
    { id: 'fireball', name: '火球术', prompt: 'Fireball launch sound, flame burst with whoosh, crackling fire energy, deep rumble start, 0.3 seconds', category: 'weapon' },
    { id: 'shuriken', name: '手里剑', prompt: 'Ninja star throw, sharp metal spinning, quick multiple swishes, stealthy and fast, 0.1 seconds', category: 'weapon' },
    { id: 'icicle', name: '冰锥', prompt: 'Ice crystal launch, sharp crystalline ping, frozen whoosh, magical frost sound, 0.2 seconds', category: 'weapon' },
    { id: 'dart_shoot', name: '毒镖', prompt: 'Blow dart shoot sound, soft puff with whistle, subtle poison hiss, stealth weapon, 0.1 seconds', category: 'weapon' },
    { id: 'lightning', name: '闪电', prompt: 'Lightning zap sound, electric crackle burst, high energy discharge, sharp and shocking, 0.05 seconds', category: 'weapon' },
    { id: 'laser', name: '激光', prompt: 'Laser beam fire sound, high energy discharge, sci-fi weapon blast, sharp and piercing, 0.15 seconds', category: 'weapon' },
    
    // 命中音效
    { id: 'hit_flesh', name: '命中肉体', prompt: 'Sword hitting flesh impact, wet squish with thud, organic damage sound, visceral, 0.08 seconds', category: 'hit' },
    { id: 'hit_shell', name: '命中甲壳', prompt: 'Weapon hitting hard shell, dry crack impact, insect carapace break, sharp brittle sound, 0.08 seconds', category: 'hit' },
    { id: 'hit_fur', name: '命中毛皮', prompt: 'Blade cutting through fur, soft fabric tear, muffled impact, beast damage, 0.08 seconds', category: 'hit' },
    { id: 'hit_slime', name: '命中粘液', prompt: 'Weapon hitting slime, wet squelch splash, gooey impact, jelly creature damage, 0.1 seconds', category: 'hit' },
    { id: 'crit_hit', name: '暴击', prompt: 'Critical strike impact, heavy metal crunch with power, deep bass thud, satisfying damage ping, 0.15 seconds', category: 'hit' },
    
    // 玩家动作
    { id: 'dash', name: '冲刺', prompt: 'Quick dash whoosh, air displacement sound, fast movement blur, ninja speed effect, 0.15 seconds', category: 'player' },
    { id: 'coin_pickup', name: '拾取金币', prompt: 'Gold coin pickup sound, bright metallic ching, satisfying treasure, rpg item collect, 0.1 seconds', category: 'player' },
    { id: 'gem_pickup', name: '拾取经验', prompt: 'Blue gem collect sound, magical chime sparkle, ethereal and light, level up essence, 0.1 seconds', category: 'player' },
    { id: 'level_up', name: '升级', prompt: 'Player level up fanfare, rising magical chimes, power surge sparkle, triumph and growth, 0.5 seconds', category: 'player' },
    { id: 'player_hurt', name: '受伤', prompt: 'Player taking damage grunt, pain impact sound, breath hit and low oof, character hurt, 0.15 seconds', category: 'player' },
    
    // 环境交互
    { id: 'chest_open', name: '开宝箱', prompt: 'Treasure chest unlock, metal latch click, wooden creak reveal, rpg loot box, 0.4 seconds', category: 'env' },
    { id: 'buy_item', name: '购买', prompt: 'Gold spend sound, coins clinking away, transaction complete, merchant shop buy, 0.2 seconds', category: 'env' },
    { id: 'explosion', name: '爆炸', prompt: 'Fireball explosion impact, flame burst and debris, rumble boom, area damage effect, 0.3 seconds', category: 'env' },
    { id: 'enemy_spawn', name: '敌人生成', prompt: 'Monster spawn sound, dark portal emergence, slime materialize, dungeon creature appear, 0.3 seconds', category: 'env' },
    
    // UI音效
    { id: 'button_click', name: '按钮点击', prompt: 'UI button click, soft mechanical tap, interface select, clean, 0.05 seconds', category: 'ui' },
    { id: 'heal', name: '治疗', prompt: 'Health restore, warm magical glow, rising chime, recovery, 0.3 seconds', category: 'ui' },
];

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

// 调用ElevenLabs API生成音效
async function generateSound(prompt, apiKey) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            text: prompt,
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
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
                res.on('end', () => reject(new Error(`API Error ${res.statusCode}: ${errorData}`)));
            }
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// 主函数
async function main() {
    const apiKey = getApiKey();
    
    if (!apiKey) {
        console.error('❌ 错误: 未找到 ElevenLabs API 密钥');
        console.log('');
        console.log('请在项目根目录创建 .env 文件，内容如下:');
        console.log('ELEVENLABS_API_KEY=你的API密钥');
        console.log('');
        console.log('获取API密钥: https://elevenlabs.io/');
        process.exit(1);
    }
    
    console.log('🎵 ElevenLabs 音效生成器 v0.26');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    // 创建输出目录
    const outputDir = path.join(__dirname, '..', 'generated_audio');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 为每个音效生成4个变体（并行请求加速）
    const variants = 4;
    const total = SOUNDS.length * variants;
    let completed = 0;
    let failed = 0;
    
    console.log(`将为 ${SOUNDS.length} 个音效生成 ${variants} 个变体`);
    console.log(`总计: ${total} 个音频文件`);
    console.log('');
    console.log('注意: ElevenLabs API 每次请求生成1个，脚本将并行发送4次请求模拟"变体"功能');
    console.log('');
    
    const results = [];
    
    for (const sound of SOUNDS) {
        process.stdout.write(`\n🎵 ${sound.name}... `);
        
        const soundResults = {
            id: sound.id,
            name: sound.name,
            category: sound.category,
            files: []
        };
        
        // 并行生成4个变体
        const variantPromises = [];
        for (let v = 1; v <= variants; v++) {
            const filename = `${sound.id}_v${v}.mp3`;
            const filepath = path.join(outputDir, filename);
            
            variantPromises.push(
                generateSound(sound.prompt, apiKey)
                    .then(audioBuffer => {
                        fs.writeFileSync(filepath, audioBuffer);
                        completed++;
                        process.stdout.write(`✓`);
                        return { variant: v, filename, path: filepath, success: true };
                    })
                    .catch(err => {
                        failed++;
                        process.stdout.write(`✗`);
                        console.error(`\n  ❌ ${sound.id} v${v}: ${err.message}`);
                        return { variant: v, filename, path: filepath, success: false };
                    })
            );
        }
        
        // 等待所有4个变体完成
        const variantResults = await Promise.all(variantPromises);
        
        // 添加延迟避免API限制
        await new Promise(r => setTimeout(r, 500));
        
        // 过滤成功的
        soundResults.files = variantResults.filter(r => r.success);
        results.push(soundResults);
    }
    
    console.log('');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ 生成完成: ${completed}/${total}`);
    if (failed > 0) console.log(`❌ 失败: ${failed}`);
    console.log('');
    
    // 生成选择器HTML
    generateSelectorHTML(results, outputDir);
    
    console.log('📂 文件保存位置:', outputDir);
    console.log('🌐 选择器页面: generated-audio-selector.html');
    console.log('');
    console.log('请在浏览器打开 generated-audio-selector.html 选择最佳音效');
}

// 生成音频选择器HTML
function generateSelectorHTML(results, outputDir) {
    const htmlPath = path.join(__dirname, '..', 'generated-audio-selector.html');
    
    const categories = {
        weapon: '⚔️ 武器攻击',
        hit: '💥 命中音效',
        player: '🎮 玩家动作',
        env: '🌍 环境交互',
        ui: '🖱️ UI音效'
    };
    
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎵 游戏音效选择器</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #1a1a2e;
            color: #fff;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            text-align: center;
            margin-bottom: 10px;
            color: #4f4;
        }
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 30px;
        }
        .category {
            margin-bottom: 40px;
        }
        .category-title {
            font-size: 1.3em;
            color: #48f;
            border-bottom: 2px solid #48f;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .sound-row {
            background: #2a2a4e;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        .sound-name {
            font-weight: bold;
            min-width: 120px;
            font-size: 1.1em;
        }
        .sound-id {
            color: #888;
            font-size: 0.85em;
            font-family: monospace;
        }
        .variants {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            flex: 1;
        }
        .variant {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
        }
        .play-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: 2px solid #4f4;
            background: transparent;
            color: #4f4;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            transition: all 0.2s;
        }
        .play-btn:hover {
            background: #4f4;
            color: #000;
        }
        .play-btn.playing {
            background: #f44;
            border-color: #f44;
            color: #fff;
        }
        .variant-label {
            font-size: 0.8em;
            color: #888;
        }
        .select-radio {
            margin-top: 5px;
        }
        .actions {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: #1a1a2e;
            border-top: 2px solid #48f;
            padding: 20px;
            display: flex;
            justify-content: center;
            gap: 20px;
            z-index: 100;
        }
        .btn {
            padding: 12px 30px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            font-weight: bold;
            transition: all 0.2s;
        }
        .btn-primary {
            background: #4f4;
            color: #000;
        }
        .btn-primary:hover {
            background: #6f6;
        }
        .btn-secondary {
            background: #48f;
            color: #fff;
        }
        .progress {
            text-align: center;
            margin-bottom: 20px;
            color: #888;
        }
        .selected-count {
            color: #4f4;
            font-weight: bold;
        }
        audio { display: none; }
    </style>
</head>
<body>
    <h1>🎵 游戏音效选择器</h1>
    <p class="subtitle">为每个音效选择最佳变体，然后导出到项目</p>
    
    <div class="progress">
        已选择: <span class="selected-count" id="selectedCount">0</span> / ${results.length}
    </div>
`;

    // 按分类生成
    for (const [catKey, catName] of Object.entries(categories)) {
        const catSounds = results.filter(r => r.category === catKey);
        if (catSounds.length === 0) continue;
        
        html += `
    <div class="category">
        <h2 class="category-title">${catName}</h2>
`;
        
        for (const sound of catSounds) {
            html += `
        <div class="sound-row">
            <div>
                <div class="sound-name">${sound.name}</div>
                <div class="sound-id">${sound.id}</div>
            </div>
            <div class="variants">
`;
            
            for (const file of sound.files) {
                html += `
                <div class="variant">
                    <button class="play-btn" onclick="playAudio('${file.filename}', this)" data-file="generated_audio/${file.filename}">▶</button>
                    <span class="variant-label">变体 ${file.variant}</span>
                    <input type="radio" name="${sound.id}" value="${file.variant}" class="select-radio" onchange="updateCount()">
                </div>
`;
            }
            
            html += `
            </div>
        </div>
`;
        }
        
        html += `
    </div>
`;
    }

    html += `
    <div class="actions">
        <button class="btn btn-secondary" onclick="playAllSelected()">▶ 试听所有选择</button>
        <button class="btn btn-primary" onclick="exportSelected()">💾 导出选中音效</button>
    </div>
    
    <script>
        const selected = {};
        
        function playAudio(filename, btn) {
            // 停止其他音频
            document.querySelectorAll('audio').forEach(a => a.remove());
            document.querySelectorAll('.play-btn').forEach(b => b.classList.remove('playing'));
            
            const audio = new Audio('generated_audio/' + filename);
            audio.play();
            btn.classList.add('playing');
            
            audio.onended = () => {
                btn.classList.remove('playing');
            };
        }
        
        function updateCount() {
            const radios = document.querySelectorAll('input[type="radio"]:checked');
            document.getElementById('selectedCount').textContent = radios.length;
        }
        
        function playAllSelected() {
            const selected = document.querySelectorAll('input[type="radio"]:checked');
            if (selected.length === 0) {
                alert('请先选择音效！');
                return;
            }
            
            let i = 0;
            function playNext() {
                if (i >= selected.length) return;
                const radio = selected[i];
                const soundId = radio.name;
                const variant = radio.value;
                const btn = radio.closest('.variant').querySelector('.play-btn');
                playAudio('' + soundId + '_v' + variant + '.mp3', btn);
                i++;
                setTimeout(playNext, 800);
            }
            playNext();
        }
        
        function exportSelected() {
            const selected = document.querySelectorAll('input[type="radio"]:checked');
            if (selected.length === 0) {
                alert('请先选择音效！');
                return;
            }
            
            const selections = [];
            selected.forEach(radio => {
                selections.push({
                    id: radio.name,
                    variant: radio.value,
                    filename: radio.name + '_v' + radio.value + '.mp3'
                });
            });
            
            // 创建下载JSON
            const data = JSON.stringify(selections, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'selected-sounds.json';
            a.click();
            
            alert('已导出 ' + selections.length + ' 个音效选择！\\n请将选中的文件复制到 assets/audio/ 目录');
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);
}

// 运行
main().catch(console.error);
