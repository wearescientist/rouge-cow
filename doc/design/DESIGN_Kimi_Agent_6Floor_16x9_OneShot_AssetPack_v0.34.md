# DESIGN_Kimi_Agent_6Floor_16x9_OneShot_AssetPack_v0.34

## 版本
- v0.34
- 日期：2026-03-11

## 一、文档用途

本稿是给 `Kimi agent` 的**单次批量生图任务书**。

本稿解决的是：

- 一次请求
- 一次性交付
- 覆盖**全部 6 个楼层**
- 覆盖每层的**完整 16:9 外部世界背景**
- 覆盖每层的**环境装饰图集**

本稿不是：

- 单层试玩稿
- 单张方形壳层草案
- 分多轮确认的讨论稿

---

## 二、最重要的纠正

本项目当前目标画布不是方形，而是：

- **16:9 完整镜头**

因此本批次所有主背景图都必须按：

- **1920 x 1080**

输出。

这里明确写死：

1. **所有主背景图固定为 `1920x1080`**
2. **严禁输出高于 `1920x1080` 的版本**
3. 禁止输出：
   - `2048x1152`
   - `2560x1440`
   - `2K`
   - `4K`
4. 如果系统默认给出更高分辨率，必须在最终交付前缩回到：
   - **精确的 `1920x1080`**

同时，本次不是每层只做一套，而是：

- **每层主背景做 10 套**
- **每层环境装饰图集做 10 套**
- 总体保持**同一画风、同一空间逻辑、同一主题语言**
- 但必须在构图、侵蚀轮廓、洞壁厚薄、前景压边、装饰组织上做出真正不同的备选

严禁以下凑数行为：

- 只换颜色
- 只换亮度
- 只做水平翻转
- 只做轻微裁切
- 只把同一张图的装饰位置挪一下

每一套都必须是：

- 同主题
- 同风格
- 不同构图
- 可作为备选正式资产

环境装饰图集统一控制为：

- **1024x1024**

原因：

- 主背景必须匹配项目的 `16:9` 全镜头母版
- 装饰图集不需要过大，使用方形图集更利于切图和排布
- 主背景需要正式适配容器
- 装饰图集则需要控制尺寸，避免无意义膨胀

---

## 三、一次性交付的总清单

本次总共交付 **120 个文件**。

### 3.1 六层主背景图，每层 10 套

命名规则：

- `F1_BG_A_fullscene_shell_16x9.png`
- `F1_BG_B_fullscene_shell_16x9.png`
- `F1_BG_C_fullscene_shell_16x9.png`
- `F1_BG_D_fullscene_shell_16x9.png`
- `F1_BG_E_fullscene_shell_16x9.png`
- `F1_BG_F_fullscene_shell_16x9.png`
- `F1_BG_G_fullscene_shell_16x9.png`
- `F1_BG_H_fullscene_shell_16x9.png`
- `F1_BG_I_fullscene_shell_16x9.png`
- `F1_BG_J_fullscene_shell_16x9.png`

同理扩展到：

- `F2_BG_A~J_fullscene_shell_16x9.png`
- `F3_BG_A~J_fullscene_shell_16x9.png`
- `F4_BG_A~J_fullscene_shell_16x9.png`
- `F5_BG_A~J_fullscene_shell_16x9.png`
- `F6_BG_A~J_fullscene_shell_16x9.png`

共计：

- `6 楼层 x 10 套 = 60 张主背景图`

### 3.2 六层环境装饰图集，每层 10 套

命名规则：

- `F1_DEC_A_environment_sheet.png`
- `F1_DEC_B_environment_sheet.png`
- `F1_DEC_C_environment_sheet.png`
- `F1_DEC_D_environment_sheet.png`
- `F1_DEC_E_environment_sheet.png`
- `F1_DEC_F_environment_sheet.png`
- `F1_DEC_G_environment_sheet.png`
- `F1_DEC_H_environment_sheet.png`
- `F1_DEC_I_environment_sheet.png`
- `F1_DEC_J_environment_sheet.png`

