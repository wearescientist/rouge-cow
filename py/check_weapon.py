with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找武器开火代码
idx = content.find('w.canFire()')
print('w.canFire() 位置:', idx)
if idx > 0:
    print(content[idx-200:idx+200])
