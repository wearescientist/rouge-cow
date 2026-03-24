#!/usr/bin/env python3
from __future__ import annotations
import argparse
import json
import shutil
from pathlib import Path
from datetime import datetime


def main() -> int:
    parser = argparse.ArgumentParser(description='Archive stage1 legacy files into src/_archive instead of deleting them.')
    parser.add_argument('project_root', nargs='?', default='.', help='Project root directory. Defaults to current directory.')
    parser.add_argument('--apply', action='store_true', help='Actually move files. Without this flag the script runs in dry-run mode.')
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    manifest_path = project_root / 'archive_stage1_manifest.json'
    if not manifest_path.exists():
        raise SystemExit(f'Manifest not found: {manifest_path}')

    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    archive_root = project_root / manifest.get('archive_root', 'src/_archive/stage1_legacy') / stamp
    report_lines: list[str] = []
    moved = 0
    skipped = 0

    for rel in manifest.get('files', []):
        src = project_root / rel
        if not src.exists():
            report_lines.append(f'SKIP missing  {rel}')
            skipped += 1
            continue
        dest = archive_root / rel
        action = 'MOVE' if args.apply else 'PLAN'
        report_lines.append(f'{action} {rel} -> {dest.relative_to(project_root)}')
        if args.apply:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(src), str(dest))
            moved += 1

    report_path = project_root / f'archive_stage1_report_{stamp}.txt'
    header = [
        f'project_root={project_root}',
        f'mode={"apply" if args.apply else "dry-run"}',
        f'archive_root={archive_root}',
        '',
    ]
    report_body = '\n'.join(header + report_lines) + '\n'
    report_path.write_text(report_body, encoding='utf-8')

    print(report_body, end='')
    print(f'\nreport: {report_path}')
    if args.apply:
        print(f'moved={moved} skipped={skipped}')
    else:
        print('dry-run complete. Re-run with --apply to archive the files.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
