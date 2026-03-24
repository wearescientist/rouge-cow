# PLAN: HD-2D 暗黑渲染系统重构

> **项目代号**: Project Octopath-Dark  
> **目标风格**: 八方旅人HD-2D + 暗黑色调  
> **核心特征**: 像素精灵 + 实时光影 + 体积雾 + 动态光源  

---

## I. 视觉风格定义

### 1.1 八方旅人HD-2D特征分析

| 特征 | 描述 | 实现方式 |
|------|------|----------|
| **像素基础** | 16x16~32x32精灵，硬边缘 | 保持现有精灵系统 |
| **动态光照** | 实时法线贴图光照 | 自定义Shader + 法线生成 |
| **体积效果** | 雾、光柱、粒子 | 后处理 + 粒子系统 |
| **景深模糊** | 背景虚化 | 深度图 + 高斯模糊 |
| **屏幕空间反射** | 水面/光滑表面反射 | SSR Shader |

### 1.2 暗黑色调调色板

```css
/* 主色调 - 压抑的地下城氛围 */
--bg-primary: #0a0a14;      /* 深邃黑蓝 */
--bg-secondary: #1a1a2e;    /* 暗紫黑 */
--shadow-color: #000000;    /* 纯黑阴影 */

/* 光源色 - 高对比点缀 */
--light-warm: #ff6b35;      /* 暖橙火光 */
--light-cool: #4ecdc4;      /* 冷青魔法 */
--light-danger: #ff4757;    /* 血红警告 */
--light-divine: #ffd700;    /* 金黄神圣 */

/* 环境光 - 微弱的环境照亮 */
--ambient-base: #2d3436;    /* 深灰环境 */
--ambient-mood: #636e72;    /* 情绪灰 */
```

### 1.3 光影规则

```
光源类型:
├── 玩家火炬 (动态) - 半径150px, 暖橙色, 摇曳效果
├── 技能特效 (动态) - 瞬时爆发, 对应技能颜色
├── 环境光源 (静态) - 墙壁火炬/窗户, 半径80px
├── 敌人眼睛 (动态) - 微弱红光, 恐怖氛围
└── 全局环境光 - 微弱蓝灰, 保证最低可见度

光照公式:
    最终颜色 = 基础颜色 × (环境光 + Σ(光源衰减 × 光源颜色 × N·L))
    衰减 = 1 / (1 + d²/r²)  // 平方反比
```

---

## II. 系统架构设计

### 2.1 渲染管线架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     HD-2D 渲染管线                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  游戏逻辑层   │───▶│  场景数据层   │───▶│  渲染命令层   │      │
│  │  Game/Entity │    │  SceneGraph  │    │  RenderQueue │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  HD2DRenderer 核心                        │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              G-Buffer 生成 (多目标渲染)              │  │  │
│  │  │  RT0: 漫反射颜色 (RGB) + 自发光强度(A)               │  │  │
│  │  │  RT1: 法线 (RG压缩) + 粗糙度(B) + 金属度(A)          │  │  │
│  │  │  RT2: 深度 (R32F)                                  │  │  │
│  │  │  RT3: 物体ID (用于后期选择)                         │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                           │                              │  │
│  │                           ▼                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              光照计算 (Deferred Shading)            │  │  │
│  │  │  • 环境光遮蔽 (SSAO)                                │  │  │
│  │  │  • 全局光照 (简易GI)                                │  │  │
│  │  │  • 体积光散射 (God Rays)                            │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                           │                              │  │
│  │                           ▼                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              后处理效果栈                            │  │  │
│  │  │  1. 泛光 (Bloom) - 高亮溢出                         │  │  │
│  │  │  2. 色调映射 (Tone Mapping) - HDR转LDR              │  │  │
│  │  │  3. 颜色分级 (Color Grading) - 暗黑色调              │  │  │
│  │  │  4. 暗角 (Vignette) - 边缘压暗                      │  │  │
│  │  │  5. 噪点 (Film Grain) - 胶片质感                    │  │  │
│  │  │  6. 色差 (Chromatic Aberration) - 轻微边缘分离       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  │                           │                              │  │
│  │                           ▼                              │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │              UI层 (单独渲染，无后处理)               │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                    │
│                           ▼                                    │
│                    ┌──────────────┐                            │
│                    │   Canvas输出  │                            │
│                    └──────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 核心系统组成

