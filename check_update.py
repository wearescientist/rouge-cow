with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找 update 函数中的武器处理
idx = content.find('update(dt)')
print('update(dt) 位置:', idx)

# 查找 for of this.weapons
idx2 = content.find('for (const weapon of this.weapons)')
print('weapon of this.weapons:', idx2)

idx3 = content.find('for (const w of this.weapons)')
print('w of this.weapons:', idx3)

# 查找 nearestEnemy
idx4 = content.find('nearestEnemy')
print('nearestEnemy:', idx4)
if idx4 > 0:
    print(content[idx4-200:idx4+200])
