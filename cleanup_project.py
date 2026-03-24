#!/usr/bin/env python3
import argparse
import json
import os
from pathlib import Path
import shutil

SCRIPT_DIR = Path(__file__).resolve().parent
MANIFEST_PATH = SCRIPT_DIR / 'cleanup_manifest.json'


def load_manifest():
    with MANIFEST_PATH.open('r', encoding='utf-8') as f:
        return json.load(f)


def resolve_repo_root(user_path: str | None) -> Path:
    if user_path:
        return Path(user_path).resolve()
    return Path.cwd().resolve()


def existing_targets(repo_root: Path, manifest: dict):
    files = []
    for rel in manifest['expanded_file_list']:
        p = repo_root / rel
        if p.exists():
            files.append(p)
    return files


def summarize(files):
    total_bytes = 0
    for p in files:
        try:
            total_bytes += p.stat().st_size
        except FileNotFoundError:
            pass
    return total_bytes


def human_size(num):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if num < 1024 or unit == 'GB':
            return f'{num:.1f}{unit}'
        num /= 1024


def main():
    ap = argparse.ArgumentParser(description='清理当前项目中的旧主源 / 死脚本 / 训练产物。')
    ap.add_argument('repo', nargs='?', help='项目根目录；默认当前目录')
    ap.add_argument('--dry-run', action='store_true', help='只预览，不删除')
    ap.add_argument('--no-backup', action='store_true', help='删除前不备份文件列表')
    args = ap.parse_args()

    manifest = load_manifest()
    repo_root = resolve_repo_root(args.repo)
    files = existing_targets(repo_root, manifest)
    total_bytes = summarize(files)

    print(f'项目目录: {repo_root}')
    print(f'待删除文件数: {len(files)}')
    print(f'预计释放空间: {human_size(total_bytes)}')

    if not files:
        print('没有匹配到任何待删除文件。')
        return

    for p in files:
        print(f' - {p.relative_to(repo_root)}')

    if args.dry_run:
        print('\nDry run 完成，未执行删除。')
        return

    backup_dir = repo_root / '_cleanup_backup'
    if not args.no_backup:
        backup_dir.mkdir(parents=True, exist_ok=True)
        with (backup_dir / 'deleted_files.txt').open('w', encoding='utf-8') as f:
            for p in files:
                f.write(str(p.relative_to(repo_root)) + '\n')
        shutil.copy2(MANIFEST_PATH, backup_dir / 'cleanup_manifest.json')

    removed = 0
    for p in files:
        try:
            p.unlink()
            removed += 1
        except FileNotFoundError:
            pass

    print(f'\n已删除: {removed} 个文件')
    if not args.no_backup:
        print(f'备份清单: {backup_dir}')
    print('清理完成。')


if __name__ == '__main__':
    main()
