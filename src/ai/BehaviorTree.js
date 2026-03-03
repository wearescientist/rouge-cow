/**
 * BehaviorTree - 行为树系统
 * 游戏AI核心架构
 * v0.23
 */

// 节点状态
const NodeStatus = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    RUNNING: 'running'
};

// 节点基类
class BTNode {
    constructor(name = 'Node') {
        this.name = name;
        this.status = NodeStatus.FAILURE;
    }

    tick(context) {
        throw new Error('Must implement tick()');
    }

    reset() {
        this.status = NodeStatus.FAILURE;
    }

    onEnter(context) {}
    onExit(context) {}
}

// 复合节点基类
class CompositeNode extends BTNode {
    constructor(name, children = []) {
        super(name);
        this.children = children;
        this.currentIndex = 0;
    }

    addChild(child) {
        this.children.push(child);
        return this;
    }

    reset() {
        super.reset();
        this.currentIndex = 0;
        this.children.forEach(child => child.reset());
    }
}

// 选择器：顺序执行子节点，直到有一个成功
class Selector extends CompositeNode {
    constructor(children) {
        super('Selector', children);
    }

    tick(context) {
        while (this.currentIndex < this.children.length) {
            const child = this.children[this.currentIndex];
            const status = child.tick(context);

            if (status === NodeStatus.SUCCESS) {
                this.reset();
                return NodeStatus.SUCCESS;
            }

            if (status === NodeStatus.RUNNING) {
                this.status = NodeStatus.RUNNING;
                return NodeStatus.RUNNING;
            }

            this.currentIndex++;
        }

        this.reset();
        return NodeStatus.FAILURE;
    }
}

// 序列：顺序执行子节点，直到有一个失败
class Sequence extends CompositeNode {
    constructor(children) {
        super('Sequence', children);
    }

    tick(context) {
        while (this.currentIndex < this.children.length) {
            const child = this.children[this.currentIndex];
            const status = child.tick(context);

            if (status === NodeStatus.FAILURE) {
                this.reset();
                return NodeStatus.FAILURE;
            }

            if (status === NodeStatus.RUNNING) {
                this.status = NodeStatus.RUNNING;
                return NodeStatus.RUNNING;
            }

            this.currentIndex++;
        }

        this.reset();
        return NodeStatus.SUCCESS;
    }
}

// 并行节点：同时执行所有子节点
class Parallel extends CompositeNode {
    constructor(children, successThreshold = 1) {
        super('Parallel', children);
        this.successThreshold = successThreshold;
    }

    tick(context) {
        let successCount = 0;
        let failureCount = 0;
        let runningCount = 0;

        for (const child of this.children) {
            const status = child.tick(context);

            if (status === NodeStatus.SUCCESS) successCount++;
            else if (status === NodeStatus.FAILURE) failureCount++;
            else runningCount++;
        }

        if (successCount >= this.successThreshold) {
            this.reset();
            return NodeStatus.SUCCESS;
        }

        if (failureCount > this.children.length - this.successThreshold) {
            this.reset();
            return NodeStatus.FAILURE;
        }

        return NodeStatus.RUNNING;
    }
}

// 装饰器节点基类
class Decorator extends BTNode {
    constructor(name, child) {
        super(name);
        this.child = child;
    }

    reset() {
        super.reset();
        this.child.reset();
    }
}

// 反转器：反转子节点结果
class Inverter extends Decorator {
    constructor(child) {
        super('Inverter', child);
    }

    tick(context) {
        const status = this.child.tick(context);

        if (status === NodeStatus.SUCCESS) return NodeStatus.FAILURE;
        if (status === NodeStatus.FAILURE) return NodeStatus.SUCCESS;
        return status;
    }
}

// 重复器：重复执行子节点N次
class Repeater extends Decorator {
    constructor(child, count = -1) {
        super('Repeater', child);
        this.count = count; // -1 表示无限
        this.currentCount = 0;
    }

    tick(context) {
        if (this.count > 0 && this.currentCount >= this.count) {
            this.reset();
            return NodeStatus.SUCCESS;
        }

        const status = this.child.tick(context);

        if (status !== NodeStatus.RUNNING) {
            this.currentCount++;
            this.child.reset();
        }

        if (this.count > 0 && this.currentCount >= this.count) {
            this.reset();
            return NodeStatus.SUCCESS;
        }

        return NodeStatus.RUNNING;
    }

    reset() {
        super.reset();
        this.currentCount = 0;
    }
}

// 条件节点
class Condition extends BTNode {
    constructor(checkFn) {
        super('Condition');
        this.checkFn = checkFn;
    }

    tick(context) {
        return this.checkFn(context) ? NodeStatus.SUCCESS : NodeStatus.FAILURE;
    }
}

// 动作节点
class Action extends BTNode {
    constructor(actionFn) {
        super('Action');
        this.actionFn = actionFn;
    }

    tick(context) {
        return this.actionFn(context);
    }
}

// 等待节点
class Wait extends BTNode {
    constructor(duration) {
        super('Wait');
        this.duration = duration;
        this.elapsed = 0;
    }

    tick(context) {
        this.elapsed += context.dt;

        if (this.elapsed >= this.duration) {
            this.reset();
            return NodeStatus.SUCCESS;
        }

        return NodeStatus.RUNNING;
    }

    reset() {
        super.reset();
        this.elapsed = 0;
    }
}

// 导出
window.BTNode = BTNode;
window.NodeStatus = NodeStatus;
window.Selector = Selector;
window.Sequence = Sequence;
window.Parallel = Parallel;
window.Inverter = Inverter;
window.Repeater = Repeater;
window.Condition = Condition;
window.Action = Action;
window.Wait = Wait;
