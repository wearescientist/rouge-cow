# HD-2D 光照系统设计方案 v1.0

## 一、目标

实现八方旅人风格的光照效果：
- 2D像素 + 3D光照 = 立体油画感
- 强烈明暗对比
- 动态光源影响角色和环境

## 二、核心架构

### 2.1 渲染管线升级

```
当前: 前向渲染 (Forward Rendering)
     Sprite → Canvas (直接绘制)

目标: 延迟渲染 (Deferred Rendering)
     G-Buffer生成 → 光照计算 → 合成输出
     
G-Buffer结构:
  - Color: 基础颜色
  - Normal: 法线方向 (x,y,z)
  - Depth: 深度值
  - Material: 粗糙度/金属度
```

### 2.2 系统组件

```
src/render/lighting/
├── NormalMapGenerator.js      # 法线贴图生成
├── DeferredRenderer.js        # 延迟渲染器
├── LightManager.js            # 光源管理
├── GlobalIllumination.js      # 全局光照
├── PostProcess.js             # 后处理
└── shaders/
    ├── gbuffer.frag           # G-Buffer着色器
    ├── lighting.frag          # 光照计算着色器
    └── composite.frag         # 合成着色器
```

## 三、详细设计

### 3.1 法线贴图系统

**方案A: 离线生成 (推荐)**
- 用工具预生成精灵的法线贴图
- 运行时直接加载使用
- 文件: `sprite_normal.png`

**方案B: 实时生成**
- 基于深度估计算法
- Sobel边缘检测 → 深度图 → 法线图
- 性能开销较大

**实现**:
```javascript
class NormalMapGenerator {
    // 从深度图生成法线图
    generateFromDepth(depthImage) {
        // Sobel算子计算梯度
        // 梯度 -> 法线
    }
    
    // 保存法线贴图
    saveNormalMap(spriteName, normalCanvas) {
        // 导出为 PNG
    }
}
```

### 3.2 延迟渲染器

**G-Buffer 通道**:
```javascript
class DeferredRenderer {
    constructor(canvas) {
        // 创建 G-Buffer 纹理
        this.gBuffer = {
            color: createTexture(),
            normal: createTexture(),
            depth: createTexture()
        };
        
        // 帧缓冲对象
        this.fbo = createFramebuffer();
    }
    
    // 第一阶段: 渲染到 G-Buffer
    renderGBuffer(entities) {
        bindFramebuffer(this.fbo);
        
        for (entity of entities) {
            // 绑定法线贴图
            bindTexture(entity.normalMap, 1);
            
            // 绘制到 G-Buffer
            drawQuad(entity);
        }
    }
    
    // 第二阶段: 光照计算
    renderLighting(lights) {
        bindFramebuffer(null); // 回到屏幕
        
        // 绑定 G-Buffer 作为输入
        bindTexture(this.gBuffer.color, 0);
        bindTexture(this.gBuffer.normal, 1);
        bindTexture(this.gBuffer.depth, 2);
        
        // 对每个光源计算光照
        for (light of lights) {
            applyLightShader(light);
            drawFullscreenQuad();
        }
    }
}
```

### 3.3 光源系统

**光源类型**:
```javascript
const LIGHT_TYPES = {
    POINT: 'point',           // 点光源 (火把、技能)
    DIRECTIONAL: 'directional', // 方向光 (太阳/月亮)
    SPOT: 'spot',             // 聚光灯 (探照灯)
    AMBIENT: 'ambient'        // 环境光 (基础亮度)
};

class Light {
    constructor(type, config) {
        this.type = type;
        this.position = config.position;
        this.color = config.color;
        this.intensity = config.intensity;
        this.range = config.range;
        
        // 点光源特有
        this.attenuation = config.attenuation;
        
        // 方向光特有
        this.direction = config.direction;
    }
}

class LightManager {
    constructor() {
        this.lights = [];
        this.maxLights = 16; // WebGL限制
    }
    
    addLight(light) {
        if (this.lights.length >= this.maxLights) {
            // 按重要性排序，剔除最不重要的
            this.cullLights();
        }
        this.lights.push(light);
    }
    
    // 每帧更新光源数据到 GPU
    uploadToGPU(shader) {
        for (let i = 0; i < this.lights.length; i++) {
            const light = this.lights[i];
            shader.setUniform(`u_lights[${i}].position`, light.position);
            shader.setUniform(`u_lights[${i}].color`, light.color);
            shader.setUniform(`u_lights[${i}].intensity`, light.intensity);
        }
    }
}
```

### 3.4 全局光照 (GI)

**方案: 简化的光探针 (Light Probes)**
```javascript
class GlobalIllumination {
    constructor(roomWidth, roomHeight) {
        // 在房间内均匀分布光探针
        this.probeGrid = createGrid(4, 4); // 4x4网格
        
        // 每个探针存储光照信息
        this.probes = [];
        for (let y = 0; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                this.probes.push({
                    position: { x: x * spacing, y: y * spacing },
                    irradiance: new Float32Array(3) // RGB
                });
            }
        }
    }
    
    // 更新光探针 (每帧或每几帧)
    updateProbes(lights) {
        for (probe of this.probes) {
            probe.irradiance = calculateIrradiance(probe.position, lights);
        }
    }
    
    // 采样某位置的GI
    sampleGI(position) {
        // 双线性插值最近的4个探针
        return bilinearInterpolate(position, this.probes);
    }
}
```

### 3.5 后处理

**色调映射 + 泛光**:
```javascript
class PostProcess {
    constructor() {
        this.tonemapShader = createShader(tonemapFrag);
        this.bloomShader = createShader(bloomFrag);
    }
    
    // 色调映射
    applyToneMapping(input, output) {
        // ACES 色调映射曲线
        // 让画面从"游戏感"变"电影感"
    }
    
    // 泛光效果
    applyBloom(input, output) {
        // 提取高光
        // 高斯模糊
        // 叠加回原图
    }
}
```

## 四、实施计划

### Phase 1: 基础设施 (2-3小时)
- [ ] 创建 G-Buffer 系统
- [ ] 编写基础 Shader
- [ ] 测试延迟渲染流程

### Phase 2: 法线贴图 (3-4小时)
- [ ] 实现法线贴图生成器
- [ ] 为主要角色生成法线图
- [ ] 集成到渲染流程

### Phase 3: 光源系统 (2-3小时)
- [ ] 实现 LightManager
- [ ] 添加动态光源支持
- [ ] 火把、技能光效

### Phase 4: 全局光照 (3-4小时)
- [ ] 实现光探针系统
- [ ] 墙壁反射光
- [ ] 环境光遮蔽 (AO)

### Phase 5: 后处理 (2小时)
- [ ] 色调映射
- [ ] 泛光效果
- [ ] 最终调色

## 五、技术难点

1. **WebGL限制** - 需要管理好纹理单元和 Uniform 数量
2. **性能优化** - 移动端可能需要降级方案
3. **法线贴图** - 自动生成质量可能不如手工绘制

## 六、备选方案

如果完整延迟渲染太复杂，可采用简化版:
- 保持前向渲染
- 使用法线贴图计算简单光照
- 限制光源数量 (4-8个)
- 屏幕空间环境光遮蔽 (SSAO)

---

**设计完成！等陛下回来看方案！** ~Meow
