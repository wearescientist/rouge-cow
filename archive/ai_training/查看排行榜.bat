@echo off
chcp 65001 >nul
title 牛牛肉鸽 - 分数排行榜

echo 🐮 牛牛肉鸽 AI 分数排行榜
echo ===========================
echo.

cd ..\..\data

echo 📊 最近训练记录：
echo.

node -e "
const fs=require('fs'), path=require('path');
const files=fs.readdirSync('.').filter(f=>f.match(/^train_\d+_\d+\.json$/)).sort((a,b)=>{
  const na=parseInt(a.match(/train_(\d+)/)[1]);
  const nb=parseInt(b.match(/train_(\d+)/)[1]);
  return nb-na;
}).slice(0,10);

console.log('排名  分数      结果    击杀  房间  时长(秒)');
console.log('─'.repeat(50));

files.forEach((f,i)=>{
  try{
    const d=JSON.parse(fs.readFileSync(f,'utf8'));
    const score=(d.score||0).toString().padStart(7);
    const result=(d.result||'unknown').padStart(6);
    const kills=(d.stats?.enemiesKilled||0).toString().padStart(4);
    const rooms=(d.stats?.roomsExplored||0).toString().padStart(4);
    const time=((d.playTime||0)/1000).toFixed(1).padStart(8);
    console.log(\`\${(i+1).toString().padStart(2)}   \${score}  \${result} \${kills}  \${rooms}  \${time}\`);
  }catch(e){}
});
"

echo.
echo 💡 提示：分数 = 基础分 × 通关加成(无伤×2, 快速×1.5)
echo.

cd ..\archive\ai_training
pause
