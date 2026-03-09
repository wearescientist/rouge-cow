with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 检查 startGameBtn 点击代码
idx = content.find("addEventListener('click', () => {")
print('click handler 位置:', idx)
if idx > 0:
    chunk = content[idx:idx+800]
    print('代码片段:')
    print(chunk)