同理扩展到：

- `F2_DEC_A~J_environment_sheet.png`
- `F3_DEC_A~J_environment_sheet.png`
- `F4_DEC_A~J_environment_sheet.png`
- `F5_DEC_A~J_environment_sheet.png`
- `F6_DEC_A~J_environment_sheet.png`

共计：

- `6 楼层 x 10 套 = 60 张装饰图集`

交付要求：

- 全部必须是独立文件
- 不允许只给拼图总览
- 不允许只给过程截图
- 不允许只给概念草图

---

## 四、统一镜头和几何约束

### 4.1 主背景画布

- 尺寸：`1920x1080`
- 比例：`16:9`
- 格式：`PNG`
- 背景可为完整实图，但中心玩法区必须留给后续地板接入

### 4.2 中心玩法保留区

所有六张主背景图，必须使用同一个中心保留区：

- `x = 528 ~ 1392`
- `y = 108 ~ 972`
- 尺寸：`864 x 864`

这个区域代表项目当前的核心方形战斗台。

规则：

1. 这块区域是**后续地板和战斗内容承载区**
2. 在主背景图里，这块区域必须保持：
   - 干净
   - 规则
   - 可读
   - 不能被复杂景物侵入
3. 这里允许存在：
   - 极淡环境底色
   - 极轻的基础氛围过渡
4. 这里不允许存在：
   - 厚洞壁
   - 大块前景遮挡
   - 根须侵入中心
   - 结构性洞壁切面
   - 大型装饰物
   - 任何会破坏后续地板铺设的异形侵入

注意：

- 这里和之前“绝对透明禁区”的单壳层思路不同
- 这次是**完整 16:9 主背景图**
- 因此中心区不是透明洞，而是**必须保持干净、可覆盖、可继续铺地板的清爽保留区**
- 真正需要透明切图的是后面的装饰图集

### 4.3 空间定义

统一空间逻辑必须是：

- 正俯视
- 方形中心战斗台
- 四周是向下包裹、向外延伸的洞穴世界

不是：

- 四面平墙房间
- 建筑室内
- 八方旅人式斜透视街景
- 对称石室

最重要的空间定义句：

> 这不是一个传统房间，而是一个从正上方俯视的、围绕中心方形战斗台展开的洞穴世界镜头。

---

## 五、统一画风约束

统一画风：

- `HD-2D pixel art style`
- `stylized 2D game environment`
- `hand-painted pixel-art textures`
- `non-photorealistic`

统一材质语言：

- 灰白
- 骨白
- 冷灰
- 轻矿物感
- 菌膜感
- 像素化手绘质感

统一正向风格前缀：

```text
HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, top-down cave stage, readable large shapes, simplified texture clusters, non-photorealistic, moody but clean, game-ready background art
```

统一负面词：

```text
photorealistic, realistic 3d render, octane render, unreal engine, blender render, cgi, room interior, flat wall box, temple, palace, corridor, bricks, tiles, ceramic floor, marble, checkerboard floor, stairs, doorway, furniture, ui, text, characters, weapons, ornate frame, perfect symmetry, repeated wallpaper texture, over-detailed concept art noise
```

---

## 六、六个楼层的主题定义

### 6.1 第一层：菌丝区

关键词：

- 灰白菌穴
- 骨白菌丝
- 冷灰石灰岩
- 孢子微光
- 半封闭菌腔

氛围要求：

- 安静
- 冷
- 干净但不空
- 像被菌丝和矿物共同侵蚀的地下洞穴

禁止：

- 森林感
- 雪洞感
- 户外蓝天感

### 6.2 第二层：孵化温室

关键词：

- 潮湿囊泡
- 膜壁
- 培养液残痕
- 轻黄绿 / 病态绿
- 湿润培养腔

氛围要求：

- 潮湿
- 半生物培养室感
- 但仍然是自然异化洞穴，不是实验室建筑

禁止：

- 玻璃温室
- 现代设施
- 科幻罐体

### 6.3 第三层：神经索

关键词：

