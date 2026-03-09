with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('=== 最终验证 ===')
checks = [
    ('isRestarting 标志', 'isRestarting' in content),
    ('3秒保护延迟', '3000' in content),
    ('重启保护检查', '!this.isRestarting' in content),
    ('Weapon CD 限制', 'if (this.cd < -0.5)' in content),
    ('贴图版本号', '?v=095' in content),
    ('emoji 白底', "fillStyle = '#fff'" in content),
    ('状态 paused', "this.paused" in content or "this.state" in content),
]

for name, ok in checks:
    status = 'OK' if ok else 'FAIL'
    print(f'{status}: {name}')

# 检查代码逻辑顺序
idx_isrestart = content.find('isRestarting = false')
idx_playing = content.find("state = 'playing'")
if idx_isrestart > 0 and idx_playing > 0:
    if idx_isrestart < idx_playing:
        print('OK: 保护解除后才开始游戏')
    else:
        print('WARN: 游戏开始可能在保护解除之前')
