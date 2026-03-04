with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 查找武器相关代码
for kw in ['canFire', 'weapons', 'bullets.push']:
    idx = content.find(kw)
    print(f'{kw}: {idx}')
    if idx > 0:
        print('  上下文:', repr(content[idx-30:idx+60]))
        print()
