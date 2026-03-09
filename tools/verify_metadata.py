#!/usr/bin/env python3
import json

with open('assets/sprites/metadata.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('=' * 60)
print('Sprite Metadata v2.0 Verification Report')
print('=' * 60)
print()

# Player
if 'player' in data:
    p = data['player']
    bounds = p.get('bounds', {})
    print('Player:')
    print(f"  Bounds: {bounds.get('width')}x{bounds.get('height')} (canvas: {p['canvasWidth']}x{p['canvasHeight']})")
    ratio = bounds.get('width', 1) / bounds.get('height', 1)
    print(f"  Aspect Ratio: {ratio:.2f}")
    print(f"  Anchor Center: ({p['anchor']['center']['x']}, {p['anchor']['center']['y']})")
    print(f"  Anchor Feet: ({p['anchor']['feet']['x']}, {p['anchor']['feet']['y']})")
    print()

# Enemies by tier
for tier in [1, 2, 3, 4]:
    enemies = [(k, v) for k, v in data.items() if isinstance(v, dict) and v.get('meta', {}).get('tier') == tier]
    if enemies:
        print(f'Tier {tier} Enemies ({len(enemies)}):')
        for name, info in sorted(enemies):
            b = info.get('bounds', {})
            mw, mh = b.get('width', 64), b.get('height', 64)
            ratio = mw / mh
            print(f"  {name:12s}: {mw:2d}x{mh:2d} (ratio: {ratio:.2f})")
        print()

# Check for wide vs tall sprites
print('Aspect Ratio Analysis:')
all_sprites = [(k, v) for k, v in data.items() if isinstance(v, dict) and 'bounds' in v]
wide = [(n, i) for n, i in all_sprites if i['bounds']['width'] / i['bounds']['height'] > 1.2]
tall = [(n, i) for n, i in all_sprites if i['bounds']['height'] / i['bounds']['width'] > 1.2]

if wide:
    print(f"  Wide sprites ({len(wide)}): {', '.join([n for n, _ in wide[:5]])}{'...' if len(wide) > 5 else ''}")
if tall:
    print(f"  Tall sprites ({len(tall)}): {', '.join([n for n, _ in tall[:5]])}{'...' if len(tall) > 5 else ''}")

print()
print('=' * 60)
print('[OK] All sprites processed successfully')
print('=' * 60)
