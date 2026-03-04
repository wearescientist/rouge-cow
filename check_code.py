with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

import re

# 查找所有 state = 的位置
matches = list(re.finditer(r'state\s*=\s*[\'\"]', content))
print(f'找到 {len(matches)} 个 state =')
for m in matches[:5]:
    print(f'位置 {m.start()}: {content[m.start():m.start()+50]}')

# 查找 click 事件
click = content.find('click')
print(f'\nclick 位置: {click}')
if click > 0:
    print(content[click-50:click+200])
