/**
 * 肉鸽牛牛 - 程序化像素贴图生成器
 * 基于故事《深根之疫》的视觉风格
 */

const fs = require('fs');
const path = require('path');

// 加载调色板
const palette = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../assets/palette.json'), 
  'utf8'
));

class SpriteGenerator {
  constructor(width = 32, height = 32) {
    this.width = width;
    this.height = height;
    this.canvas = null;
    this.ctx = null;
    this.initCanvas();
  }

  initCanvas() {
    // Node.js 环境下使用 node-canvas 或创建虚拟 canvas
    // 这里使用纯数据方式生成
    this.pixels = new Array(this.width * this.height).fill(null);
  }

  /**
   * 设置像素
   */
  setPixel(x, y, color) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.pixels[y * this.width + x] = color;
    }
  }

  /**
   * 绘制圆形
   */
  drawCircle(cx, cy, radius, color, filled = true) {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const dist = Math.sqrt(x * x + y * y);
        if (filled ? dist <= radius : Math.abs(dist - radius) < 0.8) {
          this.setPixel(cx + x, cy + y, color);
        }
      }
    }
  }

  /**
   * 绘制矩形
   */
  drawRect(x, y, w, h, color, filled = true) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (filled || 
            px === x || px === x + w - 1 || 
            py === y || py === y + h - 1) {
          this.setPixel(px, py, color);
        }
      }
    }
  }

  /**
   * 绘制线条
   */
  drawLine(x1, y1, x2, y2, color) {
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.setPixel(x1, y1, color);
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x1 += sx; }
      if (e2 < dx) { err += dx; y1 += sy; }
    }
  }

  /**
   * 绘制对称形状（用于动物身体）
   */
  drawSymmetricShape(centerX, centerY, pattern, color) {
    pattern.forEach(([dx, dy]) => {
      this.setPixel(centerX + dx, centerY + dy, color);
      if (dx !== 0) {
        this.setPixel(centerX - dx, centerY + dy, color);
      }
    });
  }

  /**
   * 生成牛牛主角贴图
   */
  generatePlayer() {
    const c = palette.mainColors;
    const a = palette.accentColors;
    
    // 身体 (棕色)
    this.drawCircle(16, 18, 8, c.c7_tan, true);
    
    // 头 (浅棕色)
    this.drawCircle(16, 10, 6, c.c9_amber, true);
    
    // 双角 (金色带发光)
    this.drawRect(10, 4, 3, 4, c.c8_gold, true);
    this.drawRect(19, 4, 3, 4, c.c8_gold, true);
    // 角发光效果
    this.setPixel(11, 3, a.a13_coreGold);
    this.setPixel(20, 3, a.a13_coreGold);
    
    // 眼睛
    this.setPixel(13, 9, c.c0_black);
    this.setPixel(18, 9, c.c0_black);
    
    // 蹄子
    this.setPixel(12, 25, c.c6_brown);
    this.setPixel(19, 25, c.c6_brown);
    
    // 地脉共鸣发光 (淡金纹路)
    this.setPixel(16, 14, a.a13_coreGold);
    this.setPixel(15, 16, a.a9_amber);
    this.setPixel(17, 16, a.a9_amber);
    
    return this.exportData();
  }

  /**
   * 生成感染敌人贴图 (Tier 1)
   */
  generateInfectedEnemy(type, tier = 1) {
    const theme = palette.enemyTiers[`tier${tier}_basic`] || 
                  palette.enemyTiers.tier1_basic;
    const infectionColor = palette.accentColors.a1_mycelium;
    
    let bodyColor, bodyShape;
    
    switch(type) {
      case 'chick':
        bodyColor = theme[0];
        // 小鸡身体
        this.drawCircle(16, 18, 7, bodyColor, true);
        // 头
        this.drawCircle(16, 10, 5, theme[1], true);
        // 感染特征：苍白眼睛
        this.setPixel(14, 9, infectionColor);
        this.setPixel(18, 9, infectionColor);
        // 菌丝细节
        this.setPixel(12, 15, infectionColor);
        this.setPixel(20, 20, infectionColor);
        break;
        
      case 'mouse':
        bodyColor = theme[1];
        // 老鼠身体 (细长)
        this.drawRect(10, 14, 12, 8, bodyColor, true);
        // 头
        this.drawCircle(22, 16, 4, theme[0], true);
        // 耳朵
        this.setPixel(24, 12, bodyColor);
        this.setPixel(25, 11, bodyColor);
        // 尾巴 (菌丝化)
        this.drawLine(10, 18, 4, 20, infectionColor);
        this.setPixel(3, 21, infectionColor);
        break;
        
      case 'snail':
        bodyColor = theme[2];
        // 壳
        this.drawCircle(16, 16, 8, theme[0], false);
        this.drawCircle(16, 16, 6, theme[1], false);
        // 身体
        this.drawRect(8, 14, 6, 6, bodyColor, true);
        // 触角 (感染发光)
        this.setPixel(6, 12, infectionColor);
        this.setPixel(6, 10, infectionColor);
        break;
        
      default:
        // 默认圆形生物
        this.drawCircle(16, 16, 8, bodyColor, true);
    }
    
    // 添加感染特效 (菌丝斑点)
    for (let i = 0; i < 3 + tier; i++) {
      const x = 10 + Math.floor(Math.random() * 12);
      const y = 10 + Math.floor(Math.random() * 12);
      this.setPixel(x, y, infectionColor);
    }
    
    return this.exportData();
  }

  /**
   * 导出为简单格式 (用于调试)
   */
  exportData() {
    return {
      width: this.width,
      height: this.height,
      pixels: this.pixels
    };
  }

  /**
   * 导出为 PPM 格式 (可转换为 PNG)
   */
  exportPPM() {
    let ppm = `P3\n${this.width} ${this.height}\n255\n`;
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.pixels[y * this.width + x];
        if (color) {
          const rgb = this.hexToRgb(color);
          ppm += `${rgb.r} ${rgb.g} ${rgb.b} `;
        } else {
          ppm += "0 0 0 "; // 透明/黑色
        }
      }
      ppm += "\n";
    }
    
    return ppm;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * 保存为 PPM 文件
   */
  savePPM(filename) {
    const ppm = this.exportPPM();
    fs.writeFileSync(filename, ppm);
    console.log(`Saved: ${filename}`);
  }
}

// 命令行使用
if (require.main === module) {
  console.log("=== 肉鸽牛牛贴图生成器 ===\n");
  
  // 生成主角
  const playerGen = new SpriteGenerator(32, 32);
  playerGen.generatePlayer();
  playerGen.savePPM(path.join(__dirname, '../generated_assets/player_test.ppm'));
  console.log("✓ 主角牛牛贴图生成完成");
  
  // 生成 Tier 1 敌人
  ['chick', 'mouse', 'snail'].forEach((type, i) => {
    const gen = new SpriteGenerator(32, 32);
    gen.generateInfectedEnemy(type, 1);
    gen.savePPM(path.join(__dirname, `../generated_assets/${type}_test.ppm`));
    console.log(`✓ ${type} 贴图生成完成`);
  });
  
  console.log("\n所有测试贴图已保存到 generated_assets/");
  console.log("使用 ImageMagick 转换: convert input.ppm output.png");
}

module.exports = SpriteGenerator;
