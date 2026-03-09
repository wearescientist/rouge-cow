/**
 * StorySystem - 剧情解锁系统
 * 环境叙事、记忆碎片、结局收集
 */

class StorySystem {
    constructor(world) {
        this.world = world;
        this.priority = 300;
        this.enabled = true;
        
        // 剧情数据库
        this.stories = new Map();
        
        // 已解锁剧情
        this.unlocked = new Set();
        
        // 记忆碎片
        this.fragments = new Map();
        
        // 结局收集
        this.endings = new Map();
        
        // 当前游戏会话中触发的剧情
        this.sessionStories = [];
        
        // 阅读状态
        this.readStories = new Set();
        
        this.initStories();
    }
    
    init() {
        // 监听游戏事件
        this.world.on('floorEntered', (data) => this.onFloorEntered(data));
        this.world.on('bossKilled', (data) => this.onBossKilled(data));
        this.world.on('secretRoomFound', (data) => this.onSecretFound(data));
        this.world.on('itemPickedUp', (data) => this.onItemPickup(data));
        this.world.on('gameCompleted', (data) => this.onGameComplete(data));
        this.world.on('playerDied', (data) => this.onPlayerDeath(data));
        this.world.on('enemyKilled', (data) => this.onEnemyKill(data));
        
        // 按键监听
        this.world.on('keyPressed', (key) => {
            if (key === 'l' || key === 'L') {
                this.toggleUI();
            }
        });
        
        // 加载数据
        this.loadData();
    }
    
