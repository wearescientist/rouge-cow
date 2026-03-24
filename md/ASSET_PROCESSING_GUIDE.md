# sprites_v3 贴图处理指南

## 📋 现有资源盘点

### 总体情况
- **6层主题齐全**: L1菌丝 ~ L6核心
- **贴图尺寸**: 1024x1024 (大部分) / 2048x2048 (L6)
- **风格统一**: 像素艺术，暗黑奇幻
- **质量**: 高，可直接使用或简单处理

---

## 🎨 各层资源分析

### L1 菌丝区 (Mycelium)

| 文件名 | 尺寸 | 状态 | 处理建议 |
|--------|------|------|----------|
| `layer1_wall_left.png` | 1024x1024 | ✅ 可用 | 截取左侧竖条作为垂直墙贴图 |
| `layer1_wall_right.png` | 1024x1024 | ✅ 可用 | 镜像翻转作为右侧墙 |
| `layer1_wall_bottom.png` | 1024x1024 | ✅ 可用 | 截取底部区域作为下墙 |
| `layer1_door_normal.png` | 1248x832 | ⚠️ 需处理 | 透明背景！需填充黑色背景 |
| `door_closed.png` | 1024x1024 | ✅ 可用 | 通用关闭门，黑色背景 |
| `door_open.png` | 1024x1024 | ✅ 可用 | 通用开启门，黑色背景 |
| `wall_mycelium.png` | 1024x1024 | ✅ 可用 | 完整菌丝纹理，可作上墙 |

**处理方案**:
```
上墙 (top): wall_mycelium.png 截取上半部分
下墙 (bottom): layer1_wall_bottom.png 截取底部200px
左墙 (left): layer1_wall_left.png 截取左侧100px
右墙 (right): layer1_wall_left.png 水平翻转，截取左侧100px
拐角: 从 wall_mycelium.png 截取角落
门: door_closed.png / door_open.png 裁剪至 80x64 或 64x100
```

---

### L2 孵化温室 (Greenhouse)

| 文件名 | 尺寸 | 状态 | 处理建议 |
|--------|------|------|----------|
| `wall_greenhouse.png` | 1024x1024 | ✅ 可用 | 绿色有机纹理，可做上墙/下墙 |
| `door_open.png` | 1024x1024 | ✅ 完美 | 黑色背景，传送门风格，非常精美 |
| `door_closed.png` | 1024x1024 | ✅ 可用 | 关闭的门 |
| `door_boss.png` | 1024x1024 | ✅ 可用 | BOSS门，特殊纹理 |
| `door_locked.png` | 1024x1024 | ✅ 可用 | 锁定的门 |
| `door_secret.png` | 1024x1024 | ✅ 可用 | 秘密门 |

**处理方案**:
```
上墙: wall_greenhouse.png 截取上半部分
下墙: wall_greenhouse.png 截取下半部分（深色区域）
左右墙: wall_greenhouse.png 截取竖条，添加血管线条
门: 直接使用 door_*.png 系列，裁剪至合适尺寸
```

---

### L3 神经索 (Nerve)

| 文件名 | 尺寸 | 状态 | 处理建议 |
|--------|------|------|----------|
| `wall_nerve.png` | 1024x1024 | ✅ 可用 | 粉色神经纹理 |
| `door_*.png` (5个) | 1024x1024 | ✅ 可用 | 各种门状态齐全 |

**处理方案**: 同L2，截取 wall_nerve.png 作为墙纹理

---

### L4 消化熔炉 (Furnace)

| 文件名 | 尺寸 | 状态 | 处理建议 |
|--------|------|------|----------|
| `wall_furnace.png` | 1024x1024 | ✅ 完美 | 岩浆裂纹，底部有深色渐变，适合做上墙 |
| `door_*.png` (5个) | 1024x1024 | ✅ 可用 | 各种门状态 |

**处理方案**:
```
上墙: wall_furnace.png 截取上半部分（亮色岩浆区域）
下墙: wall_furnace.png 截取下半部分（深色焦土区域）
左右墙: wall_furnace.png 截取竖条，保留岩浆裂纹
```

---

### L5 母虫庭院 (Courtyard)

| 文件名 | 尺寸 | 状态 | 处理建议 |
|--------|------|------|----------|
| `wall_courtyard.png` | 1024x1024 | ✅ 可用 | 黑色几丁质纹理 |
| `door_*.png` (5个) | 1024x1024 | ✅ 可用 | 各种门状态 |