| 系统 | 文件 | 职责 | 依赖 |
|------|------|------|------|
| **HD2DRenderer** | `src/render/HD2DRenderer.js` | 渲染管线核心 | WebGL2 |
| **ShaderLib** | `src/render/ShaderLib.js` | Shader程序管理 | HD2DRenderer |
| **LightSystem** | `src/render/LightSystem.js` | 光源管理 | HD2DRenderer |
| **PostProcess** | `src/render/PostProcess.js` | 后处理效果栈 | HD2DRenderer |
| **NormalGenerator** | `src/render/NormalGenerator.js` | 法线贴图生成 | Canvas2D |
| **MaterialSystem** | `src/render/MaterialSystem.js` | 材质定义 | - |
| **HD2DCamera** | `src/render/HD2DCamera.js` | 相机控制(继承) | SurvivorCamera |

---

## III. 外部架构实施计划

### 3.1 Phase 0: 基础设施 (1-2天)

#### 3.1.1 WebGL2 上下文初始化
```javascript
// src/render/core/WebGLContext.js
class WebGLContext {
    constructor(canvas) {
        this.gl = canvas.getContext('webgl2', {
            alpha: false,
            antialias: false,  // 我们自己处理抗锯齿
            premultipliedAlpha: false,
            preserveDrawingBuffer: false
        });
        
        // 启用扩展
        this.initExtensions();
        
        // 设置默认状态
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }
}
```

#### 3.1.2 FrameBuffer管理器
```javascript
// src/render/core/FrameBufferManager.js
class FrameBufferManager {
    createGBuffer(width, height) {
        // RT0: 漫反射 + 自发光 (RGBA8)
        // RT1: 法线 + 材质 (RGBA8)
        // RT2: 深度 (R32F)
        // RT3: 物体ID (R8)
    }
}
```

### 3.2 Phase 1: G-Buffer渲染 (2-3天)

#### 3.2.1 精灵批处理渲染器
```glsl
// shader/sprite.vert
#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
in vec4 a_color;
in vec2 a_normal;  // 法线XY，从精灵数据获取

uniform mat4 u_viewProj;
uniform vec2 u_cameraPos;

out vec2 v_texCoord;
out vec4 v_color;
out vec3 v_normal;
out float v_depth;

void main() {
    vec4 worldPos = /* 计算世界坐标 */;
    gl_Position = u_viewProj * worldPos;
    
    v_texCoord = a_texCoord;
    v_color = a_color;
    v_normal = normalize(vec3(a_normal, sqrt(1.0 - dot(a_normal, a_normal))));
    v_depth = gl_Position.w;
}
```

```glsl
// shader/sprite.frag
#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;
in vec3 v_normal;
in float v_depth;

uniform sampler2D u_diffuseMap;
uniform sampler2D u_normalMap;  // 可选的法线贴图
uniform float u_emissive;       // 自发光强度

// G-Buffer输出
layout(location = 0) out vec4 g_diffuse;
layout(location = 1) out vec4 g_normal;
layout(location = 2) out float g_depth;
layout(location = 3) out uint g_objectID;

void main() {
    vec4 texColor = texture(u_diffuseMap, v_texCoord);
    if (texColor.a < 0.1) discard;
    
    // 漫射颜色
    g_diffuse.rgb = texColor.rgb * v_color.rgb;
    g_diffuse.a = u_emissive;  // 自发光强度存入Alpha
    
    // 法线 (压缩到RG)
    g_normal.rg = v_normal.xy * 0.5 + 0.5;
    g_normal.b = 0.5;  // 粗糙度 (默认0.5)
    g_normal.a = 0.0;  // 金属度 (默认非金属)
    
    // 深度
    g_depth = v_depth;
    
    // 物体ID (用于后期选择)
    g_objectID = uint(gl_FragCoord.x) + uint(gl_FragCoord.y) * 1920u;
}
```

### 3.3 Phase 2: 光照系统 (3-4天)

