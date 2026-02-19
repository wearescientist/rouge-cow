@echo off
chcp 65001 >nul
title 牛牛肉鸽 - Bug检测报告

echo 🐛 牛牛肉鸽 AI Bug检测报告
echo ===========================
echo.

if not exist "..\..\bug_reports" (
    echo 暂无Bug报告
    goto :end
)

cd ..\..\bug_reports

echo 📊 Bug统计摘要：
echo.

node -e "
const fs=require('fs'), path=require('path');
const files=fs.readdirSync('.').filter(f=>f.match(/^bug_report_\d+_\d+\.json$/)).sort((a,b)=>{
  const na=parseInt(a.match(/bug_report_(\d+)/)[1]);
  const nb=parseInt(b.match(/bug_report_(\d+)/)[1]);
  return nb-na;
});

if(files.length===0){ console.log('暂无Bug报告'); process.exit(0); }

let totalBugs=0, critical=0, high=0, medium=0, low=0;
const bugTypes={};

files.forEach(f=>{
  try{
    const r=JSON.parse(fs.readFileSync(f,'utf8'));
    totalBugs+=r.summary?.total||0;
    critical+=r.summary?.critical||0;
    high+=r.summary?.high||0;
    medium+=r.summary?.medium||0;
    low+=r.summary?.low||0;
    
    (r.bugs||[]).forEach(b=>{
      bugTypes[b.type]=(bugTypes[b.type]||0)+1;
    });
  }catch(e){}
});

console.log('检测场次:', files.length);
console.log('总Bug数:', totalBugs);
console.log('  🔴 Critical:', critical);
console.log('  🟠 High:', high);
console.log('  🟡 Medium:', medium);
console.log('  🟢 Low:', low);
console.log('');

const typeCount=Object.entries(bugTypes).sort((a,b)=>b[1]-a[1]).slice(0,5);
if(typeCount.length>0){
  console.log('常见问题类型:');
  typeCount.forEach(([type,count])=>{
    console.log('  -',type+':',count,'次');
  });
}
"

echo.
echo 📁 报告位置: %cd%
echo.
echo 最近的报告：
dir /b /o-d bug_report_*.json 2>nul | head -5

echo.
echo 按1打开Bug报告文件夹，按2查看最新报告详情，其他键退出...
choice /c 12q /n /m "选择:"

if errorlevel 3 goto :end
if errorlevel 2 (
    for /f "tokens=*" %%a in ('dir /b /o-d bug_report_*.json 2^>nul ^| head -1') do (
        echo.
        echo 查看 %%a:
        node -e "const data=require('./%%a'); console.log(JSON.stringify(data,null,2));" | more
    )
    goto :end
)
if errorlevel 1 start explorer "%cd%"

:end
cd ..\archive\ai_training
echo.
pause
