/**
 * Systems Index
 * 导出所有系统
 */

// 确保加载顺序正确
const SYSTEMS = [
    'MovementSystem',
    'CollisionSystem', 
    'CombatSystem',
    'RenderSystem'
];

// 系统优先级定义
const SYSTEM_PRIORITIES = {
    InputSystem: 5,
    MovementSystem: 10,
    CollisionSystem: 20,
    CombatSystem: 30,
    AISystem: 40,
    AnimationSystem: 50,
    ParticleSystem: 60,
    CameraSystem: 70,
    RenderSystem: 100
};

window.SYSTEMS = SYSTEMS;
window.SYSTEM_PRIORITIES = SYSTEM_PRIORITIES;
