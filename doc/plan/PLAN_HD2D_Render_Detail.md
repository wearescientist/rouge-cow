# 🎨 Project Octopath-Dark | HD-2D渲染系统完整规划

> **目标**: 打造八方旅人风格的2D像素暗黑美学  
> **工期**: 4周 (28天)  
> **技术栈**: WebGL2 + 延迟渲染 + 实时光影

---

## I. 视觉概念：什么是HD-2D？

### 1.1 八方旅人视觉解析

```
┌─────────────────────────────────────────────────────────────────┐
│                      HD-2D 视觉分层                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   [远景层]  ← 像素背景 + 模糊景深 (Bokeh)                          │
│      ↓                                                            │
│   [中景层]  ← 主要游戏场景 + 实时光照                             │
│      ↓                                                            │
│   [近景层]  ← 高对比角色 + 动态阴影                               │
│      ↓                                                            │
│   [特效层]  ← 粒子 + 体积光 + 泛光 (Bloom)                        │
│      ↓                                                            │
│   [后期层]  ← 暗角 + 胶片颗粒 + 色调映射                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 暗黑色调定义

**颜色参考板**:
```css
/* 背景 - 深邃压抑 */
--void-black:    #050508;  /* 虚空黑 */
--deep-purple:   #1a1a2e;  /* 深紫黑 */
--dungeon-blue:  #0f0f1a;  /* 地牢蓝黑 */

/* 光源 - 高对比点缀 */
--torch-orange:  #ff6b35;  /* 火炬橙 */
--magic-cyan:    #4ecdc4;  /* 魔法青 */
--blood-red:     #ff4757;  /* 血红 */
--divine-gold:   #ffd700;  /* 神圣金 */
--poison-green:  #2ecc71;  /* 毒素绿 */

/* 中间调 */
--stone-gray:    #2d3436;  /* 石质灰 */
--mist-gray:     #636e72;  /* 迷雾灰 */
```

**光照规则**:
- 环境光极弱 (0.1-0.2) - 大部分区域处于黑暗中
- 光源对比度极高 - 亮处极亮，暗处极暗
- 色温对比 - 暖光源(火把) vs 冷环境(阴影)

---

## II. 核心技术架构

### 2.1 渲染管线流程

```
帧开始
  │
  ▼
┌────────────────────────────────────────────────────────────────┐
│ 1. G-Buffer 生成阶段 (多目标渲染)                               │
│                                                                 │
│  RT0 [albedo]:     RGB=颜色, A=自发光强度                        │
│  RT1 [normal]:     RG=法线(压缩), B=粗糙度, A=金属度             │
│  RT2 [depth]:      R32F=深度                                    │
│  RT3 [emissive]:   RGB=自发光颜色                                │
│                                                                 │
│  输入: 所有精灵 + 法线信息                                       │
│  输出: 4张G-Buffer纹理                                          │
└────────────────────────────────────────────────────────────────┘
  │
  ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. 光照计算阶段 (延迟渲染)                                      │
│                                                                 │
│  SSAO        → 环境光遮蔽 (让角落更暗)                          │
│  ↓                                                               │
│  主光照       → 所有动态光源计算                                 │
│  ↓                                                               │
│  体积光       → God Rays (光源背后的光柱)                       │
│                                                                 │
│  输出: 光照贴图 (HDR)                                           │
└────────────────────────────────────────────────────────────────┘
  │
  ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. 后处理效果栈 (按顺序应用)                                    │
│                                                                 │
│  ① Bloom       → 提取高亮区域，多级模糊叠加                     │
│  ② ToneMap    → HDR→LDR (ACES色调映射)                         │
│  ③ ColorGrade → LUT颜色分级 (暗黑滤镜)                         │
│  ④ Vignette   → 边缘暗角 (聚焦中心)                            │
│  ⑤ Grain      → 胶片颗粒 (质感)                                │
│  ⑥ Chromatic  → 轻微色差 (边缘RGB分离)                         │
│                                                                 │
│  输出: 最终画面                                                 │
└────────────────────────────────────────────────────────────────┘
  │
  ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. UI渲染层 (无后处理，直接叠加)                                │
│                                                                 │
│  - 血条/能量条                                                  │
│  - 武器/道具图标                                                │
│  - 伤害数字                                                     │
│  - 菜单界面                                                     │
└────────────────────────────────────────────────────────────────┘
  │
  ▼
画面输出
```

### 2.2 关键技术详解

#### 2.2.1 G-Buffer详解

```glsl
// RT0 - 漫射颜色 + 自发光强度
struct AlbedoData {
    vec3 baseColor;    // 基础颜色
    float emission;    // 自发光强度 (0-1)
};

