with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('=== 最终验证 ===')

# 1. 检查类方法
checks = [
    ('Game.start()', 'async start()' in content),
    ('Game.update(dt)', 'update(dt) {' in content and content.find('update(dt) {') > 1000),
    ('Game.loop()', 'loop(t) {' in content),
    ('isRestarting 保护', 'isRestarting' in content),
    ('武器开火保护', '!this.isRestarting' in content),
    ('3秒延迟', '3000' in content),
    ('state = playing', "state = 'playing'" in content),
]

for name, ok in checks:
    status = 'OK' if ok else 'FAIL'
    print(f'{status}: {name}')

# 2. 检查代码顺序
start_end = content.find('async start()')
update_start = content.find('update(dt) {', start_end)
loop_start = content.find('loop(t) {', update_start)

print(f'\n代码顺序:')
print(f'  start() 在 {start_end}')
print(f'  update() 在 {update_start}')
print(f'  loop() 在 {loop_start}')

if start_end < update_start < loop_start:
    print('  OK: 顺序正确')
else:
    print('  FAIL: 顺序错误')

# 3. 检查 state = playing 的位置
playing_pos = content.find("state = 'playing'")
isrestart_false = content.find('isRestarting = false', playing_pos - 500)

print(f'\n保护逻辑:')
print(f'  isRestarting = false 在 {isrestart_false}')
print(f'  state = playing 在 {playing_pos}')
if isrestart_false < playing_pos:
    print('  OK: 先解除保护再开始游戏')
else:
    print('  FAIL: 游戏可能在保护解除前开始')
