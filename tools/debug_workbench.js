(function () {
    'use strict';

    var STORAGE_KEY = 'rougelikeCow.debugWorkbench.v1';
    var CUSTOM_PREFIX = 'custom:';
    var DEFAULT_TOOLS = [
        {
            id: 'scene_art_workbench',
            title: '场景美术工作台',
            path: './scene_art_workbench.html',
            category: '场景',
            tags: ['场景', '地板', '门', '外壳'],
            summary: '整张画面的美术搭建台，支持拖图、拉伸、旋转、区域开关、图层和基础调色。',
            status: '新入口',
            featured: true
        },
        {
            id: 'monster_control_center',
            title: '怪物总控台',
            path: './monster_control_center.html',
            category: '怪物',
            tags: ['怪物', '总控台', '聚合'],
            summary: '聚合朝向、动画、体型、楼层配置，并补房间分布与资源选择入口。',
            status: '新入口',
            featured: true
        },
        {
            id: 'weapon_visual_debugger',
            title: '武器弹道与贴图调试器',
            path: './weapon_visual_debugger.html',
            category: '战斗',
            tags: ['武器', '弹道', '贴图'],
            summary: '当前最成熟的可视化工具，适合做后续编辑器交互基准。',
            status: '已验证',
            featured: true
        },
        {
            id: 'monster_facing_tool',
            title: '怪物朝向校准工具',
            path: './monster_facing_tool.html',
            category: '怪物',
            tags: ['怪物', '朝向', '翻转'],
            summary: '校验怪物面朝方向，导出翻转配置。',
            status: '已验证'
        },
        {
            id: 'monster_animation_debug',
            title: '怪物动画调试器',
            path: './monster_animation_debug.html',
            category: '怪物',
            tags: ['怪物', '动画', '帧预览'],
            summary: '查看动画帧、播放速度和状态切换，适合排查单怪动作问题。',
            status: '已验证'
        },
        {
            id: 'monster_bounce_selector',
            title: '怪物颠簸选择器',
            path: './monster_bounce_selector.html',
            category: '怪物',
            tags: ['怪物', '颠簸', '运动感'],
            summary: '筛选哪些怪物需要上下颠簸效果，支持实时预览。',
            status: '已验证'
        },
        {
            id: 'monster_floor_configurator',
            title: '怪物楼层配置器',
            path: './monster_floor_configurator.html',
            category: '怪物',
            tags: ['怪物', '楼层', '池配置'],
            summary: '按楼层查看和调整怪物投放配置。',
            status: '已接入'
        },
        {
            id: 'monster_layer_editor',
            title: '怪物分层编辑器',
            path: './monster_layer_editor.html',
            category: '怪物',
            tags: ['怪物', '分层', '池编辑'],
            summary: '处理分层怪物池与变体分配，偏配置管理。',
            status: '已接入'
        },
        {
            id: 'monster_size_classifier',
            title: '怪物体型分类器',
            path: './monster_size_classifier.html',
            category: '怪物',
            tags: ['怪物', '体型', '尺寸'],
            summary: '对比玩家与怪物尺寸，输出体型分类结果。',
            status: '已验证'
        },
        {
            id: 'compare_monster_styles',
            title: '怪物样式对比页',
            path: './compare_monster_styles.html',
            category: '资源',
            tags: ['怪物', '风格', '对比'],
            summary: '做贴图风格选择和版本对比时使用。',
            status: '已接入'
        },
        {
            id: 'sprite_compare_all',
            title: '全量贴图对比页',
            path: './sprite_compare_all.html',
            category: '资源',
            tags: ['贴图', '对比', '怪物'],
            summary: '综合查看多版本怪物贴图差异。',
            status: '已验证'
        },
        {
            id: 'sprite_debugger',
            title: 'Sprite 调试器',
            path: './SpriteDebugger.html',
            category: '资源',
            tags: ['Sprite', '预览', '调试'],
            summary: '偏底层的精灵显示与调试工具。',
            status: '已接入'
        },
        {
            id: 'sprite_preview',
            title: 'Sprite 预览页',
            path: './sprite_preview.html',
            category: '资源',
            tags: ['Sprite', '预览'],
            summary: '快速预览精灵资源和布局效果。',
            status: '已接入'
        },
        {
            id: 'resize_preview_floor1',
            title: '楼层1缩放预览',
            path: './resize_preview_floor1.html',
            category: '资源',
            tags: ['缩放', '楼层1', '预览'],
            summary: '验证 floor1 怪物缩放策略是否合理。',
            status: '已接入'
        },
        {
            id: 'tools_editor',
            title: '工具编辑器',
            path: './editor/index.html',
            category: '编辑器',
            tags: ['编辑器', '数据'],
            summary: '已有的独立编辑器入口，作为后续总控台参考。',
            status: '独立子系统'
        }
    ];
    var ROADMAP_CATEGORIES = ['全部', '场景', '战斗', '怪物', '资源', '编辑器'];

    var state = {
        order: [],
        hiddenIds: [],
        removedIds: [],
        customTools: [],
        search: '',
        category: '全部',
        dragId: ''
    };

    var el = {};

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function unique(items) {
        return Array.from(new Set(items));
    }

    function normalizeTool(tool) {
        return {
            id: String(tool.id || '').trim(),
            title: String(tool.title || '').trim(),
            path: String(tool.path || '').trim(),
            category: String(tool.category || '未分类').trim(),
            tags: Array.isArray(tool.tags) ? tool.tags.filter(Boolean) : [],
            summary: String(tool.summary || '').trim(),
            status: String(tool.status || '已接入').trim(),
            featured: Boolean(tool.featured)
        };
    }

    function getAllTools() {
        return DEFAULT_TOOLS.concat(state.customTools).map(normalizeTool);
    }

    function getToolMap() {
        var map = new Map();
        getAllTools().forEach(function (tool) {
            map.set(tool.id, tool);
        });
        return map;
    }

    function saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            order: state.order,
            hiddenIds: state.hiddenIds,
            removedIds: state.removedIds,
            customTools: state.customTools
        }));
    }

    function loadState() {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            resetState(false);
            return;
        }
        try {
            var parsed = JSON.parse(raw);
            resetState(false);
            state.order = Array.isArray(parsed.order) ? parsed.order.slice() : state.order;
            state.hiddenIds = Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds.slice() : [];
            state.removedIds = Array.isArray(parsed.removedIds) ? parsed.removedIds.slice() : [];
            state.customTools = Array.isArray(parsed.customTools) ? parsed.customTools.map(normalizeTool).filter(function (tool) {
                return tool.id && tool.title && tool.path;
            }) : [];
            reconcileState();
        } catch (error) {
            resetState(false);
        }
    }

    function resetState(shouldSave) {
        state.order = DEFAULT_TOOLS.map(function (tool) { return tool.id; });
        state.hiddenIds = [];
        state.removedIds = [];
        state.customTools = [];
        state.search = '';
        state.category = '全部';
        state.dragId = '';
        if (shouldSave) saveState();
    }

    function reconcileState() {
        var allIds = getAllTools().map(function (tool) { return tool.id; });
        var ordered = state.order.filter(function (id) { return allIds.indexOf(id) >= 0; });
        allIds.forEach(function (id) {
            if (ordered.indexOf(id) === -1) ordered.push(id);
        });
        state.order = unique(ordered);
        state.hiddenIds = state.hiddenIds.filter(function (id) { return allIds.indexOf(id) >= 0; });
        state.removedIds = state.removedIds.filter(function (id) { return allIds.indexOf(id) >= 0; });
    }

    function initDom() {
        el.categoryChips = document.getElementById('categoryChips');
        el.searchInput = document.getElementById('searchInput');
        el.clearSearchBtn = document.getElementById('clearSearchBtn');
        el.stats = document.getElementById('stats');
        el.toolGrid = document.getElementById('toolGrid');
        el.emptyState = document.getElementById('emptyState');
        el.resetLayoutBtn = document.getElementById('resetLayoutBtn');
        el.restoreBtn = document.getElementById('restoreBtn');
        el.openFirstBtn = document.getElementById('openFirstBtn');
        el.customTitleInput = document.getElementById('customTitleInput');
        el.customPathInput = document.getElementById('customPathInput');
        el.customCategoryInput = document.getElementById('customCategoryInput');
        el.addCustomBtn = document.getElementById('addCustomBtn');
        el.formStatus = document.getElementById('formStatus');
    }

    function renderCategories() {
        el.categoryChips.innerHTML = '';
        var categorySet = unique(ROADMAP_CATEGORIES.concat(getAllTools().map(function (tool) {
            return tool.category;
        })));
        categorySet.forEach(function (category) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'chip' + (state.category === category ? ' active' : '');
            button.textContent = category;
            button.addEventListener('click', function () {
                state.category = category;
                render();
            });
            el.categoryChips.appendChild(button);
        });
    }

    function getVisibleTools() {
        var toolMap = getToolMap();
        var orderedTools = state.order.map(function (id) {
            return toolMap.get(id);
        }).filter(Boolean);
        var keyword = state.search.trim().toLowerCase();
        return orderedTools.filter(function (tool) {
            if (state.removedIds.indexOf(tool.id) >= 0) return false;
            if (state.hiddenIds.indexOf(tool.id) >= 0) return false;
            if (state.category !== '全部' && tool.category !== state.category) return false;
            if (!keyword) return true;
            var haystack = [tool.title, tool.summary, tool.category].concat(tool.tags).join(' ').toLowerCase();
            return haystack.indexOf(keyword) >= 0;
        });
    }

    function buildStat(label, value) {
        var card = document.createElement('div');
        card.className = 'stat';
        var strong = document.createElement('strong');
        strong.textContent = String(value);
        var span = document.createElement('span');
        span.textContent = label;
        card.appendChild(strong);
        card.appendChild(span);
        return card;
    }

    function renderStats(visibleCount) {
        el.stats.innerHTML = '';
        el.stats.appendChild(buildStat('可见工具', visibleCount));
        el.stats.appendChild(buildStat('已隐藏', state.hiddenIds.length));
        el.stats.appendChild(buildStat('已删除', state.removedIds.length));
        el.stats.appendChild(buildStat('自定义入口', state.customTools.length));
    }

    function setFormStatus(text, type) {
        el.formStatus.textContent = text;
        el.formStatus.className = 'status' + (type ? ' ' + type : '');
    }

    function moveTool(dragId, dropId) {
        if (!dragId || !dropId || dragId === dropId) return;
        var nextOrder = state.order.slice();
        var dragIndex = nextOrder.indexOf(dragId);
        var dropIndex = nextOrder.indexOf(dropId);
        if (dragIndex === -1 || dropIndex === -1) return;
        nextOrder.splice(dragIndex, 1);
        nextOrder.splice(dropIndex, 0, dragId);
        state.order = nextOrder;
        saveState();
        render();
    }

    function hideTool(id) {
        if (state.hiddenIds.indexOf(id) === -1) state.hiddenIds.push(id);
        saveState();
        render();
    }

    function removeTool(id) {
        if (state.removedIds.indexOf(id) === -1) state.removedIds.push(id);
        state.hiddenIds = state.hiddenIds.filter(function (item) { return item !== id; });
        if (id.indexOf(CUSTOM_PREFIX) === 0) {
            state.customTools = state.customTools.filter(function (tool) { return tool.id !== id; });
            state.order = state.order.filter(function (item) { return item !== id; });
            state.removedIds = state.removedIds.filter(function (item) { return item !== id; });
        }
        saveState();
        render();
    }

    function restoreRemoved() {
        state.hiddenIds = [];
        state.removedIds = [];
        saveState();
        render();
    }

    function openTool(path) {
        window.open(path, '_blank', 'noopener');
    }

    function createButton(text, className, handler) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn ' + className;
        button.textContent = text;
        button.addEventListener('click', handler);
        return button;
    }

    function renderTools() {
        var tools = getVisibleTools();
        renderStats(tools.length);
        el.toolGrid.innerHTML = '';
        el.emptyState.hidden = tools.length !== 0;

        tools.forEach(function (tool) {
            var card = document.createElement('article');
            card.className = 'card';
            card.draggable = true;
            card.dataset.id = tool.id;

            card.addEventListener('dragstart', function () {
                state.dragId = tool.id;
                card.classList.add('dragging');
            });

            card.addEventListener('dragend', function () {
                state.dragId = '';
                card.classList.remove('dragging');
            });

            card.addEventListener('dragover', function (event) {
                event.preventDefault();
            });

            card.addEventListener('drop', function (event) {
                event.preventDefault();
                moveTool(state.dragId, tool.id);
            });

            var header = document.createElement('div');
            header.className = 'card-header';
            var titleWrap = document.createElement('div');
            var title = document.createElement('h3');
            title.textContent = tool.title;
            var metaRow = document.createElement('div');
            metaRow.className = 'meta-row';
            var category = document.createElement('span');
            category.className = 'meta';
            category.textContent = tool.category;
            var status = document.createElement('span');
            status.className = 'meta';
            status.textContent = tool.status;
            metaRow.appendChild(category);
            metaRow.appendChild(status);
            if (tool.featured) {
                var featured = document.createElement('span');
                featured.className = 'meta';
                featured.textContent = '标杆';
                metaRow.appendChild(featured);
            }
            titleWrap.appendChild(title);
            titleWrap.appendChild(metaRow);

            var dragHandle = document.createElement('button');
            dragHandle.type = 'button';
            dragHandle.className = 'drag-handle';
            dragHandle.textContent = '::';
            dragHandle.title = '拖拽排序';

            header.appendChild(titleWrap);
            header.appendChild(dragHandle);
            card.appendChild(header);

            var summary = document.createElement('p');
            summary.textContent = tool.summary || '未提供说明。';
            card.appendChild(summary);

            var tagRow = document.createElement('div');
            tagRow.className = 'tag-row';
            tool.tags.forEach(function (tagValue) {
                var tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = tagValue;
                tagRow.appendChild(tag);
            });
            card.appendChild(tagRow);

            var pathLabel = document.createElement('p');
            pathLabel.className = 'muted';
            pathLabel.textContent = tool.path;
            card.appendChild(pathLabel);

            var actions = document.createElement('div');
            actions.className = 'card-actions';
            actions.appendChild(createButton('打开', 'btn-primary', function () {
                openTool(tool.path);
            }));
            actions.appendChild(createButton('隐藏', 'btn-secondary', function () {
                hideTool(tool.id);
            }));
            actions.appendChild(createButton('删除', 'btn-secondary', function () {
                removeTool(tool.id);
            }));
            card.appendChild(actions);

            el.toolGrid.appendChild(card);
        });
    }

    function addCustomTool() {
        var title = el.customTitleInput.value.trim();
        var path = el.customPathInput.value.trim();
        var category = el.customCategoryInput.value.trim() || '未分类';
        if (!title || !path) {
            setFormStatus('工具名和链接路径都不能为空。', 'error');
            return;
        }
        var id = CUSTOM_PREFIX + Date.now();
        state.customTools.push(normalizeTool({
            id: id,
            title: title,
            path: path,
            category: category,
            tags: ['自定义'],
            summary: '临时挂载入口，可后续并入默认注册表。',
            status: '临时入口'
        }));
        state.order.unshift(id);
        saveState();
        el.customTitleInput.value = '';
        el.customPathInput.value = '';
        el.customCategoryInput.value = '';
        setFormStatus('临时入口已添加。', 'ok');
        render();
    }

    function openFirstVisibleTool() {
        var tools = getVisibleTools();
        if (!tools.length) {
            setFormStatus('当前没有可打开的工具。', 'error');
            return;
        }
        openTool(tools[0].path);
    }

    function bindEvents() {
        el.searchInput.addEventListener('input', function () {
            state.search = el.searchInput.value;
            renderTools();
        });
        el.clearSearchBtn.addEventListener('click', function () {
            state.search = '';
            el.searchInput.value = '';
            renderTools();
        });
        el.resetLayoutBtn.addEventListener('click', function () {
            resetState(true);
            el.searchInput.value = '';
            setFormStatus('布局已重置为默认状态。', 'ok');
            render();
        });
        el.restoreBtn.addEventListener('click', function () {
            restoreRemoved();
            setFormStatus('已恢复隐藏和删除状态。', 'ok');
        });
        el.addCustomBtn.addEventListener('click', addCustomTool);
        el.openFirstBtn.addEventListener('click', openFirstVisibleTool);
    }

    function render() {
        reconcileState();
        renderCategories();
        renderTools();
    }

    function init() {
        initDom();
        loadState();
        el.searchInput.value = state.search;
        bindEvents();
        render();
    }

    init();
})();
