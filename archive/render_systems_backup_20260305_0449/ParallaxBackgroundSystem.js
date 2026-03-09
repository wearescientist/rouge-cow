// ============================================================
// v0.24 - 视差背景系统 (Parallax Background System)
// 八方旅人风格：多层视差滚动背景
// ============================================================

export class ParallaxBackgroundSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // v0.24-r4: 增强视差层配置
        this.layers = [
            { name: 'sky', parallax: 0.05, offsetY: 0, elements: [], fogDensity: 0 },
            { name: 'far', parallax: 0.15, offsetY: -80, elements: [], fogDensity: 0.3 },
            { name: 'midFar', parallax: 0.3, offsetY: -30, elements: [], fogDensity: 0.2 },
            { name: 'mid', parallax: 0.5, offsetY: 40, elements: [], fogDensity: 0.1 },
            { name: 'near', parallax: 0.75, offsetY: 100, elements: [], fogDensity: 0 }
        ];
        
        // 动画参数
        this.cloudOffset = 0;
        this.cloudSpeed = 2;
        
        // 每层的canvas
        this.layerCanvases = this.layers.map(() => {
            const canvas = document.createElement('canvas');
            canvas.width = width * 2; // 双缓冲
            canvas.height = height;
            return {
                canvas: canvas,
                ctx: canvas.getContext('2d'),
                offsetX: 0
            };
        });
        
        this.time = 0;
        this.currentFloor = 1;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.layerCanvases.forEach(lc => {
            lc.canvas.width = width * 2;
            lc.canvas.height = height;
        });
    }
    
    setFloor(floor) {
        this.currentFloor = floor;
        this.generateLayerElements(floor);
        this.renderLayers();
    }
    
    /**
     * 生成各层元素
     */
    generateLayerElements(floor) {
        const colors = this.getFloorColors(floor);
        
        this.layers.forEach((layer, index) => {
            layer.elements = [];
            const elementCount = 5 + index * 3; // 越远元素越少
            
            for (let i = 0; i < elementCount; i++) {
                layer.elements.push({
                    x: Math.random() * this.width * 2,
                    y: this.height * 0.3 + Math.random() * this.height * 0.4,
                    width: 50 + Math.random() * 150,
                    height: 100 + Math.random() * 200,
                    type: this.getElementType(layer.name, floor),
                    color: colors[layer.name],
                    detail: colors[`${layer.name}Detail`]
                });
            }
        });
    }
    
    getElementType(layerName, floor) {
        const types = {
            sky: ['cloud', 'gradient', 'stars'],
            far: ['mountain', 'ruins', 'cave_wall', 'distant_arch'],
            midFar: ['pillar', 'broken_wall', 'arch'],
            mid: ['pillar', 'arch', 'rock', 'statue'],
            near: ['bush', 'rock_detail', 'debris', 'grass']
        };
        const layerTypes = types[layerName] || ['rock'];
        return layerTypes[Math.floor(Math.random() * layerTypes.length)];
    }
    
    /**
     * 预渲染各层
     */
    renderLayers() {
        this.layers.forEach((layer, index) => {
            const lc = this.layerCanvases[index];
            const ctx = lc.ctx;
            
            ctx.clearRect(0, 0, lc.canvas.width, lc.canvas.height);
            
            layer.elements.forEach(el => {
                this.drawElement(ctx, el, layer.name);
            });
        });
    }
    
    drawElement(ctx, el, layerName) {
        ctx.fillStyle = el.color;
        
        switch(el.type) {
            case 'mountain':
            case 'cave_wall':
                // 三角形山峰/岩壁
                ctx.beginPath();
                ctx.moveTo(el.x, el.y + el.height);
                ctx.lineTo(el.x + el.width / 2, el.y);
                ctx.lineTo(el.x + el.width, el.y + el.height);
                ctx.closePath();
                ctx.fill();
                
                // 细节纹理
                if (el.detail) {
                    ctx.fillStyle = el.detail;
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(el.x + el.width * 0.3, el.y + el.height * 0.6);
                    ctx.lineTo(el.x + el.width * 0.4, el.y + el.height * 0.3);
                    ctx.lineTo(el.x + el.width * 0.5, el.y + el.height * 0.6);
                    ctx.closePath();
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                break;
                
            case 'ruins':
            case 'pillar':
            case 'arch':
                // 柱状结构
                ctx.fillRect(el.x, el.y, el.width * 0.3, el.height);
                ctx.fillRect(el.x + el.width * 0.7, el.y, el.width * 0.3, el.height);
                
                // 横梁
                ctx.fillRect(el.x, el.y, el.width, el.height * 0.1);
                break;
                
            case 'rock':
            case 'rock_detail':
                // 不规则岩石
                ctx.beginPath();
                ctx.moveTo(el.x + el.width * 0.2, el.y + el.height);
                ctx.lineTo(el.x, el.y + el.height * 0.5);
                ctx.lineTo(el.x + el.width * 0.3, el.y);
                ctx.lineTo(el.x + el.width * 0.8, el.y + el.height * 0.2);
                ctx.lineTo(el.x + el.width, el.y + el.height * 0.6);
                ctx.lineTo(el.x + el.width * 0.7, el.y + el.height);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'cloud':
                // 云朵
                ctx.globalAlpha = 0.3;
                ctx.beginPath();
                ctx.arc(el.x, el.y, el.width * 0.3, 0, Math.PI * 2);
                ctx.arc(el.x + el.width * 0.3, el.y - 10, el.width * 0.25, 0, Math.PI * 2);
                ctx.arc(el.x + el.width * 0.5, el.y, el.width * 0.3, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                break;
                
            case 'bush':
            case 'debris':
                // 草丛/碎片
                for (let i = 0; i < 5; i++) {
                    const bx = el.x + (i / 4) * el.width;
                    const bh = el.height * (0.5 + Math.random() * 0.5);
                    ctx.fillRect(bx, el.y + el.height - bh, 8, bh);
                }
                break;
        }
    }
    
    /**
     * 绘制视差背景
     */
    drawParallaxBackground(ctx, camera) {
        // 安全检查
        if (!isFinite(this.width) || !isFinite(this.height) || this.width <= 0 || this.height <= 0) return;
        
        // 绘制天空/背景色
        const colors = this.getFloorColors(this.currentFloor);
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, colors.skyTop);
        gradient.addColorStop(1, colors.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制各视差层
        this.layers.forEach((layer, index) => {
            this.drawLayer(ctx, layer, index, camera);
        });
    }
    
    drawLayer(ctx, layer, index, camera) {
        const lc = this.layerCanvases[index];
        
        // 计算视差偏移
        const parallaxX = camera.x * layer.parallax;
        const viewX = parallaxX % this.width;
        
        // 双缓冲绘制实现无缝滚动
        const drawX1 = -viewX;
        const drawX2 = drawX1 + this.width * 2;
        
        ctx.save();
        ctx.globalAlpha = 0.3 + layer.parallax * 0.5;
        
        // 绘制两层实现无缝循环
        ctx.drawImage(lc.canvas, drawX1, layer.offsetY, this.width * 2, this.height);
        if (drawX1 + this.width * 2 < this.width) {
            ctx.drawImage(lc.canvas, drawX2, layer.offsetY, this.width * 2, this.height);
        }
        
        ctx.restore();
    }
    
    getFloorColors(floor) {
        const palettes = {
            1: { // 菌丝
                skyTop: '#0f1f17', skyBottom: '#1a2a22',
                sky: '#1a2a22', far: '#2a3a32', mid: '#3a4a42', near: '#4a5a52',
                farDetail: '#1f2f27', midDetail: '#2f3f37'
            },
            2: { // 温室
                skyTop: '#0f2f0f', skyBottom: '#1f4f1f',
                sky: '#1a3a1a', far: '#2a5a2a', mid: '#3a7a3a', near: '#4a9a4a',
                farDetail: '#1f4f1f', midDetail: '#2f6f2f'
            },
            3: { // 神经
                skyTop: '#1f0f1f', skyBottom: '#2f1f2f',
                sky: '#2a1a2a', far: '#4a2a4a', mid: '#6a3a6a', near: '#8a4a8a',
                farDetail: '#3f1f3f', midDetail: '#5f2f5f'
            },
            4: { // 熔炉
                skyTop: '#3f0f00', skyBottom: '#5f1f0f',
                sky: '#3a1a0a', far: '#5a2a1a', mid: '#7a3a2a', near: '#9a4a3a',
                farDetail: '#4f1f0f', midDetail: '#6f2f1f'
            },
            5: { // 庭院
                skyTop: '#1f1f0f', skyBottom: '#2f2f1f',
                sky: '#2a2a1a', far: '#3a3a2a', mid: '#4a4a3a', near: '#5a5a4a',
                farDetail: '#2f2f1f', midDetail: '#3f3f2f'
            },
            6: { // 千根
                skyTop: '#2f0505', skyBottom: '#4a0a0a',
                sky: '#3a0a0a', far: '#4a1a1a', mid: '#5a2a2a', near: '#6a3a3a',
                farDetail: '#3f0505', midDetail: '#4f1515'
            }
        };
        return palettes[floor] || palettes[1];
    }
}
