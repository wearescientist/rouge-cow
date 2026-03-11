/**
 * GameRenderer.js - 游戏渲染系统
 * 从 Game 类分离的所有绘制逻辑
 */

class GameRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
    }
    
    /**
     * 主绘制入口
     */
    render() {
        const ctx = this.ctx;
        const game = this.game;
        
        // 清空画布
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制地图
        if (game.map) {
            game.map.draw(ctx);
        }
        
        // 绘制游戏对象...
        // (具体的绘制逻辑从 Game 类迁移)
    }
    
    /**
     * 绘制UI
     */
    renderUI() {
        // 绘制血条、经验条、金币等
    }
    
    /**
     * 绘制暂停界面
     */
    drawPauseScreen() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.canvas.width/2, this.canvas.height/2);
    }
    
    /**
     * 绘制结果界面
     */
    drawResultScreen() {
        // 游戏结束/胜利界面
    }
    
    /**
     * 绘制 Credits
     */
    drawCredits(ctx) {
        // 制作人员滚动
    }
}

// 导出到全局
window.GameRenderer = GameRenderer;
