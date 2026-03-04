#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 unholy_vespers
old_unholy = """    unholy_vespers: { 
        name: '邪恶晚祷', icon: '📿', dmg: 45, cd: 1.5, range: 280, 
        type: 'orbit', color: '#ff6600', count: 8, duration: 15,
        rotationSpeed: 3.0, special: '八环绕持续15秒+高速旋转'
    },"""

new_unholy = """    unholy_vespers: { 
        name: '邪恶晚祷', icon: '📿', dmg: 55, cd: 1.5, range: 280, 
        type: 'orbit', color: '#ff6600', count: 6, duration: 10,
        rotationSpeed: 3.0, special: '六环绕持续10秒+高速旋转'
    },"""

content = content.replace(old_unholy, new_unholy)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('修复完成')
