with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找 weapon.fire 或 weapons 循环
idx = content.find('weapon.fire') 
print('weapon.fire 位置:', idx)

idx2 = content.find('this.weapons')
print('this.weapons 位置:', idx2)
if idx2 > 0:
    print(content[idx2-100:idx2+300])