**处理方案**: 同其他层

---

### L6 千根之心 (Core)

| 文件名 | 尺寸 | 状态 | 处理建议 |
|--------|------|------|----------|
| `wall_core.png` | 2048x2048 | ⚠️ 需处理 | 尺寸过大，包含符文阵列 |
| `door_*.png` (5个) | 1024x1024 | ✅ 可用 | 各种门状态 |

**处理方案**:
```
上墙: wall_core.png 截取左上角 1024x1024 区域（符文墙）
下墙: wall_core.png 截取左下角区域（深色石墙）
左右墙: 截取竖条，保留符文和金色线条
```

---

## 🛠️ 具体处理步骤

### 第一步：裁剪墙贴图 (Python脚本)

```python
from PIL import Image

def process_wall(input_path, output_path, crop_box):
    """裁剪墙贴图"""
    img = Image.open(input_path)
    cropped = img.crop(crop_box)
    # 缩放至 64x64
    resized = cropped.resize((64, 64), Image.Resampling.LANCZOS)
    resized.save(output_path)

# L1 示例
process_wall(
    'layer1/wall_mycelium.png',
    'output/layer1_wall_top.png',
    (0, 0, 1024, 200)  # 截取上半部分
)

process_wall(
    'layer1/layer1_wall_left.png',
    'output/layer1_wall_left.png',
    (0, 0, 100, 1024)  # 截取左侧竖条
)
```

### 第二步：处理门贴图

```python
def process_door(input_path, output_path, target_size=(80, 64)):
    """处理门贴图"""
    img = Image.open(input_path)
    
    # 检查是否有透明通道
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        # 创建黑色背景
        background = Image.new('RGB', img.size, (0, 0, 0))
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    
    # 居中裁剪
    width, height = img.size
    target_w, target_h = target_size
    
    left = (width - target_w * (width // target_w)) // 2
    top = (height - target_h * (height // target_h)) // 2
    right = left + target_w * (width // target_w)
    bottom = top + target_h * (height // target_h)
    
    cropped = img.crop((left, top, right, bottom))
    resized = cropped.resize(target_size, Image.Resampling.LANCZOS)
    resized.save(output_path)
```

### 第三步：生成拐角贴图

拐角可以通过拼接墙的角落部分生成，或者从 wall_*.png 中截取角落区域。

---

## 📊 资源可用性总结

| 层级 | 墙纹理 | 门 (5种) | 处理难度 |
|------|--------|----------|----------|
| L1 | ✅ 有 | ✅ 有 | 低 |
| L2 | ✅ 有 | ✅ 有 | 低 |
| L3 | ✅ 有 | ✅ 有 | 低 |
| L4 | ✅ 有 | ✅ 有 | 低 |
| L5 | ✅ 有 | ✅ 有 | 低 |
| L6 | ✅ 有 (需裁剪) | ✅ 有 | 中 |

**结论**: 90%资源可直接使用，仅需裁剪和缩放！

---

## 🎯 最终输出清单

处理后的贴图应放入 `assets/sprites/tiles/walls/`:

```
assets/sprites/tiles/walls/
├── layer1_wall_top.png (64x64)
├── layer1_wall_bottom.png (64x64)
├── layer1_wall_left.png (64x64)
├── layer1_wall_right.png (64x64)
├── layer1_wall_corner_tl.png (64x64)
├── layer1_wall_corner_tr.png (64x64)
├── layer1_wall_corner_bl.png (64x64)
├── layer1_wall_corner_br.png (64x64)
├── layer1_door_normal.png (80x64)
├── layer1_door_boss.png (80x64)
├── layer1_door_secret.png (80x64)
├── layer2_... (同上)
├── ...
└── layer6_... (同上)
```

---

## ⚡ 快速处理建议

**立即可用的** (只需缩放):
- 所有 `door_*.png` (除了 L1 的 door_normal 需要处理透明背景)
- 所有 `wall_*.png` 作为上墙

**需要裁剪的**:
- 左右墙: 从 wall_*.png 截取竖条
- 下墙: 截取 wall_*.png 下半部分
- 拐角: 截取 wall_*.png 角落

**需要修复的**:
- `layer1/layer1_door_normal.png`: 透明背景 → 黑色背景

---

**推荐工具**: Python PIL / Photoshop / GIMP
**预计时间**: 1-2小时完成全部处理
