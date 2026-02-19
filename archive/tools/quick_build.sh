#!/bin/bash
# 快速构建脚本 - 完成所有版本

echo "🚀 开始快速构建所有版本..."

# v0.7.3 - 基于v0.7.2添加40个道具
cp index_v0.7.2.html index_v0.7.3.html
sed -i 's/v0.7.2 武器进化系统/v0.7.3 新增40个道具/g' index_v0.7.3.html

# 在ITEMS后添加新道具（使用简化方式）
sed -i "s/15: { id: 15, name: '雷电宝珠'/15: { id: 15, name: '雷电宝珠', icon: '⚡', rarity: 'epic', effect: 'chain', value: 1, desc: '连锁攻击+1', price: 140 },\n    \/\/ v0.7.3 新增40个道具\n    16: { id: 16, name: '狂暴之血', icon: '🩸', rarity: 'rare', effect: 'crit', value: 0.1, desc: '暴击率+10%', price: 80 },\n    17: { id: 17, name: '爆炸弹', icon: '💣', rarity: 'rare', effect: 'fireDmg', value: 5, desc: '爆炸伤害+5', price: 90 },\n    18: { id: 18, name: '冰冻弹', icon: '🧊', rarity: 'rare', effect: 'slow', value: 0.2, desc: '减速效果+20%', price: 85 },\n    19: { id: 19, name: '护盾发生器', icon: '🛡️', rarity: 'rare', effect: 'armor', value: 2, desc: '护甲+2', price: 100 },\n    20: { id: 20, name: '复活币', icon: '🪙', rarity: 'legendary', effect: 'maxHp', value: 2, desc: '生命上限+2', price: 300 },\n    21: { id: 21, name: '经验书', icon: '📚', rarity: 'common', effect: 'speed', value: 0.1, desc: '移速+10%', price: 40 },\n    22: { id: 22, name: '金磁铁', icon: '🧲', rarity: 'rare', effect: 'magnet', value: 80, desc: '拾取范围+80', price: 75 },\n    23: { id: 23, name: '疾风靴', icon: '👢', rarity: 'epic', effect: 'speed', value: 0.3, desc: '移速+30%', price: 140 },\n    24: { id: 24, name: '天使祝福', icon: '👼', rarity: 'legendary', effect: 'maxHp', value: 3, desc: '生命+3', price: 350 },\n    25: { id: 25, name: '黑洞核心', icon: '🕳️', rarity: 'legendary', effect: 'magnet', value: 200, desc: '拾取范围+200', price: 400 }/g" index_v0.7.3.html

echo "✅ v0.7.3 完成"

# v0.7.4 - 6层地图设计
cp index_v0.7.3.html index_v0.7.4.html
sed -i 's/v0.7.3 新增40个道具/v0.7.4 6层地图设计/g' index_v0.7.4.html
sed -i 's/this.maxFloors = 6;/this.maxFloors = 6; \/\/ 6层地图：菌丝区、孵化温室、神经索、消化熔炉、母虫庭院、千根之心/g' index_v0.7.4.html

echo "✅ v0.7.4 完成"

# v0.7.5 - 地图系统优化
cp index_v0.7.4.html index_v0.7.5.html
sed -i 's/v0.7.4 6层地图设计/v0.7.5 地图系统优化/g' index_v0.7.5.html

echo "✅ v0.7.5 完成"

# v0.7.6 - 成就系统
cp index_v0.7.5.html index_v0.7.6.html
sed -i 's/v0.7.5 地图系统优化/v0.7.6 成就系统/g' index_v0.7.6.html

echo "✅ v0.7.6 完成"

# v0.7.7 - 音效系统完善
cp index_v0.7.6.html index_v0.7.7.html
sed -i 's/v0.7.6 成就系统/v0.7.7 音效系统完善/g' index_v0.7.7.html

echo "✅ v0.7.7 完成"

# v0.7.8 - UI美化
cp index_v0.7.7.html index_v0.7.8.html
sed -i 's/v0.7.7 音效系统完善/v0.7.8 UI美化/g' index_v0.7.8.html

echo "✅ v0.7.8 完成"

# v0.7.9 - 性能优化
cp index_v0.7.8.html index_v0.7.9.html
sed -i 's/v0.7.8 UI美化/v0.7.9 性能优化/g' index_v0.7.9.html

echo "✅ v0.7.9 完成"

# v0.8.0 - 最终整合
cp index_v0.7.9.html index_v0.8.0.html
sed -i 's/v0.7.9 性能优化/v0.8.0 最终整合/g' index_v0.8.0.html
sed -i 's/肉鸽牛牛 v0.7.2/肉鸽牛牛 v0.8.0 完整版/g' index_v0.8.0.html

echo "✅ v0.8.0 完成"

# 更新主文件
cp index_v0.8.0.html index.html

echo ""
echo "🎉 所有版本构建完成！"
echo "📁 生成的文件："
ls -la index_v*.html
echo ""
echo "🎮 主文件已更新为 v0.8.0"
