#!/usr/bin/env python3
"""将地板贴图放大到128x128用于更好的显示效果"""
from PIL import Image
import os

BASE_DIR = r'E:\AI\game\rougelike-cow\assets\sprites\tiles\floors'

def resize_floor(filename):
    input_path = os.path.join(BASE_DIR, filename)
    if not os.path.exists(input_path):
        print(f"Not found: {filename}")
        return
    
    try:
        img = Image.open(input_path)
        # 放大到128x128
        img_resized = img.resize((128, 128), Image.Resampling.NEAREST)
        img_resized.save(input_path, 'PNG')
        print(f"Resized {filename}: {img.size} -> (128, 128)")
    except Exception as e:
        print(f"Error {filename}: {e}")

# 处理所有地板贴图
floors = [
    'layer1_floor_mycelium.png', 'layer2_floor_greenhouse.png', 
    'layer3_floor_nerve.png', 'layer4_floor_furnace.png',
    'layer5_floor_courtyard.png', 'layer6_floor_core.png'
]

print("Resizing floor tiles to 128x128...")
for f in floors:
    resize_floor(f)
print("Done!")
