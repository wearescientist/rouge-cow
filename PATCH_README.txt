只包含本次【武器更新 + 被动收口】改动的文件。

改动文件：
- index.html
- src/systems/DebugPanel.js
- src/systems/passives/WeaponAndPassiveManager.js
- src/systems/weaponUpgrade.js
- src/systems/weapons/Weapon.js

建议合并方式：
1. 先对你自己的现有工程备份这 5 个文件。
2. 对照 patch 或直接用 changed_files 目录里的同路径文件做逐个合并。
3. 这不是整包，不会覆盖你工程里其他正在改的内容。
