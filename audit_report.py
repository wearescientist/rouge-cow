import re
import json
from collections import Counter

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("=" * 70)
print("ROUGE COW v0.9.2 CODE AUDIT REPORT")
print("=" * 70)

# ==================== PART 1: BASIC INFO ====================
print("\n[1. FILE BASIC INFO]")
print(f"  File Size: {len(content):,} chars")
print(f"  Lines: {content.count(chr(10)):,}")
print(f"  UTF-8 BOM: {'YES' if content.startswith(chr(0xfeff)) else 'NO'}")

title_match = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
if title_match:
    print(f"  Title: {title_match.group(1).strip()}")

# ==================== PART 2: CLASS CHECK ====================
print("\n[2. CLASS DEFINITIONS]")
classes = re.findall(r'class (\w+)', content)
class_counts = Counter(classes)
for cls, count in class_counts.items():
    status = "[DUP]" if count > 1 else "[OK]"
    print(f"  {status} {cls}: {count}")

# ==================== PART 3: GAME CLASS METHODS ====================
print("\n[3. GAME CLASS CORE METHODS]")
game_match = re.search(r'class Game \{', content)
if game_match:
    start = game_match.start()
    end = content.find('class ', start + 10)
    if end == -1:
        end = len(content)
    game_section = content[start:end]
    
    methods = re.findall(r'\n    (async )?(\w+)\(', game_section)
    print(f"  Total Methods: {len(methods)}")
    
    critical_methods = ['start', 'update', 'loop', 'draw', 'loadSprites', 'setupInput']
    for method in critical_methods:
        found = any(m[1] == method for m in methods)
        status = "[OK]" if found else "[MISSING]"
        print(f"  {status} {method}()")

# ==================== PART 4: POTENTIAL ISSUES ====================
print("\n[4. POTENTIAL CODE ISSUES]")

issues = []

dup_classes = [cls for cls, count in class_counts.items() if count > 1]
if dup_classes:
    issues.append(f"Duplicate classes: {', '.join(dup_classes)}")

open_braces = content.count('{')
close_braces = content.count('}')
if open_braces != close_braces:
    issues.append(f"Brace mismatch: open={open_braces} close={close_braces}")

if 'dt' in content:
    update_match = re.search(r'update\(dt\) \{', content)
    if not update_match:
        issues.append("'dt' used but update(dt) may not be properly defined")

syntax_patterns = [
    ('Double semicolons', r';\s*;'),
    ('Double commas', r',\s*,'),
    ('Empty braces', r'\{\s*\}'),
]

for name, pattern in syntax_patterns:
    matches = re.findall(pattern, content)
    if matches:
        issues.append(f"{name}: {len(matches)} found")

debug_logs = content.count('console.log')
if debug_logs > 30:
    issues.append(f"Many debug logs: {debug_logs} console.log")

for issue in issues:
    print(f"  [WARN] {issue}")
if not issues:
    print("  [OK] No obvious issues found")

# ==================== PART 5: FEATURE CHECK ====================
print("\n[5. FEATURE COMPLETENESS]")

features = {
    'Restart Protection': 'isRestarting',
    'CD Limit -0.5': 'if (this.cd < -0.5)',
    'fireRate Protection': 'if (fireRate < 0.5)',
    'Sprite Version': '?v=',
    'Emoji White BG': "fillStyle = '#fff'",
    'SurvivorCamera': 'SurvivorCamera',
    '22 Enemies': 'turtle',
    'Totem System': 'TotemManager',
    'Shop System': 'ShopNPC',
    'Weapon Evolution': 'WEAPON_EVOLUTIONS',
    'LocalStorage Save': 'localStorage',
    'Wave System': 'waveManager',
    'Particle System': 'ParticleSystem',
    'Minimap': 'minimap',
}

for name, keyword in features.items():
    found = keyword in content
    status = "[OK]" if found else "[MISSING]"
    print(f"  {status} {name}")

# ==================== PART 6: PERFORMANCE RISKS ====================
print("\n[6. PERFORMANCE RISKS]")

perf_issues = []

intervals = content.count('setInterval')
timeouts = content.count('setTimeout')
if intervals > 5:
    perf_issues.append(f"Many setInterval: {intervals}")
if timeouts > 20:
    perf_issues.append(f"Many setTimeout: {timeouts}")

if 'particles.burst' in content:
    perf_issues.append("Particle burst needs limit control")

for issue in perf_issues:
    print(f"  [WARN] {issue}")
if not perf_issues:
    print("  [OK] No major performance issues")

# ==================== PART 7: UPDATE SUGGESTIONS ====================
print("\n[7. FUTURE UPDATE SUGGESTIONS (Priority Order)]")

suggestions = [
    ("P0", "Test restart attack protection works correctly"),
    ("P0", "Verify sprite version forces cache refresh"),
    ("P1", "Add game pause/resume feature"),
    ("P1", "Optimize mobile touch controls"),
    ("P2", "Add sound effects toggle option"),
    ("P2", "Add FPS display option"),
    ("P2", "Implement more totem effects"),
    ("P3", "Add achievement system"),
    ("P3", "Add statistics panel"),
    ("P3", "Optimize first-screen loading speed"),
]

for priority, item in suggestions:
    print(f"  [{priority}] {item}")

print("\n" + "=" * 70)
print("Report Complete~Meow")
print("=" * 70)
