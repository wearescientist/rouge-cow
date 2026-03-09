with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找 for (const w of this.weapons) 周围代码
idx = content.find('for (const w of this.weapons)')
print('位置:', idx)
if idx > 0:
    print(content[idx-100:idx+400])
