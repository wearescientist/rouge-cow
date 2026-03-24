# AutoPlay Hotfix

- 修复 AI 自动游玩不移动的核心问题：`AutoPlayHarness` 之前尝试通过 `window.Game.prototype` 包装 `getMobileMoveVector()`，但当前工程里的 `Game` 是顶层 class 绑定，不是 `window.Game` 属性，导致 hook 实际没有装上。
- 现在改为优先从 `global.game` 实例和 `this.game` 实例解析原型，并在 `attach()` / `setEnabled()` 时重复尝试安装 hook。
- 一旦 hook 安装成功，AI 移动向量会真正并入 `getMobileMoveVector()`，自动走位、捡东西、开箱、升级选择这些链路才会生效。
