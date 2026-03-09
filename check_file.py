# -*- coding: utf-8 -*-
with open('src/systems/shopNPC.js', 'r', encoding='utf-8') as f:
    content = f.read()

print('=== 文件检查 ===')
print('总行数:', len(content.split('\n')))

# 检查是否有语法错误
try:
    compile(content, 'shopNPC.js', 'exec')
    print('语法检查: 通过')
except SyntaxError as e:
    print('语法错误:', e)

# 检查第85行附近
lines = content.split('\n')
print('')
print('第80-90行:')
for i in range(79, min(90, len(lines))):
    print(f'{i+1}: {repr(lines[i])}')
