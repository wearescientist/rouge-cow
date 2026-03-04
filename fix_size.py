#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 修复 goose
content = content.replace(
    "desc: '羽毛齐射3发' },",
    "desc: '羽毛齐射3发', size: 24 },"
)

# 修复 wolf_king
content = content.replace(
    "desc: '召唤3白狼+狼嚎加速' },",
    "desc: '召唤3白狼+狼嚎加速', size: 22 },"
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('修复完成')
