#!/usr/bin/env python3
"""
肉鸽牛牛 - Python 终端版
用于测试核心玩法
"""

import curses
import random
import math
from dataclasses import dataclass
from typing import List, Dict, Optional, Tuple

# 工具函数
def clamp(v, min_v, max_v):
    return max(min_v, min(max_v, v))

def dist(x1, y1, x2, y2):
    return math.sqrt((x2-x1)**2 + (y2-y1)**2)

def rand_choice(arr):
    return arr[random.randint(0, len(arr)-1)]

# 道具数据库
ITEMS = {
    1: { 'name': '多重射击', 'effect': 'projCount', 'value': 1, 'desc': '子弹+1' },
    2: { 'name': '巨大化', 'effect': 'projSize', 'value': 0.3, 'desc': '子弹变大' },
    3: { 'name': '快速射击', 'effect': 'fireRate', 'value': 0.15, 'desc': '射速+15%' },
    4: { 'name': '穿甲弹', 'effect': 'pierce', 'value': 1, 'desc': '穿透+1' },
    5: { 'name': '暴击镜片', 'effect': 'crit', 'value': 0.1, 'desc': '暴击+10%' },
    6: { 'name': '心之容器', 'effect': 'maxHp', 'value': 2, 'desc': '生命+2' },
    7: { 'name': '钢铁护甲', 'effect': 'armor', 'value': 1, 'desc': '护甲+1' },
    8: { 'name': '吸血獠牙', 'effect': 'lifeSteal', 'value': 0.05, 'desc': '吸血5%' },
    9: { 'name': '加速靴', 'effect': 'speed', 'value': 0.2, 'desc': '移速+20%' },
}

# 武器配置
WEAPONS = {
    'whip': { 'name': '鞭子', 'dmg': 12, 'cd': 1.2, 'range': 80, 'type': 'melee', 'char': '~', 'color': 3 },
    'wand': { 'name': '魔杖', 'dmg': 8, 'cd': 0.8, 'speed': 250, 'type': 'proj', 'char': '*', 'color': 4 },
    'knife': { 'name': '飞刀', 'dmg': 6, 'cd': 0.5, 'speed': 350, 'pierce': 2, 'type': 'proj', 'char': '-', 'color': 7 },
    'axe': { 'name': '斧头', 'dmg': 15, 'cd': 1.5, 'speed': 200, 'type': 'proj', 'char': 'A', 'color': 3 },
}

# 敌人类型
ENEMY_TYPES = {
    'chick': { 'name': '变异小鸡', 'hp': 15, 'speed': 80, 'dmg': 1, 'exp': 2, 'char': 'c', 'color': 6 },
    'pig': { 'name': '变异小猪', 'hp': 30, 'speed': 50, 'dmg': 2, 'exp': 4, 'char': 'p', 'color': 5 },
    'sheep': { 'name': '变异小羊', 'hp': 20, 'speed': 60, 'dmg': 1, 'exp': 3, 'char': 's', 'color': 7 },
    'dog': { 'name': '疯狗', 'hp': 25, 'speed': 100, 'dmg': 2, 'exp': 5, 'char': 'd', 'color': 3 },
    'cat': { 'name': '变异猫', 'hp': 18, 'speed': 90, 'dmg': 1, 'exp': 3, 'char': 'C', 'color': 4 },
    'bear': { 'name': '巨熊', 'hp': 50, 'speed': 40, 'dmg': 3, 'exp': 8, 'char': 'B', 'color': 2 },
}

@dataclass
class Entity:
    x: float
    y: float
    hp: float
    max_hp: float
    speed: float
    dmg: float
    char: str
    color: int
    name: str = ""
    exp: int = 0
    vx: float = 0
    vy: float = 0
    hit_timer: float = 0
    attack_cd: float = 0

class Bullet:
    def __init__(self, x, y, vx, vy, dmg, char, color, pierce=0):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.dmg = dmg
        self.char = char
        self.color = color
        self.pierce = pierce
        self.life = 3
        self.hits = set()

class Gem:
    def __init__(self, x, y, value):
        self.x = x
        self.y = y
        self.value = value
        self.life = 30