// RT1 - 法线 + 材质属性
struct MaterialData {
    vec3 normal;       // 世界空间法线
    float roughness;   // 粗糙度 (0=光滑, 1=粗糙)
    float metallic;    // 金属度 (0=非金属, 1=金属)
};

// RT2 - 深度
float depth;           // 用于重建世界坐标

// RT3 - 自发光颜色
vec3 emissiveColor;    // 自身发光的颜色
```

#### 2.2.2 延迟光照着色器

```glsl
#version 300 es
precision highp float;

uniform sampler2D u_albedo;
uniform sampler2D u_normal;
uniform sampler2D u_depth;
uniform sampler2D u_ssao;

// 光源结构
struct Light {
    vec2 position;     // 屏幕空间位置
    vec3 color;        // 光源颜色
    float radius;      // 影响半径
    float intensity;   // 强度
    int type;          // 0=点光源, 1=聚光, 2=方向光
};

uniform Light u_lights[32];  // 最多32个光源
uniform int u_lightCount;
uniform vec3 u_ambient;      // 环境光颜色

in vec2 v_uv;
out vec4 fragColor;

void main() {
    // 采样G-Buffer
    vec4 albedo = texture(u_albedo, v_uv);
    vec4 normalMat = texture(u_normal, v_uv);
    float depth = texture(u_depth, v_uv).r;
    float ssao = texture(u_ssao, v_uv).r;
    
    vec3 baseColor = albedo.rgb;
    vec3 normal = normalize(normalMat.rgb * 2.0 - 1.0);
    float emission = albedo.a;
    
    // 重建世界坐标
    vec3 worldPos = reconstructWorldPosition(v_uv, depth);
    
    // 环境光 (极暗，配合SSAO)
    vec3 lighting = baseColor * u_ambient * ssao;
    
    // 自发光
    lighting += baseColor * emission;
    
    // 遍历所有光源
    for (int i = 0; i < u_lightCount; i++) {
        Light light = u_lights[i];
        
        vec2 lightDir = light.position - worldPos.xy;
        float dist = length(lightDir);
        
        // 距离衰减 (平方反比)
        float attenuation = 1.0 / (1.0 + dist * dist / (light.radius * light.radius));
        attenuation = max(0.0, 1.0 - dist / light.radius);
        
        // 法线点积 (Lambert漫反射)
        vec3 L = normalize(vec3(lightDir, 50.0));  // 假设光源在上方50单位
        float NdotL = max(dot(normal, L), 0.0);
        
        // 叠加光照
        lighting += baseColor * light.color * NdotL * attenuation * light.intensity;
    }
    
    fragColor = vec4(lighting, 1.0);
}
```

#### 2.2.3 SSAO (屏幕空间环境光遮蔽)

```glsl
// 简化的SSAO
float calculateSSAO(vec2 uv, vec3 pos, vec3 normal) {
    float occlusion = 0.0;
    int samples = 16;
    
    for (int i = 0; i < samples; i++) {
        // 在半球内采样随机点
        vec3 sampleDir = randomHemisphereDirection(normal, i);
        vec3 samplePos = pos + sampleDir * 0.5;  // 0.5 = 采样半径
        
        // 投影到屏幕空间
        vec2 sampleUV = worldToScreen(samplePos);
        float sampleDepth = texture(u_depth, sampleUV).r;
        
        // 如果采样点被遮挡，增加遮蔽
        float rangeCheck = smoothstep(0.0, 1.0, 0.5 / abs(pos.z - sampleDepth));
        occlusion += (sampleDepth < samplePos.z ? 1.0 : 0.0) * rangeCheck;
    }
    
    return 1.0 - (occlusion / float(samples));
}
```

#### 2.2.4 Bloom (泛光)

```
Bloom流程:
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 提取高亮  │───▶│ 降采样   │───▶│ 高斯模糊 │
│ >阈值像素 │    │ 1/2,1/4  │    │ 多级模糊 │
└──────────┘    └──────────┘    └──────────┘
                                       │
                                       ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 叠加原图  │◀───│ 上采样   │◀───│ 模糊混合 │
