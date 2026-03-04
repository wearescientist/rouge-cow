import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('开始应用修复...')

# 修复 1: 添加贴图版本号 ?v=095
old_load = "const basePath = 'https://wearescientist.github.io/rouge-cow/assets/sprites/';"
new_load = "const version = '?v=095';\n        const basePath = 'https://wearescientist.github.io/rouge-cow/assets/sprites/';"

if old_load in content:
    content = content.replace(old_load, new_load)
    print('OK: 贴图版本号')
else:
    print('FAIL: 未找到 basePath')

# 修复 2: 添加更多敌人
old_enemies = "const enemies = ['chick', 'pig', 'sheep', 'dog', 'cat', 'bear'];"
new_enemies = """const allEnemies = [
            'chick', 'mouse', 'snail', 'pigeon', 'duck3',
            'rabbit', 'rabbit2', 'bird', 'duck2', 'pig2',
            'cat', 'duck', 'squirrel', 'goose',
            'dog', 'pig', 'sheep', 'snake',
            'bear', 'crab', 'dog2',
            'turtle'
        ];"""

if old_enemies in content:
    content = content.replace(old_enemies, new_enemies)
    # 同时修改循环变量
    content = content.replace("for (const name of enemies) {", "for (const name of allEnemies) {")
    # 添加版本号到 URL
    content = content.replace("basePath + name + '.png'", "basePath + name + '.png' + version")
    content = content.replace("basePath + 'player_cow.png'", "basePath + 'player_cow.png' + version")
    print('OK: 更多敌人 + 版本号')
else:
    print('FAIL: 未找到 enemies 数组')

# 修复 3: emoji 白色背景
old_emoji = "// 绘制emoji\n            ctx.font = this.isBoss"
new_emoji = "// 绘制emoji\n            ctx.fillStyle = '#fff';  // 防止黑色背景\n            ctx.font = this.isBoss"

if old_emoji in content:
    content = content.replace(old_emoji, new_emoji)
    print('OK: emoji 白色背景')
else:
    print('FAIL: 未找到 emoji 绘制')

# 修复 4: drawWithOffset emoji
old_offset = "// 绘制emoji\n            ctx.font = this.isBoss"
if old_offset in content:
    count = content.count(old_offset)
    if count >= 2:
        # 替换第二次出现
        parts = content.split(old_offset)
        if len(parts) >= 3:
            content = parts[0] + old_emoji + parts[1] + new_emoji + old_offset.join(parts[2:])
            print('OK: drawWithOffset emoji')
    else:
        print('SKIP: drawWithOffset 可能只有一个')

# 修复 5: 版本号
content = content.replace('v0.8.1 全屏适配+冲刺', 'v0.9.5-fix 贴图修复版')
print('OK: 版本号')

# 保存
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('完成！')