class Room:
    def __init__(self, gx, gy, room_type='normal'):
        self.gx = gx
        self.gy = gy
        self.id = f"{gx},{gy}"
        self.type = room_type
        self.doors = {'up': None, 'down': None, 'left': None, 'right': None}
        self.enemies: List[Entity] = []
        self.cleared = False
        self.visited = False
        
        if room_type != 'start':
            self.spawn_enemies()
    
    def spawn_enemies(self):
        count = 1 if self.type == 'boss' else random.randint(3, 7)
        types = list(ENEMY_TYPES.keys())
        
        for i in range(count):
            angle = (i / count) * 2 * math.pi
            r = 10 + random.random() * 8
            x = 45 + math.cos(angle) * r
            y = 20 + math.sin(angle) * r
            # 确保在房间内
            x = clamp(x, 10, 80)
            y = clamp(y, 5, 35)
            t = rand_choice(types)
            cfg = ENEMY_TYPES[t]
            self.enemies.append(Entity(
                x=x, y=y, hp=cfg['hp'], max_hp=cfg['hp'],
                speed=cfg['speed'], dmg=cfg['dmg'],
                char=cfg['char'], color=cfg['color'],
                name=cfg['name'], exp=cfg['exp']
            ))

class ItemManager:
    def __init__(self, player):
        self.player = player
        self.owned = {}
        self.cache = None
        self.dirty = True
    
    def add(self, item_id):
        if item_id not in ITEMS:
            return False
        self.owned[item_id] = self.owned.get(item_id, 0) + 1
        self.dirty = True
        
        item = ITEMS[item_id]
        if item['effect'] == 'maxHp':
            self.player['max_hp'] += item['value']
            self.player['hp'] += item['value']
        return True
    
    def get_stats(self):
        if not self.dirty and self.cache:
            return self.cache
        
        s = {
            'proj_count': 1, 'proj_size': 1, 'fire_rate': 1, 'pierce': 0,
            'crit': 0, 'max_hp': 0, 'armor': 0, 'life_steal': 0,
            'speed': 1, 'magnet': 100
        }
        
        for item_id, count in self.owned.items():
            if item_id not in ITEMS:
                continue
            item = ITEMS[item_id]
            v = item['value'] * count
            
            eff = item['effect']
            if eff == 'projCount': s['proj_count'] += v
            elif eff == 'projSize': s['proj_size'] += v
            elif eff == 'fireRate': s['fire_rate'] *= (1 + v)
            elif eff == 'pierce': s['pierce'] += v
            elif eff == 'crit': s['crit'] = min(1, s['crit'] + v)
            elif eff == 'maxHp': s['max_hp'] += v
            elif eff == 'armor': s['armor'] += v
            elif eff == 'lifeSteal': s['life_steal'] += v
            elif eff == 'speed': s['speed'] += v
            elif eff == 'magnet': s['magnet'] += v
        
        self.cache = s
        self.dirty = False
        return s

class Weapon:
    def __init__(self, key, level=1):
        self.cfg = WEAPONS[key]
        self.level = level
        self.cd = 0
    
    def get_damage(self, stats):
        return self.cfg['dmg'] * (1 + (self.level - 1) * 0.15) * stats['proj_size']
    
    def update(self, dt):
        self.cd -= dt
    
    def can_fire(self):
        return self.cd <= 0
    
    def fire(self, player, target, stats):
        self.cd = self.cfg['cd'] / stats['fire_rate']
        bullets = []
        count = int(stats['proj_count'])
        
        for i in range(count):
            if target:
                angle = math.atan2(target.y - player['y'], target.x - player['x'])
                if count > 1:
                    angle += (i - (count - 1) / 2) * 0.15
            else:
                angle = random.random() * 2 * math.pi
            
            speed = self.cfg.get('speed', 0)
            bullets.append(Bullet(
                player['x'], player['y'],
                math.cos(angle) * speed,
                math.sin(angle) * speed,
                self.get_damage(stats),
                self.cfg['char'],
                self.cfg['color'],
                self.cfg.get('pierce', 0) + stats['pierce']
            ))
        return bullets

