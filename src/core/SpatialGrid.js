(function attachSpatialGrid(global) {
    class SpatialGrid {
        constructor(cellSize = null) {
            this.cellSize = Number.isFinite(cellSize) && cellSize > 0
                ? cellSize
                : SURVIVOR_CONFIG.GRID_CELL_SIZE;
            this.cells = new Map();
        }

        setCellSize(nextSize) {
            const numeric = Number(nextSize);
            if (!Number.isFinite(numeric) || numeric <= 0) return;
            const clamped = Math.max(32, Math.min(256, Math.round(numeric)));
            if (clamped === this.cellSize) return;
            this.cellSize = clamped;
            this.clear();
        }

        getKey(cx, cy) {
            return `${cx},${cy}`;
        }

        getCellByPos(x, y) {
            return { cx: Math.floor(x / this.cellSize), cy: Math.floor(y / this.cellSize) };
        }

        clear() {
            this.cells.clear();
        }

        insert(entity) {
            const { cx, cy } = this.getCellByPos(entity.x, entity.y);
            const key = this.getKey(cx, cy);
            if (!this.cells.has(key)) this.cells.set(key, []);
            this.cells.get(key).push(entity);
            entity._gridCell = { cx, cy };
        }

        getNearby(x, y) {
            const { cx, cy } = this.getCellByPos(x, y);
            const result = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const cell = this.cells.get(this.getKey(cx + dx, cy + dy));
                    if (cell) result.push(...cell);
                }
            }
            return result;
        }
    }

    global.SpatialGrid = SpatialGrid;
})(window);
