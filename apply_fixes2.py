with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('开始修复...')

# 修复 1: emoji 白色背景
old_emoji = """const emojiMap = {
                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕',
                cat: '🐱', bear: '🐻', rabbit: '🦘', bird: '🦅',
                turtle: '🐢', dog2: '🐺'
            };
            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(emojiMap[this.sprite] || '👾', this.x, this.y + 8);"""

new_emoji = """const emojiMap = {
                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕',
                cat: '🐱', bear: '🐻', rabbit: '🐰', rabbit2: '🐇',
                bird: '🐦', turtle: '🐢', dog2: '🐺', mouse: '🐭',
                snail: '🐌', pigeon: '🕊️', duck: '🦆', duck2: '🦆',
                duck3: '🐥', squirrel: '🐿️', goose: '🪿',
                snake: '🐍', crab: '🦀', pig2: '🐖'
            };
            ctx.fillStyle = '#fff';  // 防止黑色背景
            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(emojiMap[this.sprite] || '👾', this.x, this.y + 8);"""

if old_emoji in content:
    content = content.replace(old_emoji, new_emoji)
    print('OK: emoji 修复 + 更多emoji')
else:
    print('FAIL: 未找到 emoji 代码')

# 修复 2: 版本号
if 'v0.8.1 全屏适配+冲刺' in content:
    content = content.replace('v0.8.1 全屏适配+冲刺', 'v0.9.5-fix 贴图+emoji修复')
    print('OK: 版本号')

# 保存
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('完成！')