    /**
     * 初始化剧情数据
     */
    initStories() {
        // ===== 开场剧情 =====
        this.addStory({
            id: 'intro',
            title: '深渊召唤',
            content: `你站在深根之疫的入口前。这是一个被古老瘟疫吞噬的地下世界，曾经繁荣的文明如今只剩废墟和怪物。\n\n传说在最深处，有一颗"千根之心"，它是瘟疫的源头，也是唯一的希望。\n\n你握紧武器，迈出了第一步...`,
            category: 'main',
            trigger: { type: 'gameStart' },
            order: 1
        });
        
        // ===== 主线剧情 =====
        this.addStory({
            id: 'floor_2_discover',
            title: '菌丝蔓延',
            content: `越往下走，空气中弥漫的孢子越浓重。墙壁上覆盖着厚厚的菌丝，它们似乎在呼吸，在生长。\n\n你看到了第一个被完全感染的区域——曾经的农田现在变成了真菌的温床。那些摇曳的巨大蘑菇，曾经可能是普通的作物...`,
            category: 'main',
            trigger: { type: 'reachFloor', floor: 2 },
            order: 2
        });
        
        this.addStory({
            id: 'floor_3_discover',
            title: '孵化之巢',
            content: `低沉的脉动声从深处传来。这里不再是单纯的感染区，而是某种"孕育"的场所。\n\n你发现了无数卵囊，有些已经破裂，有些还在蠕动。那个被称为"孵化之母"的存在，正在创造这些怪物...`,
            category: 'main',
            trigger: { type: 'reachFloor', floor: 3 },
            order: 3
        });
        
        this.addStory({
            id: 'floor_4_discover',
            title: '神经中枢',
            content: `发光的脉络遍布整个洞穴，像是一个巨大的大脑。你意识到这不是自然形成的——这是某种有智慧的存在的"思维网络"。\n\n当你触碰那些发光的触须时，脑海中闪过了不属于你的记忆片段...`,
            category: 'main',
            trigger: { type: 'reachFloor', floor: 4 },
            order: 4
        });
        
        this.addStory({
            id: 'floor_5_discover',
            title: '消化深渊',
            content: `刺鼻的酸性气体让你难以呼吸。这里的地面是半透明的膜，下方可以看到缓缓流动的消化液，以及...残骸。\n\n这是一个巨大的胃囊，而你，可能即将成为它的养分。`,
            category: 'main',
            trigger: { type: 'reachFloor', floor: 5 },
            order: 5
        });
        
        this.addStory({
            id: 'floor_6_discover',
            title: '核心地带',
            content: `终于，你来到了最深处。\n\n千根之心就在面前——一个由无数根须、触手、血管交织而成的庞然大物。它缓慢地脉动着，每一次跳动都让整个洞穴震颤。\n\n你能感受到它的"视线"，它也在观察你...等待你。`,
            category: 'main',
            trigger: { type: 'reachFloor', floor: 6 },
            order: 6
        });
        
        // ===== Boss剧情 =====
        this.addStory({
            id: 'boss_mycelium_lore',
            title: '菌丝女王',
            content: `她曾是这片地下世界的守护者，一位德鲁伊。当瘟疫来临时，她试图用自然魔法抵抗，却被反噬，与真菌融为一体。\n\n现在，她既是囚徒，也是女王。她的意识在菌丝网络中游荡，时而清醒，时而疯狂。`,
            category: 'boss',
            trigger: { type: 'encounterBoss', bossId: 'mycelium_queen' }
        });
        
        this.addStory({
            id: 'boss_incubation_lore',
            title: '孵化之母',
            content: `没有人见过它的真面目。有人说它曾是一位祈求子嗣的母亲，有人说它是疯狂科学家的造物。\n\n无论真相如何，它现在只是一个不断生产怪物的子宫，永不停歇，永不知足。`,
            category: 'boss',
            trigger: { type: 'encounterBoss', bossId: 'incubation_mother' }
        });
        
        this.addStory({
            id: 'boss_neural_lore',
            title: '神经暴君',
            content: `它不是生物，而是瘟疫本身进化出的"意识"。没有实体，却能控制被感染的一切。\n\n当你直视那些发光的神经节点时，你感到它也在直视你——直抵你的灵魂深处。`,
            category: 'boss',
            trigger: { type: 'encounterBoss', bossId: 'neural_tyrant' }
        });
        
        this.addStory({
            id: 'boss_heart_lore',
            title: '千根之心',
            content: `这就是一切的源头。\n\n它不是邪恶的，它只是...饥饿。它想要生长，想要蔓延，想要连接一切生命。在它简单的思维中，这不是毁灭，而是"统一"。\n\n你能结束这一切吗？还是说，你也会被同化，成为它的一部分？`,
            category: 'boss',
            trigger: { type: 'encounterBoss', bossId: 'heart_of_roots' }
        });
        
        // ===== 结局 =====
        this.addStory({
            id: 'ending_purification',
            title: '结局：净化',
            content: `你摧毁了千根之心。\n\n随着一声震撼整个地下世界的尖啸，那些菌丝开始枯萎，那些怪物开始崩溃。瘟疫正在消退。\n\n当你走出深渊时，阳光照在脸上。你不知道自己是否真的拯救了世界，但至少，你给了它一个机会。\n\n【你达成了：净化结局】`,
            category: 'ending',
            trigger: { type: 'gameComplete', condition: 'normal' }
        });
        
        this.addStory({
            id: 'ending_sacrifice',
            title: '结局：牺牲',
            content: `你选择与千根之心融合，用自己的意志压制它的本能。\n\n这是一个永恒的战斗。每一天，你都在抵抗着"蔓延"的诱惑；每一刻，你都在平衡着生与死。\n\n你成为了新的"守护者"，用永恒的孤独换取地表世界的安宁。\n\n【你达成了：牺牲结局】`,
            category: 'ending',
            trigger: { type: 'gameComplete', condition: 'sacrifice' }
        });
        
        this.addStory({
            id: 'ending_domination',
            title: '结局：统治',
            content: `你击败了千根之心，然后取代了他。\n\n为什么要摧毁如此强大的力量？你可以控制它，引导它，用它建立一个全新的帝国。\n\n当根须再次蔓延时，它们将服从你的意志。你既是救世主，也是新世界的暴君。\n\n【你达成了：统治结局】`,
            category: 'ending',
            trigger: { type: 'gameComplete', condition: 'domination' }
        });
        
        this.addStory({
            id: 'ending_truth',
            title: '结局：真相',
            content: `在千根之心的核心，你发现了一个惊人的秘密——这不是瘟疫，而是治疗。\n\n古老的文明预见了地表世界的毁灭，创造了这种"感染"来保存生命。所有被同化的生物并没有死，它们的意识保存在神经网络中，等待着新世界。\n\n你选择启动重启程序。千年之后，当世界恢复，他们将再次醒来。\n\n【你达成了：真结局】`,
            category: 'ending',
            trigger: { type: 'gameComplete', condition: 'true', requirement: 'allFragments' }
        });
        
        // ===== 记忆碎片 =====
        this.addFragment({
            id: 'fragment_researcher',
            title: '研究员的笔记 #1',
            content: '实验体7号显示出惊人的适应性。如果我们能控制这种共生关系...不，长官，我不建议加速实验。我们还不知道长期影响。',
            location: { floor: 2, type: 'secret' }
        });
        
        this.addFragment({
            id: 'fragment_mother',
            title: '母亲的信',
            content: '亲爱的，妈妈要去地下工作一段时间。不要难过，这是为了所有人的未来。当春天来临时，我会带着礼物回来。爱你的妈妈。',
            location: { floor: 3, type: 'secret' }
        });
        
        this.addFragment({
            id: 'fragment_warning',
            title: '最后的警告',
            content: '如果你读到这个，立刻离开！它们不是植物，它们是...某种更古老的东西。它们在"学习"我们，模仿我们。阻止已经太晚了，但你可以逃跑。快逃！',
            location: { floor: 4, type: 'secret' }
        });
        
        this.addFragment({
            id: 'fragment_hope',
            title: '希望的种子',
            content: '我在核心发现了一些有趣的东西。这个"瘟疫"似乎有一个协议——当条件满足时，它会进入休眠状态。也许...也许我们可以与它谈判？',
            location: { floor: 5, type: 'secret' }
        });
    }
    
