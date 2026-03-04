#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Code Audit Tool - 代码审计工具
自动检查代码质量、潜在问题和优化建议
v0.22.1 - Phase 3 质量保障
"""

import os
import re
import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Dict, Set


@dataclass
class Issue:
    level: str  # error, warning, info
    file: str
    line: int
    message: str
    category: str


class CodeAuditor:
    def __init__(self, root_path: str = "."):
        self.root = Path(root_path)
        self.issues: List[Issue] = []
        self.stats = {
            "total_lines": 0,
            "total_files": 0,
            "issues": {"error": 0, "warning": 0, "info": 0}
        }
        
        # 检查规则
        self.rules = {
            "console_log": {
                "pattern": r"console\.log\s*\(",
                "message": "发现 console.log，建议使用 Logger 工具",
                "level": "warning",
                "category": "logging"
            },
            "debugger": {
                "pattern": r"debugger;?",
                "message": "发现 debugger 语句，生产环境应移除",
                "level": "error",
                "category": "debug"
            },
            "alert": {
                "pattern": r"alert\s*\(",
                "message": "发现 alert()，建议使用自定义弹窗",
                "level": "warning",
                "category": "ui"
            },
            "magic_number": {
                "pattern": r"[^\w](\d{3,})[^\w]",
                "message": "发现魔法数字: {}，建议使用常量",
                "level": "info",
                "category": "readability"
            },
            "todo": {
                "pattern": r"TODO|FIXME|XXX",
                "message": "发现 {} 标记",
                "level": "info",
                "category": "todo"
            },
            "long_line": {
                "max_length": 120,
                "message": "行长度超过 {} 字符",
                "level": "warning",
                "category": "style"
            }
        }

    def audit_file(self, file_path: Path) -> None:
        """审计单个文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except Exception as e:
            self.issues.append(Issue(
                level="error",
                file=str(file_path),
                line=0,
                message=f"无法读取文件: {e}",
                category="io"
            ))
            return

        self.stats["total_files"] += 1
        self.stats["total_lines"] += len(lines)
        
        content = ''.join(lines)
        
        # 检查每行
        for line_num, line in enumerate(lines, 1):
            self._check_line(file_path, line_num, line, content)

    def _check_line(self, file_path: Path, line_num: int, line: str, content: str) -> None:
        """检查单行代码"""
        # 跳过注释行
        if line.strip().startswith('//') or line.strip().startswith('*'):
            return
        
        # 检查 console.log
        if re.search(self.rules["console_log"]["pattern"], line):
            self._add_issue("console_log", file_path, line_num, line)
        
        # 检查 debugger
        if re.search(self.rules["debugger"]["pattern"], line):
            self._add_issue("debugger", file_path, line_num, line)
        
        # 检查 alert
        if re.search(self.rules["alert"]["pattern"], line):
            self._add_issue("alert", file_path, line_num, line)
        
        # 检查 TODO/FIXME
        match = re.search(self.rules["todo"]["pattern"], line, re.IGNORECASE)
        if match:
            self._add_issue("todo", file_path, line_num, line, match.group(0))
        
        # 检查行长度
        if len(line) > self.rules["long_line"]["max_length"]:
            self._add_issue("long_line", file_path, line_num, line)

    def _add_issue(self, rule_name: str, file_path: Path, line_num: int, line: str, *args) -> None:
        """添加问题记录"""
        rule = self.rules[rule_name]
        message = rule["message"].format(*args) if args else rule["message"]
        
        self.issues.append(Issue(
            level=rule["level"],
            file=str(file_path.relative_to(self.root)),
            line=line_num,
            message=message,
            category=rule["category"]
        ))
        
        self.stats["issues"][rule["level"]] += 1

    def audit_directory(self, directory: str = "src", pattern: str = "*.js") -> None:
        """审计整个目录"""
        target_dir = self.root / directory
        if not target_dir.exists():
            print(f"目录不存在: {target_dir}")
            return
        
        for file_path in target_dir.rglob(pattern):
            self.audit_file(file_path)

    def audit_index_html(self) -> None:
        """特别审计 index.html"""
        index_path = self.root / "index.html"
        if index_path.exists():
            print(f"审计主文件: {index_path}")
            self.audit_file(index_path)
            
            # 额外检查
            with open(index_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 检查文件大小
            size_kb = len(content) / 1024
            if size_kb > 500:
                self.issues.append(Issue(
                    level="warning",
                    file="index.html",
                    line=0,
                    message=f"文件大小 {size_kb:.1f}KB，建议模块化拆分",
                    category="architecture"
                ))
            
            # 检查 addEventListener/removeEventListener 比例
            add_count = len(re.findall(r'addEventListener', content))
            remove_count = len(re.findall(r'removeEventListener', content))
            if add_count > remove_count * 2:
                self.issues.append(Issue(
                    level="warning",
                    file="index.html",
                    line=0,
                    message=f"addEventListener ({add_count}) 远多于 removeEventListener ({remove_count})，可能存在内存泄漏",
                    category="memory"
                ))

    def generate_report(self, output_file: str = "audit_report.json") -> str:
        """生成审计报告"""
        report = {
            "summary": {
                "total_files": self.stats["total_files"],
                "total_lines": self.stats["total_lines"],
                "issues": self.stats["issues"],
                "issue_rate": round(
                    sum(self.stats["issues"].values()) / max(self.stats["total_lines"], 1) * 1000, 2
                )
            },
            "issues": [asdict(issue) for issue in self.issues],
            "recommendations": self._generate_recommendations()
        }
        
        output_path = self.root / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        return str(output_path)

    def _generate_recommendations(self) -> List[str]:
        """生成优化建议"""
        recommendations = []
        
        if self.stats["issues"]["error"] > 0:
            recommendations.append("请优先修复 error 级别的问题")
        
        console_logs = sum(1 for i in self.issues if i.category == "logging")
        if console_logs > 10:
            recommendations.append(f"发现 {console_logs} 处 console.log，建议统一使用 Logger 工具")
        
        if self.stats["total_lines"] > 10000:
            recommendations.append("代码量较大，建议进一步模块化拆分")
        
        return recommendations

    def print_summary(self) -> None:
        """打印摘要"""
        print("\n" + "=" * 60)
        print("代码审计报告")
        print("=" * 60)
        print(f"审计文件: {self.stats['total_files']}")
        print(f"代码行数: {self.stats['total_lines']}")
        print(f"问题统计: Error={self.stats['issues']['error']}, "
              f"Warning={self.stats['issues']['warning']}, "
              f"Info={self.stats['issues']['info']}")
        
        if self.issues:
            print("\n问题列表 (按严重程度):")
            for level in ["error", "warning", "info"]:
                level_issues = [i for i in self.issues if i.level == level]
                if level_issues:
                    print(f"\n[{level.upper()}] ({len(level_issues)}个):")
                    for issue in level_issues[:5]:  # 只显示前5个
                        print(f"  {issue.file}:{issue.line} - {issue.message}")
                    if len(level_issues) > 5:
                        print(f"  ... 还有 {len(level_issues) - 5} 个")
        
        print("\n" + "=" * 60)


def main():
    """主函数"""
    auditor = CodeAuditor()
    
    # 审计 src 目录
    print("审计 src 目录...")
    auditor.audit_directory("src")
    
    # 特别审计 index.html
    print("审计 index.html...")
    auditor.audit_index_html()
    
    # 生成报告
    report_path = auditor.generate_report()
    print(f"\n报告已保存: {report_path}")
    
    # 打印摘要
    auditor.print_summary()


if __name__ == "__main__":
    main()