- 神经束
- 导电纹
- 冷紫脉冲雾
- 神经膜
- 细长导电结构

氛围要求：

- 冷
- 神经感
- 轻电信号感
- 有一点危险的秩序感

禁止：

- 赛博电路板
- 金属机房
- 未来科技实验室

### 6.4 第四层：消化熔炉

关键词：

- 焦黑熔壳
- 热裂口
- 灼热微尘
- 焦褐与熔红
- 灰烬沉积

氛围要求：

- 热
- 压迫
- 像活体消化腔与熔裂岩壳混合

禁止：

- 工业熔炉
- 机械火山
- 人造铁厂

### 6.5 第五层：母虫庭院

关键词：

- 血肉帘幕
- 根须团
- 囊泡肉壁
- 深红褐
- 苍白虫巢结构

氛围要求：

- 有机
- 压抑
- 繁殖感
- 不能太恶心到失去游戏可读性

禁止：

- 纯血腥恐怖片
- 写实内脏
- 医学切片感

### 6.6 第六层：千根之心

关键词：

- 深紫洞宫
- 金纹骨架
- 圣核远光
- 高压中心感
- 最终核心洞腔

氛围要求：

- 庄重
- 压轴
- 神秘
- 高级

禁止：

- 金碧辉煌神殿
- 纯建筑宫殿
- 奢华圣堂

---

## 七、六张主背景图的详细要求

### 六层主背景的共通规则

- 每层必须输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 十套必须保持同一主题与画风
- 十套必须在以下方面明显不同：
  - 洞壁轮廓
  - 上远景组织
  - 左右切面厚薄关系
  - 下方前景唇边形态
  - 环境附着物分布
  - 角落压边方式
- 但不得靠以下方式伪装成不同套：
  - 改色
  - 镜像
  - 轻微旋转
  - 轻微平移
  - 只改局部一小块

### F1_BG_A~J_fullscene_shell_16x9.png

要求：

- 第一层菌丝区完整 `16:9` 主背景
- 输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 中心 `864x864` 保留区保持干净
- 四周是灰白菌穴洞壁、轻菌膜、冷灰矿物
- 上方有更远的菌腔深度
- 下方有更厚的近景唇边和轻微前景压边
- 左右是自然侵蚀洞壁切面
- HUD 后方区域保持安静，不放最强热点

直接提示词：

```text
HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, top-down fungal cave stage, full 16:9 background, 1920x1080, produce 10 distinct composition variants A B C D E F G H I J in the same style, floor 1 mycelium zone, a clean centered square gameplay reserve area at x528~1392 y108~972 must remain simple and unobstructed for later floor placement, gray-white fungal cavern, bone-white mycelium, cold gray limestone, distant upper cave depth, asymmetrical side cut-walls, heavier lower foreground lip, subtle spores, quiet HUD-safe side bands, non-photorealistic, readable large shapes, no recolor-only variants, no mirrored duplicates
```

### F2_BG_A~J_fullscene_shell_16x9.png

要求：

- 第二层孵化温室完整 `16:9` 主背景
- 输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 中心保留区仍然干净
- 四周有囊泡、膜壁、培养液痕迹、潮湿包膜
- 颜色控制在病态绿、灰黄绿、湿冷灰
- 不能变成现代实验室

直接提示词：

```text
HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, top-down incubation greenhouse cave stage, full 16:9 background, 1920x1080, produce 10 distinct composition variants A B C D E F G H I J in the same style, floor 2 hatchery greenhouse, a clean centered square gameplay reserve area at x528~1392 y108~972 must remain simple and unobstructed for later floor placement, damp membrane walls, incubation sacs, residue of cultivation fluid, sickly green and cold gray tones, asymmetrical cave shell, heavier lower rim, quiet side bands behind HUD, non-photorealistic, no modern lab equipment, no recolor-only variants, no mirrored duplicates
```

### F3_BG_A~J_fullscene_shell_16x9.png

要求：

- 第三层神经索完整 `16:9` 主背景
- 输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 中心保留区干净
- 四周是神经束、导电纹、冷紫雾、薄膜通路
- 不允许科技机房感