    addStory(data) {
        this.stories.set(data.id, {
            ...data,
            unlocked: false,
            read: false
        });
    }
    
    addFragment(data) {
        this.fragments.set(data.id, {
            ...data,
            found: false,
            read: false
        });
    }
    
    // ===== 事件处理 =====
    onFloorEntered(data) {
        const floor = data.floor;
        
        // 检查主线剧情
        for (const [id, story] of this.stories) {
            if (story.category === 'main' && story.trigger?.type === 'reachFloor') {
                if (story.trigger.floor === floor) {
                    this.unlockStory(id);
                }
            }
        }
    }
    
    onBossKilled(data) {
        const bossId = data.boss?.id || data.bossId;
        if (!bossId) return;
        
        // 检查Boss剧情
        for (const [id, story] of this.stories) {
            if (story.category === 'boss' && story.trigger?.type === 'encounterBoss') {
                if (story.trigger.bossId === bossId) {
                    this.unlockStory(id);
                }
            }
        }
    }
    
    onSecretFound(data) {
        const floor = data.floor;
        
        // 检查该层的记忆碎片
        for (const [id, fragment] of this.fragments) {
            if (!fragment.found && fragment.location?.floor === floor) {
                this.unlockFragment(id);
            }
        }
    }
    
    onItemPickup(data) {
        // 某些特殊物品触发剧情
        if (data.itemId === 'ancient tablet') {
            this.unlockStory('lore_ancient');
        }
    }
    
    onGameComplete(data) {
        // 检查结局条件
        const fragmentsCount = Array.from(this.fragments.values()).filter(f => f.found).length;
        const allFragments = fragmentsCount >= this.fragments.size;
        
        if (allFragments && data.trueEnding) {
            this.unlockStory('ending_truth');
            this.endings.set('truth', true);
        } else if (data.sacrifice) {
            this.unlockStory('ending_sacrifice');
            this.endings.set('sacrifice', true);
        } else if (data.domination) {
            this.unlockStory('ending_domination');
            this.endings.set('domination', true);
        } else {
            this.unlockStory('ending_purification');
            this.endings.set('purification', true);
        }
    }
    
    onPlayerDeath(data) {
        // 死亡时可能触发剧情
        if (data.floor === 6) {
            this.unlockStory('death_near_end');
        }
    }
    
    onEnemyKill(data) {
        // 击杀特定敌人解锁剧情
        if (data.enemyType === 'mimic') {
            this.unlockStory('lore_mimic');
        }
    }
    
    // ===== 解锁处理 =====
    unlockStory(id) {
        if (this.unlocked.has(id)) return;
        
        const story = this.stories.get(id);
        if (!story) return;
        
        this.unlocked.add(id);
        story.unlocked = true;
        
        // 添加到会话记录
        this.sessionStories.push({
            id,
            title: story.title,
            time: Date.now()
        });
        
        this.world.emit('storyUnlocked', { story });
        
        console.log(`📖 剧情解锁: ${story.title}`);
        
        this.saveData();
    }
    
    unlockFragment(id) {
        const fragment = this.fragments.get(id);
        if (!fragment || fragment.found) return;
        
        fragment.found = true;
        
        this.world.emit('fragmentFound', { fragment });
        
        console.log(`🧩 记忆碎片: ${fragment.title}`);
        
        this.saveData();
    }
    
    markAsRead(id) {
        this.readStories.add(id);
        const story = this.stories.get(id);
        if (story) story.read = true;
    }
    
