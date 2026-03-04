/**
 * Canvas 程序化贴图生成器 - 用于本地开发测试
 * 直接在浏览器中生成像素贴图，无需PNG文件
 */

// 调色板
const PALETTE = {
  c0: '#0d0d1a', c1: '#2a2a3a', c2: '#4a4a5a', c3: '#7a7a8a',
  c4: '#d0d0e0', c5: '#f0f0e0', c6: '#5a3a2a', c7: '#8a6a4a',
  c8: '#c4a030', c9: '#e8b860', c10: '#4a6a3a', c11: '#7a9a6a',
  c12: '#3a6a6a', c13: '#5a9a9a', c14: '#8a3a3a', c15: '#c48a8a',
  a0: '#e8f0e8', a1: '#c0d0c0', a2: '#90b090', a3: '#60a060',
  a4: '#6a3a8a', a5: '#9a6aba', a6: '#c09ae0', a7: '#c47a2a',
  a8: '#e0a030', a9: '#a03020', a10: '#8a1a1a', a11: '#ff4a4a',
  a12: '#4affff', a13: '#ffd700', a14: '#1a0d1a', a15: '#0a050a'
};

class CanvasSpriteGenerator {
  constructor(size = 32) {
    this.size = size;
    this.canvas = document.createElement('canvas');
    this.canvas.width = size;
    this.canvas.height = size;
    this.ctx = this.canvas.getContext('2d');
  }

  clear() {
    this.ctx.clearRect(0, 0, this.size, this.size);
  }

  pixel(x, y, color) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, 1, 1);
    }
  }

  rect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  circle(cx, cy, r, color, filled = true) {
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (filled) {
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }

  // ===== 主角牛牛 =====
  generatePlayer() {
    const c = PALETTE;
    this.clear();
    
    // 身体
    this.circle(16, 18, 8, c.c7);
    this.circle(16, 20, 5, c.c9);
    
    // 头
    this.circle(16, 10, 6, c.c9);
    
    // 眼睛
    this.pixel(13, 9, c.c0);
    this.pixel(18, 9, c.c0);
    this.pixel(14, 8, c.c4);
    this.pixel(19, 8, c.c4);
    
    // 耳朵
    this.rect(9, 8, 2, 3, c.c7);
    this.rect(21, 8, 2, 3, c.c7);
    
    // 双角（金色发光）
    this.rect(10, 4, 3, 5, c.c8);
    this.rect(19, 4, 3, 5, c.c8);
    this.pixel(11, 3, c.a13);
    this.pixel(20, 3, c.a13);
    
    // 地脉发光纹路
    this.pixel(15, 16, c.a13);
    this.pixel(17, 16, c.a13);
    this.pixel(16, 18, c.c9);
    
    // 腿
    this.rect(14, 25, 2, 3, c.c6);
    this.rect(18, 25, 2, 3, c.c6);
    this.pixel(15, 27, c.c4);
    this.pixel(19, 27, c.c4);
    
    return this.canvas.toDataURL();
  }

  // ===== Tier 1 敌人：感染小鸡 =====
  generateChick() {
    const c = PALETTE;
    this.clear();
    
    // 身体（苍白）
    this.circle(16, 18, 7, c.a0);
    this.circle(16, 20, 4, c.c4);
    
    // 头
    this.circle(16, 10, 5, c.c4);
    
    // 感染眼睛（乳白色）
    this.pixel(13, 9, c.a0);
    this.pixel(14, 9, c.a1);
    this.pixel(18, 9, c.a0);
    this.pixel(17, 9, c.a1);
    
    // 喙（菌丝化）
    this.rect(15, 12, 2, 2, c.a2);
    
    // 翅膀
    this.rect(8, 16, 3, 2, c.a1);
    this.rect(21, 17, 3, 2, c.a1);
    
    // 腿
    this.pixel(14, 25, c.c6);
    this.pixel(18, 25, c.c6);
    
    // 菌丝斑点
    this.pixel(10, 15, c.a1);
    this.pixel(22, 20, c.a2);
    this.pixel(12, 22, c.a1);
    
    return this.canvas.toDataURL();
  }

  // ===== Tier 1 敌人：感染老鼠 =====
  generateMouse() {
    const c = PALETTE;
    this.clear();
    
    // 身体
    this.rect(12, 14, 12, 8, c.a0);
    this.circle(24, 16, 4, c.c4);
    
    // 头
    this.rect(24, 12, 5, 5, c.c4);
    
    // 耳朵
    this.rect(22, 8, 3, 4, c.a1);
    this.rect(27, 8, 3, 4, c.a1);
    
    // 感染眼睛（血丝）
    this.pixel(26, 13, c.a10);
    this.pixel(28, 13, c.a10);
    
    // 鼻子
    this.pixel(29, 15, c.a1);
    
    // 尾巴（菌丝化）
    this.pixel(11, 18, c.a1);
    this.pixel(9, 19, c.a0);
    this.pixel(7, 18, c.a2);
    this.pixel(5, 17, c.a1);
    
    // 腿
    this.pixel(14, 22, c.c6);
    this.pixel(20, 22, c.c6);
    
    return this.canvas.toDataURL();
  }

  // ===== Tier 1 敌人：感染蜗牛 =====
  generateSnail() {
    const c = PALETTE;
    this.clear();
    
    // 壳
    this.circle(16, 16, 9, c.a0, false);
    this.circle(16, 16, 6, c.a1, false);
    this.circle(16, 16, 3, c.a2, true);
    
    // 菌丝覆盖壳
    this.pixel(23, 16, c.a1);
    this.pixel(16, 23, c.a1);
    this.pixel(9, 16, c.a1);
    this.pixel(16, 9, c.a1);
    
    // 身体
    this.rect(6, 14, 8, 6, c.a0);
    
    // 触角（发光）
    this.pixel(6, 12, c.a6);
    this.pixel(6, 10, c.a0);
    this.pixel(5, 13, c.a6);
    
    // 眼睛
    this.pixel(6, 9, c.a0);
    
    // 腹足
    this.rect(8, 20, 16, 2, c.a1);
    
    // 粘液
    this.pixel(4, 21, c.a3);
    this.pixel(5, 21, c.a3);
    this.pixel(6, 21, c.a3);
    
    return this.canvas.toDataURL();
  }

  // 通用生成入口
  generate(type) {
    switch(type) {
      case 'player': return this.generatePlayer();
      case 'chick': return this.generateChick();
      case 'mouse': return this.generateMouse();
      case 'snail': return this.generateSnail();
      default: return null;
    }
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.CanvasSpriteGenerator = CanvasSpriteGenerator;
}
