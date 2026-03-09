with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找 bullets.push 周围的代码
idx = content.find('bullets.push')
print('bullets.push 位置:', idx)
if idx > 0:
    print(content[idx-500:idx+500])