    // ===== 获取信息 =====
    getUnlockedStories(category = null) {
        return Array.from(this.stories.values())
            .filter(s => this.unlocked.has(s.id))
            .filter(s => !category || s.category === category)
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    
    getFoundFragments() {
        return Array.from(this.fragments.values()).filter(f => f.found);
    }
    
    getUnlockedEndings() {
        return Array.from(this.endings.keys());
    }
    
    hasUnreadStories() {
        return Array.from(this.stories.values()).some(s => 
            this.unlocked.has(s.id) && !this.readStories.has(s.id)
        );
    }
    
    // ===== 持久化 =====
    loadData() {
        try {
            const saved = localStorage.getItem('rougeCow_story');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.unlocked) {
                    data.unlocked.forEach(id => {
                        this.unlocked.add(id);
                        const story = this.stories.get(id);
                        if (story) story.unlocked = true;
                    });
                }
                if (data.read) {
                    data.read.forEach(id => this.readStories.add(id));
                }
                if (data.fragments) {
                    data.fragments.forEach(id => {
                        const frag = this.fragments.get(id);
                        if (frag) frag.found = true;
                    });
                }
                if (data.endings) {
                    Object.entries(data.endings).forEach(([k, v]) => {
                        this.endings.set(k, v);
                    });
                }
            }
        } catch (e) {
            console.warn('加载剧情数据失败:', e);
        }
    }
    
    saveData() {
        try {
            const data = {
                unlocked: Array.from(this.unlocked),
                read: Array.from(this.readStories),
                fragments: Array.from(this.fragments.values()).filter(f => f.found).map(f => f.id),
                endings: Object.fromEntries(this.endings),
                timestamp: Date.now()
            };
            localStorage.setItem('rougeCow_story', JSON.stringify(data));
        } catch (e) {
            console.warn('保存剧情数据失败:', e);
        }
    }
    
    // ===== UI =====
    toggleUI() {
        this.isUIOpen = !this.isUIOpen;
        if (this.isUIOpen) {
            this.world.emit('gamePaused');
        } else {
            this.world.emit('gameResumed');
        }
    }
    
    render(ctx) {
        if (!this.isUIOpen) return;
        
        const canvas = ctx.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, w, h);
        
        // 窗口
        const winW = 800;
        const winH = 600;
        const winX = (w - winW) / 2;
        const winY = (h - winH) / 2;
        
        ctx.fillStyle = '#0a0a15';
        ctx.fillRect(winX, winY, winW, winH);
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 2;
        ctx.strokeRect(winX, winY, winW, winH);
        
        // 标题
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📖 深根编年史', w / 2, winY + 35);
        
        // 左侧：剧情列表
        this.renderStoryList(ctx, winX + 10, winY + 50, 300, winH - 70);
        
        // 右侧：内容显示
        this.renderStoryContent(ctx, winX + 320, winY + 50, winW - 330, winH - 70);
        
        // 关闭提示
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按 [L] 关闭', w / 2, winY + winH - 10);
    }
    
    renderStoryList(ctx, x, y, w, h) {
        // 分类标签
        const categories = [
            { id: 'main', name: '主线' },
            { id: 'boss', name: 'Boss' },
            { id: 'ending', name: '结局' }
        ];
        
        let catY = y;
        categories.forEach(cat => {
            // 分类标题
            ctx.fillStyle = '#8e44ad';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(cat.name, x + 10, catY + 20);
            catY += 30;
            
            // 剧情项
            const stories = this.getUnlockedStories(cat.id);
            stories.forEach(story => {
                const isUnread = !this.readStories.has(story.id);
                
                ctx.fillStyle = isUnread ? '#2c3e50' : '#1a1a1a';
                ctx.fillRect(x, catY, w, 30);
                
                // 未读标记
                if (isUnread) {
                    ctx.fillStyle = '#e74c3c';
                    ctx.beginPath();
                    ctx.arc(x + 10, catY + 15, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 标题
                ctx.fillStyle = isUnread ? '#fff' : '#888';
                ctx.font = isUnread ? 'bold 12px Arial' : '12px Arial';
                ctx.fillText(story.title, x + 20, catY + 20);
                
                catY += 35;
            });
            
            catY += 10;
        });
        
        // 记忆碎片
        ctx.fillStyle = '#8e44ad';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('记忆碎片', x + 10, catY + 20);
        catY += 30;
        
        const fragments = this.getFoundFragments();
        fragments.forEach(frag => {
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(x, catY, w, 25);
            
            ctx.fillStyle = '#bbb';
            ctx.font = '11px Arial';
            ctx.fillText(`🧩 ${frag.title}`, x + 10, catY + 17);
            
            catY += 28;
        });
    }
    
    renderStoryContent(ctx, x, y, w, h) {
        // 获取最新解锁的剧情显示
        const stories = this.getUnlockedStories();
        if (stories.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('继续探索以解锁更多剧情...', x + w / 2, y + h / 2);
            return;
        }
        
        const story = stories[stories.length - 1];
        
        // 标记为已读
        this.markAsRead(story.id);
        
        // 标题
        ctx.fillStyle = '#9b59b6';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(story.title, x, y + 25);
        
        // 分隔线
        ctx.strokeStyle = '#8e44ad';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y + 35);
        ctx.lineTo(x + w, y + 35);
        ctx.stroke();
        
        // 内容（自动换行）
        ctx.fillStyle = '#ccc';
        ctx.font = '14px Arial';
        
        const words = story.content.split('');
        let line = '';
        let lineY = y + 60;
        const lineHeight = 22;
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > w && line !== '') {
                ctx.fillText(line, x, lineY);
                line = words[i];
                lineY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, lineY);
    }
    
    update(dt) {}
}

window.StorySystem = StorySystem;
