/**
 * 配置测试脚本 - 验证环境是否正确
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 环境配置测试\n');

// 测试1: 检查项目结构
console.log('1️⃣ 检查项目结构...');
const projectRoot = path.resolve(__dirname, '..', '..');
const indexHtml = path.join(projectRoot, 'index.html');

console.log(`   项目根目录: ${projectRoot}`);
console.log(`   index.html: ${indexHtml}`);
console.log(`   文件存在: ${fs.existsSync(indexHtml) ? '✅' : '❌'}`);

if (!fs.existsSync(indexHtml)) {
    console.error('\n❌ 错误: 找不到 index.html');
    console.log('请确保目录结构正确：');
    console.log('  rougelike-cow/');
    console.log('  ├── index.html');
    console.log('  └── archive/ai_training/');
    process.exit(1);
}

// 测试2: 检查依赖
console.log('\n2️⃣ 检查依赖...');
try {
    const pkg = require('./package.json');
    console.log(`   项目名称: ${pkg.name}`);
    console.log(`   版本: ${pkg.version}`);
    
    const playwrightPath = path.join(__dirname, 'node_modules', 'playwright');
    console.log(`   Playwright安装: ${fs.existsSync(playwrightPath) ? '✅' : '❌ (运行 npm install)'}`);
} catch (e) {
    console.log('   ❌ package.json 读取失败');
}

// 测试3: 目录权限
console.log('\n3️⃣ 检查目录权限...');
const dirs = ['data', 'videos'];
dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        try {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`   ${dir}/: 已创建 ✅`);
        } catch (e) {
            console.log(`   ${dir}/: 创建失败 ❌ (${e.message})`);
        }
    } else {
        console.log(`   ${dir}/: 已存在 ✅`);
    }
});

// 测试4: 生成测试URL
console.log('\n4️⃣ 生成游戏URL...');
const gameUrl = `file:///${projectRoot.replace(/\\/g, '/')}/index.html`;
console.log(`   URL: ${gameUrl}`);

console.log('\n========================================');
console.log('   🎉 配置测试完成！');
console.log('========================================');
console.log('\n运行训练：');
console.log('  node play_game_windows.js 0 1');
