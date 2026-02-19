#!/bin/bash
# AI游戏训练系统

WORKSPACE="/root/.openclaw/workspace"
TRAIN_COUNT_FILE="$WORKSPACE/rougelike-cow/ai_training/count.txt"
VIDEO_DIR="$WORKSPACE/rouge-cow-videos"

cd "$WORKSPACE/rougelike-cow"

# 读取当前训练次数
if [ -f "$TRAIN_COUNT_FILE" ]; then
    COUNT=$(cat "$TRAIN_COUNT_FILE")
else
    COUNT=0
fi

# 递增计数
COUNT=$((COUNT + 1))
echo $COUNT > "$TRAIN_COUNT_FILE"

# 计算是否是第10次（需要录制视频）
RECORD_VIDEO=0
if [ $((COUNT % 10)) -eq 0 ]; then
    RECORD_VIDEO=1
fi

echo "=== AI训练 #$COUNT ==="
echo "录制视频: $RECORD_VIDEO"

# 运行游戏训练（使用Node.js脚本）
node ai_training/play_game.js $RECORD_VIDEO $COUNT

# 如果是第10次，上传视频（带重试）
if [ $RECORD_VIDEO -eq 1 ]; then
    echo "上传视频到GitHub..."
    cd "$VIDEO_DIR"
    git add .
    git commit -m "训练视频 #$COUNT"
    
    # 重试推送最多3次
    for i in 1 2 3; do
        echo "推送尝试 #$i..."
        if timeout 60 git push origin main; then
            echo "推送成功！"
            break
        else
            echo "推送失败，等待10秒后重试..."
            sleep 10
        fi
    done
fi

echo "=== 训练完成 ==="
