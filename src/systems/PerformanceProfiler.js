(function(global){
  'use strict';

  function nowMs(){
    return (global.performance && typeof global.performance.now === 'function') ? global.performance.now() : Date.now();
  }

  class PerformanceProfiler {
    constructor(game){
      this.game = game || global.game || null;
      this.enabled = true;
      this.frameIndex = 0;
      this.maxHistory = 240;
      this.sectionStats = new Map();
      this.frameHistory = [];
      this.currentFrame = null;
      this.installed = false;
      this.patched = new WeakMap();
      this.lastAutoBind = 0;
      this.autoBindInterval = 800;
      this.install();
    }

    install(){
      if (this.installed) return;
      this.installed = true;
      this.installPrototypeHooks();
      this.attachToGame(this.game || global.game || null);
    }

    installPrototypeHooks(){
      this.wrapPrototype(global.Room?.prototype, 'update', 'room.update');
      this.wrapPrototype(global.Room?.prototype, 'draw', 'room.draw');
      this.wrapPrototype(global.HordeManager?.prototype, 'update', 'horde.update');
      this.wrapPrototype(global.RoomBlurSystem?.prototype, 'render', 'roomBlur.render');
      this.wrapPrototype(global.HD2DRenderer?.prototype, 'update', 'hd2d.update');
      this.wrapPrototype(global.HD2DRenderer?.prototype, 'renderFinalPostProcess', 'hd2d.post');
      this.wrapPrototype(global.ParticleSystem?.prototype, 'update', 'particles.update');
      this.wrapPrototype(global.ParticleSystem?.prototype, 'draw', 'particles.draw');
      this.wrapPrototype(global.DamageNumberSystem?.prototype, 'update', 'damageNumbers.update');
      this.wrapPrototype(global.DamageNumberSystem?.prototype, 'draw', 'damageNumbers.draw');
      this.wrapPrototype(global.BloodStainSystem?.prototype, 'update', 'blood.update');
      this.wrapPrototype(global.BloodStainSystem?.prototype, 'draw', 'blood.draw');
      this.wrapPrototype(global.WeaponVisualSystem?.prototype, 'update', 'weaponFx.update');
      this.wrapPrototype(global.WeaponVisualSystem?.prototype, 'draw', 'weaponFx.draw');
      this.wrapPrototype(global.SidebarHudPresenter?.prototype, 'draw', 'hud.draw');
      this.wrapPrototype(global.PerformanceMonitor?.prototype, 'update', 'perfOverlay.update');
      this.wrapPrototype(global.PerformanceMonitor?.prototype, 'draw', 'perfOverlay.draw');
    }

    attachToGame(game){
      if (!game || this.game === game && this.patched.has(game)) return;
      this.game = game;
      this.wrapInstance(game, 'loop', 'frame.total', { frameBoundary: true });
      this.wrapInstance(game, 'update', 'game.update');
      this.wrapInstance(game, 'draw', 'game.draw');
      this.wrapInstance(game, 'updateScoreDisplay', 'hud.score');
      this.bindLiveObjects(game);
    }

    bindLiveObjects(game){
      if (!game) return;
      this.wrapInstance(game.perfMonitor, 'update', 'perfOverlay.update');
      this.wrapInstance(game.perfMonitor, 'draw', 'perfOverlay.draw');
      this.wrapInstance(game.particles, 'update', 'particles.update');
      this.wrapInstance(game.particles, 'draw', 'particles.draw');
      this.wrapInstance(game.damageNumbers, 'update', 'damageNumbers.update');
      this.wrapInstance(game.damageNumbers, 'draw', 'damageNumbers.draw');
      this.wrapInstance(game.bloodStains, 'update', 'blood.update');
      this.wrapInstance(game.bloodStains, 'draw', 'blood.draw');
      this.wrapInstance(game.weaponVisuals, 'update', 'weaponFx.update');
      this.wrapInstance(game.weaponVisuals, 'draw', 'weaponFx.draw');
      this.wrapInstance(game.hd2dRenderer, 'update', 'hd2d.update');
      this.wrapInstance(game.hd2dRenderer, 'renderFinalPostProcess', 'hd2d.post');
      this.wrapInstance(game.sidebarHudPresenter, 'draw', 'hud.draw');
      this.wrapInstance(game.curRoom, 'update', 'room.update');
      this.wrapInstance(game.curRoom, 'draw', 'room.draw');
      const roomBlur = game.hd2dRenderer?.roomBlur;
      this.wrapInstance(roomBlur, 'render', 'roomBlur.render');
    }

    wrapPrototype(proto, key, label){
      if (!proto || typeof proto[key] !== 'function') return;
      if (proto[key].__perfWrapped) return;
      const original = proto[key];
      const profiler = this;
      const wrapped = function(){
        if (!profiler.enabled || !profiler.currentFrame) return original.apply(this, arguments);
        return profiler.measure(label, () => original.apply(this, arguments));
      };
      wrapped.__perfWrapped = true;
      wrapped.__perfOriginal = original;
      proto[key] = wrapped;
    }

    wrapInstance(target, key, label, options = {}){
      if (!target || typeof target[key] !== 'function') return;
      const existing = target[key];
      if (existing.__perfWrapped || existing.__perfWrappedInstance) return;
      const profiler = this;
      const original = existing;
      const wrapped = function(){
        if (options.frameBoundary) {
          profiler.beginFrame();
          try {
            profiler.ensureBound();
            return profiler.measure(label, () => original.apply(this, arguments));
          } finally {
            profiler.endFrame();
          }
        }
        if (!profiler.enabled || !profiler.currentFrame) return original.apply(this, arguments);
        return profiler.measure(label, () => original.apply(this, arguments));
      };
      wrapped.__perfWrappedInstance = true;
      wrapped.__perfOriginal = original;
      target[key] = wrapped;
      this.patched.set(target, true);
    }

    ensureBound(){
      const stamp = nowMs();
      if (stamp - this.lastAutoBind < this.autoBindInterval) return;
      this.lastAutoBind = stamp;
      this.attachToGame(global.game || this.game || null);
      if (this.game) this.bindLiveObjects(this.game);
    }

    beginFrame(){
      if (!this.enabled) return;
      this.currentFrame = {
        start: nowMs(),
        sections: Object.create(null)
      };
    }

    endFrame(){
      if (!this.enabled || !this.currentFrame) return;
      const end = nowMs();
      const total = end - this.currentFrame.start;
      this.recordSection('frame.total', total);
      const frameSections = this.currentFrame.sections;
      this.frameHistory.push({ total, sections: frameSections, stamp: end });
      if (this.frameHistory.length > this.maxHistory) this.frameHistory.shift();
      this.frameIndex += 1;
      this.currentFrame = null;
    }

    measure(label, fn){
      if (!this.enabled) return fn();
      const start = nowMs();
      try {
        return fn();
      } finally {
        this.recordSection(label, nowMs() - start);
      }
    }

    recordSection(label, duration){
      if (!Number.isFinite(duration)) return;
      if (this.currentFrame) {
        this.currentFrame.sections[label] = (this.currentFrame.sections[label] || 0) + duration;
      }
      let stats = this.sectionStats.get(label);
      if (!stats) {
        stats = { label, count: 0, total: 0, max: 0, last: 0, history: [] };
        this.sectionStats.set(label, stats);
      }
      stats.count += 1;
      stats.total += duration;
      stats.last = duration;
      stats.max = Math.max(stats.max, duration);
      stats.history.push(duration);
      if (stats.history.length > this.maxHistory) stats.history.shift();
    }

    reset(){
      this.sectionStats.clear();
      this.frameHistory.length = 0;
      this.frameIndex = 0;
      this.currentFrame = null;
    }

    toggleEnabled(force){
      this.enabled = typeof force === 'boolean' ? force : !this.enabled;
      return this.enabled;
    }

    percentile(list, p){
      if (!list || !list.length) return 0;
      const sorted = list.slice().sort((a,b)=>a-b);
      const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
      return sorted[idx];
    }

    buildSectionRows(avgFrame){
      return Array.from(this.sectionStats.values()).map((stats) => {
        const avg = stats.history.length ? stats.history.reduce((a,b)=>a+b,0) / stats.history.length : 0;
        const p95 = this.percentile(stats.history, 0.95);
        return {
          label: stats.label,
          avg,
          p95,
          max: stats.max,
          last: stats.last,
          count: stats.count,
          share: avgFrame > 0 ? (avg / avgFrame) * 100 : 0
        };
      }).sort((a,b)=>b.avg-a.avg);
    }

    getSnapshot(limit = 16){
      this.ensureBound();
      const frameTotals = this.frameHistory.map(f => f.total);
      const avgFrame = frameTotals.length ? frameTotals.reduce((a,b)=>a+b,0) / frameTotals.length : 0;
      const worstFrame = frameTotals.length ? Math.max(...frameTotals) : 0;
      const fps = avgFrame > 0 ? 1000 / avgFrame : 0;
      const sections = this.buildSectionRows(avgFrame);
      return {
        enabled: this.enabled,
        frames: this.frameHistory.length,
        avgFrame,
        p95Frame: this.percentile(frameTotals, 0.95),
        worstFrame,
        fps,
        sections: Number.isFinite(limit) ? sections.slice(0, limit) : sections
      };
    }

    getDetailedSnapshot(){
      return this.getSnapshot(Number.POSITIVE_INFINITY);
    }

    exportJson(options = {}){
      const snapshot = options.detailed ? this.getDetailedSnapshot() : this.getSnapshot();
      const payload = Object.assign({
        exportedAt: new Date().toISOString(),
        snapshot,
        frameHistory: this.frameHistory.slice(-120)
      }, options.extra || {});
      const text = JSON.stringify(payload, null, 2);
      try {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = options.fileName || `perf_profile_${Date.now()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } catch (err) {
        console.warn('[PerformanceProfiler] export failed, fallback to clipboard', err);
        navigator.clipboard?.writeText?.(text).catch(()=>{});
      }
      return payload;
    }
  }

  global.PerformanceProfiler = PerformanceProfiler;
  global.getPerformanceProfiler = async function(){
    if (!global.DEV_MODE_ENABLED) return null;
    if (!global.performanceProfiler) {
      global.performanceProfiler = new PerformanceProfiler(global.game || null);
    } else {
      global.performanceProfiler.ensureBound();
    }
    return global.performanceProfiler;
  };

  if (global.DEV_MODE_ENABLED) {
    setTimeout(() => {
      if (!global.performanceProfiler) {
        global.performanceProfiler = new PerformanceProfiler(global.game || null);
      } else {
        global.performanceProfiler.ensureBound();
      }
    }, 0);
  }
})(window);