#### 3.3.1 延迟光照着色器
```glsl
// shader/deferredLighting.frag
#version 300 es
precision highp float;

uniform sampler2D g_diffuse;
uniform sampler2D g_normal;
uniform sampler2D g_depth;
uniform sampler2D u_shadowMap;

uniform Light u_lights[MAX_LIGHTS];  // 光源数组
uniform vec3 u_ambientColor;
uniform vec3 u_cameraPos;

in vec2 v_uv;
out vec4 fragColor;

void main() {
    // 读取G-Buffer
    vec4 diffData = texture(g_diffuse, v_uv);
    vec4 normData = texture(g_normal, v_uv);
    float depth = texture(g_depth, v_uv).r;
    
    vec3 baseColor = diffData.rgb;
    vec3 normal = normalize(normData.rgb * 2.0 - 1.0);
    float emissive = diffData.a;
    
    // 重建世界坐标
    vec3 worldPos = reconstructPosition(v_uv, depth);
    
    // 环境光
    vec3 lighting = baseColor * u_ambientColor;
    
    // 自发光
    lighting += baseColor * emissive;
    
    // 遍历所有光源
    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (!u_lights[i].active) continue;
        
        vec3 lightDir = u_lights[i].pos - worldPos;
        float dist = length(lightDir);
        lightDir = normalize(lightDir);
        
        // 距离衰减
        float attenuation = 1.0 / (1.0 + dist * dist / (u_lights[i].radius * u_lights[i].radius));
        
        // 漫反射
        float NdotL = max(dot(normal, lightDir), 0.0);
        
        // 阴影检测 (如果是主光源)
        float shadow = 1.0;
        if (i == 0) shadow = calculateShadow(worldPos);
        
        lighting += baseColor * u_lights[i].color * NdotL * attenuation * shadow;
    }
    
    fragColor = vec4(lighting, 1.0);
}
```

#### 3.3.2 光源定义
```javascript
// src/render/LightSystem.js
const LIGHT_TYPES = {
    TORCH: 'torch',       // 玩家火炬 - 摇曳动画
    SKILL: 'skill',       // 技能特效 - 瞬时爆发
    STATIC: 'static',     // 环境光源 - 静态
    ENEMY: 'enemy',       // 敌人眼睛 - 微弱红光
    GLOBAL: 'global'      // 全局环境 - 基础照明
};

class Light {
    constructor(type, x, y, color, radius, intensity = 1.0) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.color = new Float32Array([color.r, color.g, color.b]);
        this.radius = radius;
        this.intensity = intensity;
        this.active = true;
        
        // 动画参数
        this.flickerPhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 2.0 + Math.random() * 2.0;
    }
    
    update(dt) {
        // 火炬摇曳效果
        if (this.type === LIGHT_TYPES.TORCH) {
            this.flickerPhase += dt * this.pulseSpeed;
            this.currentIntensity = this.intensity * 
                (0.8 + 0.2 * Math.sin(this.flickerPhase));
        }
    }
}
```

### 3.4 Phase 3: 后处理效果 (3-4天)

#### 3.4.1 泛光效果 (Bloom)
```glsl
// shader/bloom.frag
// 1. 提取高亮区域
// 2. 降采样模糊 (多级)
// 3. 上采样合并
```

#### 3.4.2 暗角效果 (Vignette)
```glsl
// shader/vignette.frag
uniform float u_intensity;  // 0.0 ~ 1.0
uniform float u_smoothness; // 边缘柔化

void main() {
    vec2 uv = v_uv * (1.0 - v_uv.yx);
    float vig = uv.x * uv.y * 15.0;
    vig = pow(vig, u_smoothness);
    
    // 暗黑色调: 边缘趋向深蓝黑
    vec3 vignetteColor = vec3(0.02, 0.02, 0.05);
    color = mix(vignetteColor, color, vig);
}
```

#### 3.4.3 胶片颗粒 (Film Grain)
```glsl
// shader/grain.frag
uniform float u_time;
uniform float u_amount;  // 0.0 ~ 0.1

float random(vec2 uv) {
    return fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    float noise = random(v_uv + u_time);
    color += (noise - 0.5) * u_amount;
}
```

### 3.5 Phase 4: 材质与法线 (2-3天)

#### 3.5.1 法线贴图生成器
```javascript
// src/render/NormalGenerator.js
class NormalGenerator {
    // 从像素精灵生成法线贴图
    generateFromSprite(spriteImage) {
        // 1. 检测边缘
        // 2. 根据边缘生成高度图
        // 3. 从高度图计算法线
        // 4. 输出法线贴图
    }
    
    // 预设法线类型
    static PRESETS = {
        FLAT: [128, 128, 255],      // 平面
        ROUND: 'generated',          // 圆形凸起
        CYLINDER: 'generated',       // 圆柱形
        SPIKE: 'generated'           // 尖刺形
    };
}
```

---

## IV. 暗黑色调实现细节

### 4.1 颜色分级LUT

```javascript
// 32x32x32 LUT用于颜色分级
class ColorGrading {
    constructor() {
        this.lutTexture = this.generateDarkFantasyLUT();
    }
    
    generateDarkFantasyLUT() {
        // 压暗中间调
        // 增强对比度
        // 暗部偏向蓝紫
        // 亮部偏向暖黄
    }
}
```

### 4.2 环境光遮蔽 (SSAO)

