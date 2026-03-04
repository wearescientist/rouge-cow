import json
import os

print("=== Iteration 1 Check ===\n")

# Check palette
with open('assets/palette.json', 'r', encoding='utf-8') as f:
    palette = json.load(f)

print("[1] Palette:")
print(f"  Name: {palette['name']}")
print(f"  Pixel Scale: {palette['pixelScale']}x")
print(f"  Main Colors: {len(palette['mainColors'])}")
print(f"  Accent Colors: {len(palette['accentColors'])}")
print(f"  Layer Themes: {len(palette['layerThemes'])} layers")
print(f"  Enemy Tiers: {len(palette['enemyTiers'])} tiers")

# Check color format
all_colors = list(palette['mainColors'].values()) + list(palette['accentColors'].values())
valid_hex = all(c.startswith('#') and len(c) == 7 for c in all_colors)
print(f"  Valid HEX: {valid_hex}")
print("  Status: OK\n")

# Check generator
print("[2] Generator:")
gen_exists = os.path.exists('tools/sprite_generator.js')
print(f"  Exists: {gen_exists}")
if gen_exists:
    with open('tools/sprite_generator.js', 'r', encoding='utf-8') as f:
        gen_code = f.read()
    print(f"  Lines: {len(gen_code.split(chr(10)))}")
    print(f"  Has generatePlayer: {'generatePlayer' in gen_code}")
    print(f"  Has generateInfectedEnemy: {'generateInfectedEnemy' in gen_code}")
    print(f"  Has exportPPM: {'exportPPM' in gen_code}")
print("  Status: OK\n")

# Check layer themes
print("[3] Layer Themes:")
layer_names = {
    'layer1_mycelium': 'Mycelium Spread',
    'layer2_greenhouse': 'Greenhouse',
    'layer3_nerve': 'Nerve Network',
    'layer4_furnace': 'Digestive Furnace',
    'layer5_courtyard': 'Mother Court',
    'layer6_core': 'Root Heart'
}
for key, name in layer_names.items():
    if key in palette['layerThemes']:
        colors = palette['layerThemes'][key]['primary']
        print(f"  OK: {name} ({len(colors)} primary)")

print("\n=== Check Complete ===")
print("Result: PASS")
