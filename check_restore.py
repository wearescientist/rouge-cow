with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('文件大小:', len(content), '字符')

# 检查关键特性
features = [
    ('武器选择弹窗', 'weapon-select'),
    ('波次管理器', 'WaveManager'),
    ('相机系统', 'SurvivorCamera'),
    ('22种敌人', 'turtle'),
    ('商店系统', 'ShopNPC'),
    ('图腾系统', 'TotemManager'),
    ('图鉴系统', 'evolutionOpen'),
]

print('\n功能检查:')
for name, keyword in features:
    found = keyword in content
    status = 'OK' if found else 'MISS'
    print(f'  {status}: {name}')

# 检查版本号
version_idx = content.find('v0.9')
if version_idx > 0:
    print('\n版本:', content[version_idx:version_idx+10])