│ 加法叠加  │    │ 双线性   │    │ 跨级混合 │
└──────────┘    └──────────┘    └──────────┘
```

---

## III. 光源系统设计

### 3.1 光源类型

| 类型 | 图标 | 颜色 | 半径 | 动画 | 用途 |
|------|------|------|------|------|------|
| **玩家火炬** | 🔥 | #ff6b35 | 150px | 摇曳闪烁 | 主角照明 |
| **技能爆发** | ✨ | 技能色 | 200px | 瞬时淡出 | 技能特效 |
| **环境火炬** | 🕯️ | #ff8c42 | 100px | 微弱摇曳 | 场景光源 |
| **敌人眼睛** | 👁️ | #ff3333 | 60px | 呼吸闪烁 | 恐怖氛围 |
| **魔法物品** | 🔮 | #4ecdc4 | 120px | 脉动发光 | 可拾取物 |
| **全局环境** | 🌑 | #1a1a2e | ∞ | 静态 | 基础照明 |

### 3.2 光源动画

```javascript
// 火炬摇曳效果
class TorchLight extends Light {
    update(dt) {
        // 随机闪烁
        this.flickerPhase += dt * 10;
        const flicker = Math.sin(this.flickerPhase) * 0.1 + 
                       Math.sin(this.flickerPhase * 2.3) * 0.05;
        
        // 强度波动 0.9 - 1.1
        this.currentIntensity = this.intensity * (1.0 + flicker);
        
        // 半径微小波动
        this.currentRadius = this.radius * (1.0 + flicker * 0.2);
        
        // 位置微动 (模拟火焰摇曳)
        this.offsetX = Math.sin(this.flickerPhase * 0.5) * 3;
        this.offsetY = Math.cos(this.flickerPhase * 0.7) * 3;
    }
}
```

---

## IV. 后处理效果详解

### 4.1 效果栈参数

| 效果 | 强度 | 描述 |
|------|------|------|
| **Bloom** | 0.8 | 泛光，让光源有光晕 |
| **ToneMap** | ACES | 电影级色调映射 |
| **ColorGrade** | 暗黑LUT | 压低中间调，暗部偏蓝 |
| **Vignette** | 0.6 | 边缘暗角，聚焦中心 |
| **Grain** | 0.03 | 微弱胶片颗粒 |
| **Chromatic** | 0.5px | 轻微边缘色差 |

### 4.2 暗黑LUT预览

```
原始颜色 → LUT转换 → 输出颜色

白色(1,1,1)    → (0.9,0.9,0.95)  ← 压高光
灰色(0.5,0.5,0.5) → (0.3,0.3,0.4) ← 压中调，偏蓝
黑色(0,0,0)    → (0.02,0.02,0.05) ← 保暗部细节

暖色(1,0.5,0)  → (0.8,0.4,0.1)   ← 保持火炬色
冷色(0,0.5,1)  → (0.1,0.3,0.8)   ← 增强冷色
```

---

## V. 法线贴图生成

### 5.1 从精灵生成法线

```javascript
class NormalGenerator {
    // 基于深度图生成法线
    generateFromSprite(spriteImage) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = spriteImage.width;
        canvas.height = spriteImage.height;
        
        // 1. 绘制精灵
        ctx.drawImage(spriteImage, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        
        // 2. 生成高度图 (Alpha作为高度)
        const heightMap = new Float32Array(w * h);
        for (let i = 0; i < imageData.data.length; i += 4) {
            heightMap[i/4] = imageData.data[i+3] / 255;  // Alpha通道
        }
        
        // 3. Sobel算子计算法线
        const normalMap = new Uint8Array(w * h * 4);
        for (let y = 1; y < h-1; y++) {
            for (let x = 1; x < w-1; x++) {
                const idx = (y * w + x) * 4;
                
                // Sobel X
                const dx = 
                    heightMap[(y-1)*w+x+1] - heightMap[(y-1)*w+x-1] +
                    2*heightMap[y*w+x+1] - 2*heightMap[y*w+x-1] +
                    heightMap[(y+1)*w+x+1] - heightMap[(y+1)*w+x-1];
                
                // Sobel Y
                const dy = 
                    heightMap[(y+1)*w+x-1] - heightMap[(y-1)*w+x-1] +
                    2*heightMap[(y+1)*w+x] - 2*heightMap[(y-1)*w+x] +
                    heightMap[(y+1)*w+x+1] - heightMap[(y-1)*w+x+1];
                
                // 法线 = normalize(-dx, -dy, 1)
                const len = Math.sqrt(dx*dx + dy*dy + 1);
                normalMap[idx] = ((-dx/len) * 0.5 + 0.5) * 255;     // R
                normalMap[idx+1] = ((-dy/len) * 0.5 + 0.5) * 255;   // G
                normalMap[idx+2] = ((1/len) * 0.5 + 0.5) * 255;      // B
                normalMap[idx+3] = 255;                              // A
            }
        }
        
        return normalMap;
    }
}
```

---

## VI. 性能优化策略

### 6.1 渲染优化

| 技术 | 说明 | 预期收益 |
|------|------|----------|
| **Sprite Batching** | 每帧同图集精灵批量渲染 | DrawCall从100+降到10+ |
| **Tile-based Culling** | 只渲染屏幕内+边缘1格 | 剔除50%无关物体 |
| **Light Culling** | 光源按网格分桶 | 每像素最多计算4个光源 |
| **LOD System** | 远距离降低精度 | GPU负载-30% |
| **GPU Instancing** | 相同精灵一次绘制 | CPU开销-70% |

### 6.2 移动端适配

```javascript
const QualitySettings = {
    ULTRA: {
        resolution: 1.0,
        gBufferBits: 16,
        lightCount: 32,
        ssaoSamples: 16,
        bloomLevels: 4,
        shadowQuality: 'high'
    },
    HIGH: {
        resolution: 1.0,
        gBufferBits: 8,
        lightCount: 24,
        ssaoSamples: 8,
        bloomLevels: 3,
        shadowQuality: 'medium'
    },
    MEDIUM: {  // 默认
        resolution: 0.8,
        gBufferBits: 8,
        lightCount: 16,
        ssaoSamples: 4,
        bloomLevels: 2,
        shadowQuality: 'low'
    },
    LOW: {     // 老旧设备
        resolution: 0.6,
        gBufferBits: 8,
        lightCount: 8,
        ssaoSamples: 0,  // 关闭SSAO
        bloomLevels: 1,
        shadowQuality: 'off'
    }
};
```

---

## VII. 实施路线图

### Week 1: 基础设施 (Day 1-7)

```
Day 1-2: WebGL2基础
├── WebGLContext初始化
├── 扩展检测 (浮点纹理、多目标渲染)
└── 错误处理/降级方案

