# Current Runtime Baseline

本工程当前唯一继续更新基线：

- `rougelike-cow (7).zip`
- 再叠加本次最终累计覆盖补丁

## 规则

1. 后续所有修改都以“最新版包 + 已应用覆盖补丁”为唯一基线。
2. 不再回退旧包、旧 patch、旧对话里的历史版本。
3. 优先沿现役 runtime 主链继续改，不碰未接主链的 legacy 脚本。

## 本次累计补丁包含

- AutoPlay 走位 / UI 选择 / 隐藏房策略优化
- Room blur / 粒子 / 血迹预算化优化
- AudioContext 统一桥接
- HiddenRoom profile 数据外置
- runtime 脚本加载收口与审计文档
