(function attachObjectPool(global) {
    class ObjectPool {
        constructor(createFn, resetFn, initialSize = 50) {
            this.createFn = createFn;
            this.resetFn = resetFn;
            this.available = [];
            this.inUse = new Set();

            for (let i = 0; i < initialSize; i++) {
                this.available.push(this.createFn());
            }
        }

        acquire() {
            let obj = this.available.pop();
            if (!obj) {
                obj = this.createFn();
            }
            this.resetFn(obj);
            this.inUse.add(obj);
            return obj;
        }

        release(obj) {
            if (this.inUse.has(obj)) {
                this.inUse.delete(obj);
                this.available.push(obj);
            }
        }

        releaseAll() {
            this.inUse.forEach((obj) => this.available.push(obj));
            this.inUse.clear();
        }

        getStats() {
            return {
                available: this.available.length,
                inUse: this.inUse.size,
                total: this.available.length + this.inUse.size
            };
        }
    }

    global.ObjectPool = ObjectPool;
})(window);
