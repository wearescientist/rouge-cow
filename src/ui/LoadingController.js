class LoadingController {
    constructor() {
        this.root = document.getElementById('loadingScreen');
        this.bar = document.getElementById('loadingBar');
        this.percent = document.getElementById('loadingPercent');
        this.current = document.getElementById('loadingCurrent');
        this.tip = document.getElementById('loadingTip');
        this.tips = [
            '💡 击败敌人获得经验，升级解锁新武器',
            '💡 武器8级+对应被动可以合成超武',
            '💡 探索隐藏房间获得额外奖励',
            '💡 不同敌人有不同的攻击模式',
            '💡 收集金币在商店购买道具',
            '💡 牛牛的父母还在地下深处...',
            '💡 暴击伤害是普通伤害的2倍',
            '💡 宠物会自动攻击范围内的敌人'
        ];
    }

    async showWhile(task) {
        if (!this.root) {
            return task();
        }

        this.root.style.display = 'flex';
        this.root.style.opacity = '1';

        try {
            return await task();
        } finally {
            this.root.style.opacity = '0';
            this.root.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                this.root.style.display = 'none';
            }, 500);
        }
    }

    updateProgress(progress, taskName = '') {
        if (this.bar) this.bar.style.width = `${progress}%`;
        if (this.percent) this.percent.textContent = `${Math.floor(progress)}%`;
        if (this.current) this.current.textContent = taskName ? `正在整理: ${taskName}` : '准备中...';

        if (this.tip) {
            const safeProgress = Math.max(0, Math.min(100, Math.floor(progress)));
            const tipIndex = Math.min(this.tips.length - 1, Math.floor((safeProgress / 100) * this.tips.length));
            this.tip.textContent = this.tips[tipIndex];
        }

        if (this.current && progress >= 100) {
            this.current.textContent = '洞口已打开，正在进入...';
        }
    }

    hide() {
        if (!this.root) return;
        this.root.style.display = 'none';
    }
}

window.LoadingController = LoadingController;