直接提示词：

```text
HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, top-down nerve tract cave stage, full 16:9 background, 1920x1080, produce 10 distinct composition variants A B C D E F G H I J in the same style, floor 3 nerve bundle zone, a clean centered square gameplay reserve area at x528~1392 y108~972 must remain simple and unobstructed for later floor placement, neural fibers, conductive vein patterns, cool violet pulse mist, membrane channels, asymmetrical organic cave shell, darker lower lip, readable large shapes, non-photorealistic, no sci-fi machinery, no recolor-only variants, no mirrored duplicates
```

### F4_BG_A~J_fullscene_shell_16x9.png

要求：

- 第四层消化熔炉完整 `16:9` 主背景
- 输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 中心保留区干净
- 四周是焦黑熔壳、热裂、灰烬、暗红热口
- 热感要强，但仍保持像素游戏可读性

直接提示词：

```text
HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, top-down digestive furnace cave stage, full 16:9 background, 1920x1080, produce 10 distinct composition variants A B C D E F G H I J in the same style, floor 4 digestive furnace, a clean centered square gameplay reserve area at x528~1392 y108~972 must remain simple and unobstructed for later floor placement, charred shell walls, heated fissures, ember dust, ash deposits, dark red-orange glow trapped in cracks, asymmetrical cave shell, heavy lower rim, non-photorealistic, no industrial furnace machinery, no recolor-only variants, no mirrored duplicates
```

### F5_BG_A~J_fullscene_shell_16x9.png

要求：

- 第五层母虫庭院完整 `16:9` 主背景
- 输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 中心保留区干净
- 四周是血肉帘幕、根须团、囊泡肉壁、苍白虫巢沉积
- 要压抑，但不能写实恶心

直接提示词：

```text
HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, top-down brood courtyard cave stage, full 16:9 background, 1920x1080, produce 10 distinct composition variants A B C D E F G H I J in the same style, floor 5 mother-bug courtyard, a clean centered square gameplay reserve area at x528~1392 y108~972 must remain simple and unobstructed for later floor placement, flesh curtains, clustered roots, cyst walls, pale brood deposits, dark red-brown organic cave shell, asymmetrical and oppressive, heavier bottom foreground rim, non-photorealistic, not realistic gore, no recolor-only variants, no mirrored duplicates
```

### F6_BG_A~J_fullscene_shell_16x9.png

要求：

- 第六层千根之心完整 `16:9` 主背景
- 输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 中心保留区干净
- 四周是深紫洞宫、金纹骨架、圣核远光
- 要有最终层压轴感
- 但仍然不能跑成宫殿室内

直接提示词：

```text
HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, top-down heart-of-a-thousand-roots cave stage, full 16:9 background, 1920x1080, produce 10 distinct composition variants A B C D E F G H I J in the same style, floor 6 final core chamber, a clean centered square gameplay reserve area at x528~1392 y108~972 must remain simple and unobstructed for later floor placement, deep violet cave shell, gold-vein bone structures, distant sacred core glow, asymmetrical final organic cavern, heavy lower rim, quiet but powerful side bands, non-photorealistic, not a palace interior, no recolor-only variants, no mirrored duplicates
```

---

## 八、六张环境装饰图集的详细要求

所有环境装饰图集共同规则：

- 尺寸固定：`1024x1024`
- `PNG`
- 透明背景
- 每层输出 `A/B/C/D/E/F/G/H/I/J` 十套
- 每张图集内部放多个独立元素
- 元素之间必须留出可切图的透明间距
- 不允许生成大面积背景底
- 风格必须与本层主背景完全一致
- 十套必须保持同主题同风格，但元素组合、轮廓、大小比例、摆放组织必须真实不同
- 禁止只换色、镜像、轻微挪动后重复交付

### F1_DEC_environment_sheet.png

需要至少包含：

- 12 个小型发光菌簇
- 8 个菌丝帘幕
- 8 个骨白矿物沉积块
- 8 个壁面根须或湿痕贴花
- 6 个孢子雾片

