from PIL import Image
import os

# 读取基础贴图
door_closed = Image.open('assets/sprites/tiles/walls/door_closed.png')
door_open = Image.open('assets/sprites/tiles/walls/door_open.png')

# 确保是RGBA模式
door_closed = door_closed.convert('RGBA')
door_open = door_open.convert('RGBA')

# 6层配色定义 (门框颜色, 门芯颜色-关, 门芯颜色-开)
palettes = [
    # 第1层 菌丝区 - 灰白
    ((120, 120, 110), (180, 60, 60), (80, 80, 75)),  # 灰白门框, 暗红X, 暗灰通道
    # 第2层 孵化温室 - 墨绿
    ((40, 80, 40), (180, 60, 60), (60, 100, 60)),   # 墨绿门框, 暗红X, 暗绿通道
    # 第3层 神经索 - 紫黑
    ((60, 40, 80), (150, 80, 200), (120, 60, 180)), # 紫黑门框, 亮紫X, 亮紫通道
    # 第4层 消化熔炉 - 橙红
    ((180, 80, 40), (150, 40, 40), (220, 120, 40)), # 橙红门框, 暗红X, 亮橙通道
    # 第5层 母虫庭院 - 暗红
    ((100, 40, 40), (200, 60, 60), (120, 50, 50)),  # 暗红门框, 血红X, 暗红通道
    # 第6层 千根之心 - 深紫+金
    ((60, 40, 80), (220, 180, 60), (200, 160, 50)), # 深紫门框, 金黄X, 金黄通道
]

def tint_image(img, frame_color, core_color):
    """给门上色的简单方法"""
    pixels = img.load()
    result = img.copy()
    result_pixels = result.load()
    
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = pixels[x, y]
            if a > 10:  # 非透明
                # 根据亮度判断是门框还是门芯
                brightness = (r + g + b) / 3
                if brightness > 150:  # 亮部 - 门框
                    result_pixels[x, y] = (*frame_color, a)
                elif brightness < 80:  # 暗部 - 门芯
                    result_pixels[x, y] = (*core_color, a)
                else:  # 中间色
                    result_pixels[x, y] = (*frame_color, a)
    return result

# 生成12张贴图
for i, (frame, closed_core, open_core) in enumerate(palettes, 1):
    # 关着的门
    closed_door = tint_image(door_closed, frame, closed_core)
    closed_door.save(f'assets/sprites/tiles/walls/layer{i}_door_closed.png')
    
    # 开着的门
    open_door = tint_image(door_open, frame, open_core)
    open_door.save(f'assets/sprites/tiles/walls/layer{i}_door_open.png')
    
    print(f'Generated layer{i}_door_closed.png and layer{i}_door_open.png')

print('All 12 door textures generated!')