class Game:
    def __init__(self, stdscr):
        self.scr = stdscr
        curses.curs_set(0)
        self.scr.nodelay(True)
        self.scr.timeout(50)
        
        # 初始化颜色
        curses.start_color()
        curses.use_default_colors()
        curses.init_pair(1, curses.COLOR_WHITE, -1)      # 默认
        curses.init_pair(2, curses.COLOR_RED, -1)        # 敌人/危险
        curses.init_pair(3, curses.COLOR_YELLOW, -1)     # 金币/物品
        curses.init_pair(4, curses.COLOR_BLUE, -1)       # 子弹/魔法
        curses.init_pair(5, curses.COLOR_MAGENTA, -1)    # 道具
        curses.init_pair(6, curses.COLOR_GREEN, -1)      # 生命/安全
        curses.init_pair(7, curses.COLOR_CYAN, -1)       # 玩家
        
        # 玩家
        self.player = {
            'x': 45, 'y': 20,
            'hp': 6, 'max_hp': 6,
            'exp': 0, 'lv': 1,
            'gold': 0
        }
        
        # 系统
        self.items = ItemManager(self.player)
        self.weapons = [Weapon('whip', 1)]
        self.bullets: List[Bullet] = []
        self.gems: List[Gem] = []
        
        # 地图
        self.all_rooms: Dict[str, Room] = {}
        self.cur_room: Optional[Room] = None
        self.generate_map()
        
        # 输入
        self.keys = {}
        self.message = ""
        self.msg_timer = 0
        
        # 游戏状态
        self.state = 'playing'
        self.transition = None
    
    def generate_map(self):
        start = Room(0, 0, 'start')
        self.all_rooms[start.id] = start
        self.cur_room = start
        self.cur_room.visited = True
        
        queue = [start]
        dirs = [
            (0, -1, 'up', 'down'),
            (1, 0, 'right', 'left'),
            (0, 1, 'down', 'up'),
            (-1, 0, 'left', 'right')
        ]
        
        count = 1
        while queue and count < 12:
            cur = queue.pop(0)
            random.shuffle(dirs)
            
            for dx, dy, name, opp in dirs:
                nx, ny = cur.gx + dx, cur.gy + dy
                nid = f"{nx},{ny}"
                
                if nid in self.all_rooms:
                    ex = self.all_rooms[nid]
                    if not cur.doors[name]:
                        cur.doors[name] = {'open': False, 'target': ex}
                        ex.doors[opp] = {'open': False, 'target': cur}
                    continue
                
                if random.random() > 0.4 or count < 5:
                    rtype = 'boss' if count == 11 else ('treasure' if random.random() < 0.2 else 'normal')
                    nr = Room(nx, ny, rtype)
                    cur.doors[name] = {'open': False, 'target': nr}
                    nr.doors[opp] = {'open': False, 'target': cur}
                    self.all_rooms[nid] = nr
                    queue.append(nr)
                    count += 1
    
    def log(self, msg):
        self.message = msg
        self.msg_timer = 3
    
    def update(self, dt):
        if self.state != 'playing':
            return
        
        stats = self.items.get_stats()
        speed = 150 * stats['speed']
        
        # 玩家移动
        dx, dy = 0, 0
        if self.keys.get('w') or self.keys.get('W'): dy -= 1
        if self.keys.get('s') or self.keys.get('S'): dy += 1
        if self.keys.get('a') or self.keys.get('A'): dx -= 1
        if self.keys.get('d') or self.keys.get('D'): dx += 1
        
        if dx != 0 or dy != 0:
            length = math.sqrt(dx*dx + dy*dy)
            self.player['x'] += (dx / length) * speed * dt
            self.player['y'] += (dy / length) * speed * dt
        
        # 边界
        self.player['x'] = clamp(self.player['x'], 5, 85)
        self.player['y'] = clamp(self.player['y'], 3, 37)
        
        # 门检测
        if self.cur_room.cleared:
            px, py = self.player['x'], self.player['y']
            for name, door in self.cur_room.doors.items():
                if not door or not door['open']:
                    continue
                # 简化的门检测
                if name == 'up' and py < 5:
                    self.change_room(door['target'], 'up')
                    break
                elif name == 'down' and py > 35:
                    self.change_room(door['target'], 'down')
                    break
                elif name == 'left' and px < 10:
                    self.change_room(door['target'], 'left')
                    break
                elif name == 'right' and px > 80:
                    self.change_room(door['target'], 'right')
                    break
        
        # 敌人
        for e in self.cur_room.enemies:
            # 寻路
            edx = self.player['x'] - e.x
            edy = self.player['y'] - e.y
            d = math.sqrt(edx*edx + edy*edy)
            
            if d > 0:
                e.vx = (edx / d) * e.speed
                e.vy = (edy / d) * e.speed
            
            # 简单分离
            for other in self.cur_room.enemies:
                if other is e:
                    continue
                odx = e.x - other.x
                ody = e.y - other.y
                od = math.sqrt(odx*odx + ody*ody)
                if od < 3 and od > 0:
                    e.vx += (odx / od) * 50
                    e.vy += (ody / od) * 50
            
            e.x += e.vx * dt
            e.y += e.vy * dt
            e.x = clamp(e.x, 5, 85)
            e.y = clamp(e.y, 3, 37)
            
            # 攻击玩家
            if d < 3 and e.attack_cd <= 0:
                self.player['hp'] -= max(0, e.dmg - stats['armor'])
                e.attack_cd = 0.5
                self.log(f"受到 {e.name} 攻击!")
                if self.player['hp'] <= 0:
                    self.state = 'gameover'
            
            if e.attack_cd > 0:
                e.attack_cd -= dt
            if e.hit_timer > 0:
                e.hit_timer -= dt
        
        # 清理房间
        if not self.cur_room.enemies and not self.cur_room.cleared:
            self.cur_room.cleared = True
            for door in self.cur_room.doors.values():
                if door:
                    door['open'] = True
            self.log("房间清理完成! 门已开启")
        
        # 武器
        target = None
        min_d = 9999
        for e in self.cur_room.enemies:
            d = dist(e.x, e.y, self.player['x'], self.player['y'])
            if d < min_d:
                min_d = d
                target = e
        
        for w in self.weapons:
            w.update(dt)
            if w.can_fire() and target:
                self.bullets.extend(w.fire(self.player, target, stats))
        
        # 子弹
        for i in range(len(self.bullets) - 1, -1, -1):
            b = self.bullets[i]
            b.x += b.vx * dt
            b.y += b.vy * dt
            b.life -= dt
            
            if b.life <= 0:
                self.bullets.pop(i)
                continue
            
            hit = False
            for j in range(len(self.cur_room.enemies) - 1, -1, -1):
                e = self.cur_room.enemies[j]
                if dist(b.x, b.y, e.x, e.y) < 2 and id(e) not in b.hits:
                    b.hits.add(id(e))
                    e.hp -= b.dmg
                    e.hit_timer = 0.1
                    
                    if e.hp <= 0:
                        self.cur_room.enemies.pop(j)
                        self.gems.append(Gem(e.x, e.y, e.exp))
                        self.log(f"击杀 {e.name}!")
                    
                    b.pierce -= 1
                    if b.pierce < 0:
                        hit = True
                        break
            
            if hit:
                self.bullets.pop(i)
        
        # 经验宝石
        for i in range(len(self.gems) - 1, -1, -1):
            g = self.gems[i]
            d = dist(g.x, g.y, self.player['x'], self.player['y'])
            
            if d < stats['magnet'] / 10:
                g.x += (self.player['x'] - g.x) * 5 * dt
                g.y += (self.player['y'] - g.y) * 5 * dt
            
            if d < 2:
                self.player['exp'] += g.value
                self.gems.pop(i)
                
                # 升级
                if self.player['exp'] >= self.player['lv'] * 10:
                    self.player['exp'] -= self.player['lv'] * 10
                    self.player['lv'] += 1
                    self.player['max_hp'] += 1
                    self.player['hp'] += 1
                    self.log(f"升级! 到达 {self.player['lv']} 级!")
        
        # 消息计时器
        if self.msg_timer > 0:
            self.msg_timer -= dt
    
    def change_room(self, new_room, direction):
        self.cur_room = new_room
        self.cur_room.visited = True
        
        # 重置玩家位置
        if direction == 'up':
            self.player['y'] = 35
        elif direction == 'down':
            self.player['y'] = 5
        elif direction == 'left':
            self.player['x'] = 80
        elif direction == 'right':
            self.player['x'] = 10
        
        self.bullets.clear()
        self.gems.clear()
        self.log(f"进入 {new_room.type} 房间")
    
    def draw(self):
        self.scr.clear()
        h, w = self.scr.getmaxyx()
        
        # 房间背景
        room_colors = {'start': 1, 'normal': 1, 'boss': 2, 'treasure': 5}
        bg_color = room_colors.get(self.cur_room.type, 1)
        
        # 绘制地板
        for y in range(2, 38):
            for x in range(4, 86):
                try:
                    self.scr.addch(y, x, '.', curses.color_pair(bg_color) | curses.A_DIM)
                except:
                    pass
        
        # 墙壁
        for x in range(4, 86):
            try:
                self.scr.addch(2, x, '#', curses.color_pair(3))
                self.scr.addch(37, x, '#', curses.color_pair(3))
            except:
                pass
        for y in range(2, 38):
            try:
                self.scr.addch(y, 4, '#', curses.color_pair(3))
                self.scr.addch(y, 85, '#', curses.color_pair(3))
            except:
                pass
        
        # 门
        for name, door in self.cur_room.doors.items():
            if not door:
                continue
            char = '+' if door['open'] else 'X'
            color = 6 if door['open'] else 2
            pos = {'up': (45, 2), 'down': (45, 37), 'left': (4, 20), 'right': (85, 20)}[name]
            try:
                self.scr.addch(pos[1], pos[0], char, curses.color_pair(color))
            except:
                pass
        
        # 经验宝石
        for g in self.gems:
            try:
                self.scr.addch(int(g.y), int(g.x), '*', curses.color_pair(4))
            except:
                pass
        
        # 子弹
        for b in self.bullets:
            try:
                self.scr.addch(int(b.y), int(b.x), b.char, curses.color_pair(b.color))
            except:
                pass
        
        # 敌人
        for e in self.cur_room.enemies:
            color = curses.A_REVERSE if e.hit_timer > 0 else curses.color_pair(e.color)
            try:
                self.scr.addch(int(e.y), int(e.x), e.char, color)
            except:
                pass
            
            # 血条
            if e.hp < e.max_hp:
                bar_len = int(3 * (e.hp / e.max_hp))
                try:
                    for i in range(bar_len):
                        self.scr.addch(int(e.y) - 1, int(e.x) - 1 + i, '=', curses.color_pair(2))
                except:
                    pass
        
        # 玩家
        try:
            self.scr.addch(int(self.player['y']), int(self.player['x']), '@', curses.color_pair(7) | curses.A_BOLD)
        except:
            pass
        
        # UI - 状态
        status = f"❤️{int(self.player['hp'])}/{self.player['max_hp']}  Lv.{self.player['lv']}  EXP:{int(self.player['exp'])}/{self.player['lv']*10}  💰{self.player['gold']}"
        try:
            self.scr.addstr(0, 2, status, curses.color_pair(6))
        except:
            pass
        
        # UI - 房间信息
        room_names = {'start': '起点', 'normal': '战斗', 'boss': 'BOSS', 'treasure': '宝箱'}
        room_info = f"{room_names.get(self.cur_room.type, '未知')}房间  敌人:{len(self.cur_room.enemies)}"
        if not self.cur_room.cleared:
            room_info += " [锁定]"
        try:
            self.scr.addstr(0, 60, room_info, curses.color_pair(3))
        except:
            pass
        
        # UI - 消息
        if self.msg_timer > 0 and self.message:
            try:
                self.scr.addstr(39, 2, self.message, curses.color_pair(6))
            except:
                pass
        
        # UI - 控制提示
        hint = "WASD移动 | 1-9道具 | Q退出"
        try:
            self.scr.addstr(40, 2, hint, curses.color_pair(1))
        except:
            pass
        
        # 游戏结束
        if self.state == 'gameover':
            msg = "游戏结束! 按Q退出"
            try:
                self.scr.addstr(20, 35, msg, curses.color_pair(2) | curses.A_BOLD)
            except:
                pass
        
        self.scr.refresh()
    
    def run(self):
        last_time = 0
        
        while True:
            # 输入
            key = self.scr.getch()
            if key == ord('q') or key == ord('Q'):
                break
            
            # 道具快捷键
            if ord('1') <= key <= ord('9'):
                item_id = key - ord('0')
                if self.items.add(item_id):
                    self.log(f"获得道具: {ITEMS[item_id]['name']}")
            
            # 记录按键状态
            if key == ord('w') or key == ord('W'):
                self.keys['w'] = True
            elif key == ord('a') or key == ord('A'):
                self.keys['a'] = True
            elif key == ord('s') or key == ord('S'):
                self.keys['s'] = True
            elif key == ord('d') or key == ord('D'):
                self.keys['d'] = True
            elif key == -1:
                # 没有按键，清空
                self.keys.clear()
            
            # 更新
            self.update(0.05)
            
            # 绘制
            self.draw()

def main(stdscr):
    game = Game(stdscr)
    game.run()

if __name__ == '__main__':
    curses.wrapper(main)
