from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
index = (root / 'index.html').read_text(encoding='utf-8', errors='ignore')

print('== Runtime Scripts ==')
for src in re.findall(r'<script\s+src="([^"]+)"', index):
    print(src)

print('\n== Largest JS Files ==')
js_files = sorted(root.rglob('*.js'), key=lambda p: p.stat().st_size, reverse=True)
for path in js_files[:20]:
    rel = path.relative_to(root)
    print(f'{rel} | {path.stat().st_size}')