```glsl
// shader/ssao.frag
// 屏幕空间环境光遮蔽
// 采样周围深度，计算遮挡因子
// 暗部更暗，增强立体感
```

---

## V. 性能优化策略

### 5.1 渲染优化

| 技术 | 描述 | 收益 |
|------|------|------|
| **Sprite Batching** | 每帧批量渲染同图集精灵 | 减少DrawCall |
| **G-Buffer压缩** | 法线RG压缩, 深度R32F | 带宽节省 |
| **Tile-based Lighting** | 2D空间分块光源管理 | O(n) → O(1) |
| **LOD系统** | 远距离降低精度 | GPU减负 |
| **Occlusion Culling** | 不渲染屏幕外物体 | CPU减负 |

### 5.2 移动端适配

```javascript
class QualitySettings {
    static LEVELS = {
        ULTRA: {  // PC高端
            resolution: 1.0,
            bloomQuality: 'high',
            ssaoSamples: 16,
            shadowMapSize: 2048
        },
        HIGH: {   // PC普通
            resolution: 1.0,
            bloomQuality: 'medium',
            ssaoSamples: 8,
            shadowMapSize: 1024
        },
        MEDIUM: { // 移动高端
            resolution: 0.8,
            bloomQuality: 'low',
            ssaoSamples: 4,
            shadowMapSize: 512
        },
        LOW: {    // 移动低端
            resolution: 0.6,
            bloomQuality: 'off',
            ssaoSamples: 0,
            shadowMapSize: 256
        }
    };
}
```

---

## VI. 实施路线图

### Week 1: 基础设施
- [ ] Day 1-2: WebGL2上下文 + FrameBuffer管理器
- [ ] Day 3-4: Shader库 + 基础精灵渲染
- [ ] Day 5-7: G-Buffer系统 + 批处理渲染器

### Week 2: 光照系统
- [ ] Day 8-10: 延迟光照 + 光源管理
- [ ] Day 11-12: 阴影系统
- [ ] Day 13-14: 体积光 + SSAO

### Week 3: 后处理
- [ ] Day 15-17: 泛光 + 色调映射
- [ ] Day 18-19: 颜色分级 + 暗角
- [ ] Day 20-21: 胶片颗粒 + 色差

### Week 4: 集成与优化
- [ ] Day 22-24: 法线生成器 + 材质系统
- [ ] Day 25-26: 与现有游戏集成
- [ ] Day 27-28: 性能优化 + 移动端适配

---

## VII. 文件结构

```
src/
└── render/
    ├── core/
    │   ├── WebGLContext.js         # WebGL2上下文
    │   ├── FrameBufferManager.js   # FBO管理
    │   ├── ShaderProgram.js        # Shader封装
    │   └── VertexBuffer.js         # VBO/VAO管理
    │
    ├── shaders/                    # GLSL着色器
    │   ├── sprite.vert/frag        # 精灵渲染
    │   ├── deferred.vert/frag      # 延迟光照
    │   ├── ssao.frag               # 环境光遮蔽
    │   ├── bloom.frag              # 泛光
    │   ├── toneMapping.frag        # 色调映射
    │   ├── colorGrading.frag       # 颜色分级
    │   ├── vignette.frag           # 暗角
    │   └── composite.frag          # 最终合成
    │
    ├── systems/
    │   ├── HD2DRenderer.js         # 渲染器核心
    │   ├── LightSystem.js          # 光源管理
    │   ├── PostProcess.js          # 后处理栈
    │   ├── MaterialSystem.js       # 材质管理
    │   └── NormalGenerator.js      # 法线生成
    │
    └── data/
        ├── LUTs/                   # 颜色查找表
        └── presets/                # 预设配置
```

---

## VIII. 与现有系统集成

### 8.1 替换点

```javascript
// index.html 修改点

// 原代码:
// ctx.drawImage(sprite, x, y);

// 新代码:
hd2dRenderer.submitSprite({
    texture: sprite,
    position: [x, y],
    normal: sprite.normal || [0, 0, 1],
    emissive: sprite.emissive || 0,
    color: [1, 1, 1, 1]
});
```

### 8.2 向后兼容

```javascript
class HD2DRenderer {
    // 如果WebGL2不可用，回退到Canvas2D
    constructor(canvas) {
        try {
            this.initWebGL2();
        } catch (e) {
            console.warn('WebGL2 not available, falling back to Canvas2D');
            this.initCanvas2D();
        }
    }
}
```

---

*PLAN v1.0 - HD-2D暗黑渲染系统*
*预计总工期: 4周*
*目标: 八方旅人级别的2D光照效果 + 暗黑色调*
