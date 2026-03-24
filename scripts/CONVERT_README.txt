═══════════════════════════════════════════════════════════
🎵 WAV 转 OGG 转换指南
═══════════════════════════════════════════════════════════

需要转换的文件：
1. assets/audio/weapons/whip_crack_Sharp_lea_#1-1772612244854.wav → whip.ogg
2. assets/audio/weapons/Heavy_scythe_slash_s_#4-1772612465296.wav → scythe.ogg

═══════════════════════════════════════════════════════════
方法1：使用在线转换工具（最简单）
═══════════════════════════════════════════════════════════

网站1: https://convertio.co/zh/wav-ogg/
网站2: https://online-audio-converter.com/
网站3: https://cloudconvert.com/wav-to-ogg

步骤：
1. 打开网站
2. 上传那两个WAV文件
3. 选择输出格式为 OGG
4. 下载转换后的文件
5. 重命名为 whip.ogg 和 scythe.ogg
6. 放到 assets/audio/weapons/ 文件夹

═══════════════════════════════════════════════════════════
方法2：使用格式工厂（Windows）
═══════════════════════════════════════════════════════════

1. 下载格式工厂：http://www.pcgeshi.com/
2. 安装并打开
3. 点击 "音频" → "→OGG"
4. 添加那两个WAV文件
5. 点击 "开始" 转换
6. 重命名并移动到 weapons 文件夹

═══════════════════════════════════════════════════════════
方法3：使用 FFmpeg（命令行）
═══════════════════════════════════════════════════════════

1. 下载 FFmpeg：https://ffmpeg.org/download.html
2. 解压并添加到系统PATH
3. 打开命令行，进入音频目录：

   cd E:\AI\game\rougelike-cow\assets\audio\weapons

4. 执行转换命令：

   ffmpeg -i "whip_crack_Sharp_lea_#1-1772612244854.wav" -c:a libvorbis -q:a 4 "whip.ogg"
   
   ffmpeg -i "Heavy_scythe_slash_s_#4-1772612465296.wav" -c:a libvorbis -q:a 4 "scythe.ogg"

═══════════════════════════════════════════════════════════
转换后检查
═══════════════════════════════════════════════════════════

转换完成后，文件夹结构应该是：

assets/audio/weapons/
  ├── axe_throw_v1.mp3
  ├── cross_launch_v1.mp3
  ├── dart_shoot_v2.mp3
  ├── fireball_v1.mp3
  ├── Heavy_scythe_slash_s_#4-1772612465296.wav  (原文件可删)
  ├── icicle_v2.mp3
  ├── knife_throw_v1.mp3
  ├── laser1.ogg
  ├── laser2.ogg
  ├── lighting.ogg
  ├── scythe.ogg  ← 新生成的
  ├── shuriken_v2.mp3
  ├── wand_cast_v1.mp3
  ├── whip.ogg  ← 新生成的
  ├── whip_crack_Sharp_lea_#1-1772612244854.wav  (原文件可删)
  └── ...

═══════════════════════════════════════════════════════════
缺少的音效文件清单（需要补充）
═══════════════════════════════════════════════════════════

【高优先级 - 必须补充】
❌ weapons/poison.ogg - 毒药武器音效
❌ ui/gameover.ogg - 游戏结束
❌ ui/hurt.ogg - 玩家受伤
❌ ui/warning.ogg - 警告提示
❌ ui/portal.ogg - 传送门
❌ ui/wave.ogg - 波次开始
❌ ui/spawn.ogg - 怪物生成

【中优先级 - 建议补充】
⚠️ hit/bone.ogg - 骷髅类怪物命中
⚠️ hit/stone.ogg - 石头怪命中
⚠️ ui/chest.ogg - 打开宝箱（当前复用金币音效）
⚠️ ui/buy.ogg - 购买物品
⚠️ ui/gem.ogg - 宝石收集
⚠️ ui/evolve.ogg - 进化
⚠️ ui/heal.ogg - 治疗
⚠️ ui/kill.ogg - 击杀确认

═══════════════════════════════════════════════════════════