### F2_DEC_environment_sheet.png

需要至少包含：

- 10 个囊泡附着物
- 8 个膜壁垂帘
- 8 个培养液残痕贴花
- 6 个湿润菌膜堆积
- 6 个冷雾片

### F3_DEC_environment_sheet.png

需要至少包含：

- 10 个神经束结节
- 8 个导电纹贴花
- 8 个神经膜垂片
- 6 个冷紫脉冲雾片
- 6 个附着型神经菌簇

### F4_DEC_environment_sheet.png

需要至少包含：

- 10 个焦壳碎块
- 8 个热裂贴花
- 8 个熔边沉积
- 6 个灰烬烟尘片
- 6 个暗红微热发光裂点

### F5_DEC_environment_sheet.png

需要至少包含：

- 10 个血肉帘幕
- 8 个根须团块
- 8 个囊泡肉壁贴花
- 6 个苍白虫巢堆积
- 6 个低频湿雾片

### F6_DEC_environment_sheet.png

需要至少包含：

- 10 个金纹骨架碎片
- 8 个深紫膜壁装饰
- 8 个圣核纹路贴花
- 6 个远光雾片
- 6 个终层高能菌簇

---

## 九、给 Kimi Agent 的单次总任务正文

下面整段可以直接投喂：

```text
你现在要一次性完成一个游戏美术资产包任务，不要拆成多轮，不要反问，不要先出方案再等我确认。你可以在内部自行多步处理，但对我只算一次任务，直接交付最终文件。

任务目标：为一个正俯视的 16:9 洞穴舞台游戏生成全部 6 个楼层的完整主背景和环境装饰图集。这个项目不是传统房间视角，而是一个从正上方俯视的、围绕中心方形战斗台展开的洞穴世界镜头。中心是后续地板和战斗内容要覆盖的保留区，因此每张主背景都必须让中心区域保持干净、规则、可读，不要被洞壁和装饰侵入，而且中心不能出现明显矩形边框、嵌板感或发光边。每个楼层都不是只做一套，而是要做同风格的 10 套正式备选素材。

统一硬规则：
1. 六层主背景图全部固定输出 1920x1080 PNG，绝不允许高于 1920x1080，禁止 2048x1152、2560x1440、2K、4K。如果系统默认更高，交付前强制缩回 1920x1080。
2. 六层环境装饰图集全部固定输出 1024x1024 PNG 透明背景。
3. 六层主背景共用同一个中心方形保留区：x=528~1392, y=108~972, size=864x864。这个区域必须干净、简洁、可覆盖，不允许厚洞壁、根须、结构性前景、复杂装饰侵入。
4. 统一画风必须是：HD-2D pixel art style, stylized 2D game environment, hand-painted pixel-art textures, non-photorealistic, readable large shapes, simplified texture clusters。
5. 统一禁止：photorealistic, realistic 3d render, unreal engine, blender render, room interior, flat wall box, temple, palace, corridor, bricks, tiles, ceramic floor, marble, checkerboard floor, stairs, doorway, furniture, ui, text, characters, weapons, ornate frame, perfect symmetry, repeated wallpaper texture, any title text, any floor label, any Chinese or English words, any letters, any numbers, any logo, any watermark, any signature, any AI-generated mark, black cinematic bars, black top or bottom borders, visible inner frame around the center reserve area。
6. 六层主背景必须是满幅有效画面，禁止黑色电影黑边、禁止上下留黑条、禁止 letterbox、禁止安全区外黑幕。
7. 六层主背景禁止任何文字和标记，包括但不限于：楼层标题、英文标题、中文标题、字母、数字、logo、水印、签名、AI生成角标。
8. 中心保留区必须干净，但不能出现明显的内框、面板边、雕刻边、发光边、凸起矩形框；它是后续地板承载区，不是被嵌进去的 UI 面板。
9. 如果模型倾向于生成标题、水印或边缘黑条，必须在内部自行重绘、外扩、裁切并回填，最终交付图中不得保留任何此类痕迹。
10. 每个楼层必须输出 10 套背景和 10 套装饰图集，编号为 A/B/C/D/E/F/G/H/I/J。
11. 这 10 套必须是同主题同风格下的真实备选，不允许只换颜色、镜像、微调位置、轻微裁切后充数。
12. 全部文件必须独立导出，不允许只给拼图总览。

请一次性交付以下 120 个文件：
1. 六层主背景：F1~F6，每层 A/B/C/D/E/F/G/H/I/J 十套，共 60 张，命名格式 F{floor}_BG_{variant}_fullscene_shell_16x9.png
2. 六层装饰图集：F1~F6，每层 A/B/C/D/E/F/G/H/I/J 十套，共 60 张，命名格式 F{floor}_DEC_{variant}_environment_sheet.png

六张主背景的主题分别是：

F1 菌丝区：
gray-white fungal cavern, bone-white mycelium, cold gray limestone, subtle spores, distant fungal cavity, heavier lower cave lip, asymmetrical side cut-walls, quiet side bands behind HUD

F2 孵化温室：
damp incubation cavern, membrane walls, incubation sacs, residue of cultivation fluid, sickly green and cold gray tones, asymmetrical cave shell, moist and oppressive but not a modern laboratory

F3 神经索：
neural fibers, conductive vein patterns, cool violet pulse mist, membrane channels, asymmetrical nerve cave shell, dangerous ordered organic structure, no sci-fi machinery

F4 消化熔炉：
charred shell walls, heated fissures, ember dust, ash deposits, dark red-orange glow trapped in cracks, asymmetrical digestive furnace cave, hot but still readable for gameplay

F5 母虫庭院：
flesh curtains, clustered roots, cyst walls, pale brood deposits, dark red-brown organic cavern, oppressive but not realistic gore

F6 千根之心：
deep violet cave shell, gold-vein bone structures, distant sacred core glow, asymmetrical final organic cavern, ceremonial and powerful, not a palace interior

六张装饰图集分别需要：

F1：发光菌簇、菌丝帘幕、骨白矿物沉积、壁面根须贴花、孢子雾片
F2：囊泡附着物、膜壁垂帘、培养液残痕、湿润菌膜堆积、冷雾片
F3：神经束结节、导电纹贴花、神经膜垂片、冷紫脉冲雾片、附着型神经菌簇
F4：焦壳碎块、热裂贴花、熔边沉积、灰烬烟尘片、暗红微热裂点
F5：血肉帘幕、根须团块、囊泡肉壁贴花、苍白虫巢堆积、低频湿雾片
F6：金纹骨架碎片、深紫膜壁装饰、圣核纹路贴花、远光雾片、终层高能菌簇

最终要求：所有主背景必须是 16:9 全镜头可用图，分辨率精确 1920x1080，满幅有效画面，无黑边、无标题、无文字、无水印、无 logo、无签名，中心保留区干净且无矩形边框感；所有装饰图集必须是 1024x1024 透明背景、可切图、元素彼此分离；每层的 A/B/C/D/E/F/G/H/I/J 十套必须是同风格但不同构图的真实备选，而不是换色或镜像。不要给过程图，不要给草图，直接交付最终文件。
```

---

## 十、验收标准

以下任一项失败，视为整批不合格：

1. 主背景不是 `1920x1080`
2. 主背景出现更高分辨率
3. 装饰图集不是 `1024x1024`
4. 中心保留区被大面积侵入，无法继续铺地板
5. 画风跑偏成写实 3D 或建筑室内
6. 六层主题辨识度不足
7. 装饰图集元素彼此粘连，无法切图
8. 十套备选之间只是换色、镜像或轻微挪动
9. 只交付拼图，不交独立文件

---

## 十一、结论

本稿已经把以下内容一次性写死：

- 六个楼层
- 16:9 主背景
- `1920x1080` 主背景母版
- 中心保留区坐标
- 各层主题
- 各层装饰清单
- 每层 `10` 套真实备选
- 单次任务正文

可以直接整份扔给 `Kimi agent` 执行。~Meow