Day 3-4: FrameBuffer系统
├── G-Buffer创建 (4xRT)
├── 深度纹理附件
└── 帧缓冲管理器

Day 5-7: Shader库 + 精灵批处理
├── ShaderProgram类
├── 顶点缓冲区管理
├── 精灵批次收集
└── 基础渲染测试
```

### Week 2: 光照系统 (Day 8-14)

```
Day 8-10: 延迟渲染核心
├── G-Buffer填充Shader
├── 延迟光照Shader
├── 光源管理器
└── 基础光照测试

Day 11-12: SSAO + 体积光
├── SSAO实现
├── God Rays效果
└── 性能调优

Day 13-14: 阴影系统
├── 2D软阴影
├── 阴影图生成
└── 阴影混合
```

### Week 3: 后处理 (Day 15-21)

```
Day 15-17: Bloom + ToneMap
├── 高亮提取
├── 多级模糊
├── ACES色调映射
└── 参数调校

Day 18-19: 颜色分级 + 暗角
├── LUT生成/加载
├── 颜色分级Shader
├── 暗角效果
└── 胶片颗粒

Day 20-21: 色差 + 整合
├── RGB色差
├── 效果栈整合
└── 移动端适配
```

### Week 4: 集成与优化 (Day 22-28)

```
Day 22-24: 法线生成 + 材质
├── NormalGenerator
├── 材质定义
├── 精灵预处理
└── 批量处理工具

Day 25-26: 游戏集成
├── 与现有Game类集成
├── 光源数据对接
├── UI层分离
└── 事件系统对接

Day 27-28: 性能优化
├── 性能分析
├── 瓶颈优化
├── 多设备测试
└── 最终调校
```

---

## VIII. 预期效果对比

### Before (当前)
```
┌─────────────────────────────┐
│  像素精灵                    │
│  ↓                          │
│  Canvas 2D直接绘制           │
│  ↓                          │
│  平面光照 (无立体感)         │
│  无后处理                    │
└─────────────────────────────┘
```

### After (HD-2D)
```
┌─────────────────────────────┐
│  像素精灵 + 法线贴图         │
│  ↓                          │
│  G-Buffer生成               │
│  ↓                          │
│  延迟光照 (立体光影)         │
│  ↓                          │
│  后处理栈 (Bloom/暗角/颗粒)  │
│  ↓                          │
│  电影级画面                  │
└─────────────────────────────┘
```

---

## IX. 风险与对策

| 风险 | 影响 | 对策 |
|------|------|------|
| WebGL2不支持 | 无法运行 | 自动降级到Canvas 2D |
| 性能不足 | 帧率低 | 动态质量调节 |
| 显存不足 | 崩溃 | 降分辨率/减少光源 |
| 开发延期 | 工期超期 | 分阶段发布，先做核心 |

---

*计划版本: v1.0*
*创建日期: 2026-03-05*
*预计完成: 2026-04-02*
