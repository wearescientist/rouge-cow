# runtime 素材目录

当前目录只放游戏运行时已经接入并直接引用的素材。

## 目录约定

- `audio/weapons/`
  当前武器系统直接使用的音效。
- `audio/weapons/whistling/`
  飞刀呼啸等变体音效。
- `sprites/weapons/generated/`
  当前武器运行时使用的生成版武器贴图。
- `sprites/weapons/core/`
  未进入 generated 流程、但运行时仍在使用的武器贴图。
- `sprites/rooms/backdrops/`
  房间背景底图，如 `back_organic_*`。
- `sprites/rooms/shells/`
  各楼层房间壳层素材。

## 当前代码入口

- 武器音效: `src/systems/AudioController.js`
- 武器贴图映射: `src/data/weapon_visual_data.js`
- 武器兜底加载: `index.html`
- 房间壳背景: `src/systems/Room.js`

## 规则

- 新接入运行时的图片和音效，优先放到这里。
- 旧素材库先保留，不在本阶段删除。
- 后续清理旧素材时，以这里作为“已使用素材基线”。
