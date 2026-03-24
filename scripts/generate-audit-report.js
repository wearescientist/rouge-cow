const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const REPORT_PATH = path.join(ROOT, 'audit_report.json');
const TARGETS = [
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'src'),
  path.join(ROOT, 'data')
];
const FILE_EXTENSIONS = new Set(['.js', '.html']);
const STYLE_LINE_LENGTH = 140;

function walkFiles(entryPath, out) {
  const stat = fs.statSync(entryPath);
  if (stat.isFile()) {
    if (FILE_EXTENSIONS.has(path.extname(entryPath).toLowerCase())) {
      out.push(entryPath);
    }
    return;
  }

  const items = fs.readdirSync(entryPath, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(entryPath, item.name);
    if (item.isDirectory()) {
      walkFiles(fullPath, out);
    } else if (item.isFile()) {
      if (FILE_EXTENSIONS.has(path.extname(item.name).toLowerCase())) {
        out.push(fullPath);
      }
    }
  }
}

function toRepoPath(absPath) {
  return path.relative(ROOT, absPath).replace(/\//g, '\\');
}

function addIssue(issues, level, file, line, message, category) {
  issues.push({ level, file, line, message, category });
}

function main() {
  const files = [];
  for (const target of TARGETS) {
    if (!fs.existsSync(target)) continue;
    walkFiles(target, files);
  }

  const deduped = [...new Set(files)].sort((a, b) => a.localeCompare(b));
  const issues = [];
  let totalLines = 0;
  let addEventCount = 0;
  let removeEventCount = 0;

  for (const absPath of deduped) {
    const content = fs.readFileSync(absPath, 'utf8');
    const relPath = toRepoPath(absPath);
    const lines = content.split(/\r?\n/);
    totalLines += lines.length;

    if (relPath.toLowerCase() === 'index.html') {
      const sizeKb = fs.statSync(absPath).size / 1024;
      if (sizeKb > 500) {
        addIssue(
          issues,
          'warning',
          relPath,
          0,
          `文件大小 ${sizeKb.toFixed(1)}KB，建议模块化拆分`,
          'architecture'
        );
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNo = i + 1;

      if (line.length > STYLE_LINE_LENGTH) {
        addIssue(
          issues,
          'warning',
          relPath,
          lineNo,
          `行长度超过 ${STYLE_LINE_LENGTH} 字符`,
          'style'
        );
      }

      if (/\bconsole\.log\s*\(/.test(line)) {
        addIssue(
          issues,
          'warning',
          relPath,
          lineNo,
          '发现 console.log，建议使用 Logger 工具',
          'logging'
        );
      }

      if (/\balert\s*\(/.test(line)) {
        addIssue(
          issues,
          'warning',
          relPath,
          lineNo,
          '发现 alert()，建议使用自定义弹窗',
          'ui'
        );
      }

      if (/\b(TODO|FIXME)\b/.test(line)) {
        addIssue(
          issues,
          'warning',
          relPath,
          lineNo,
          '发现 TODO/FIXME 标记',
          'todo'
        );
      }

      if (/\baddEventListener\s*\(/.test(line)) addEventCount++;
      if (/\bremoveEventListener\s*\(/.test(line)) removeEventCount++;
    }
  }

  if (addEventCount >= 10 && addEventCount > removeEventCount * 2) {
    addIssue(
      issues,
      'warning',
      'index.html',
      0,
      `addEventListener (${addEventCount}) 远多于 removeEventListener (${removeEventCount})，可能存在内存泄漏`,
      'memory'
    );
  }

  const levelCounter = { error: 0, warning: 0, info: 0 };
  for (const issue of issues) {
    if (levelCounter[issue.level] === undefined) levelCounter[issue.level] = 0;
    levelCounter[issue.level]++;
  }

  const categoryCounter = {};
  for (const issue of issues) {
    categoryCounter[issue.category] = (categoryCounter[issue.category] || 0) + 1;
  }

  const recommendations = [];
  if (categoryCounter.logging) {
    recommendations.push(`发现 ${categoryCounter.logging} 处 console.log，建议统一使用 Logger 工具`);
  }
  if (categoryCounter.style) {
    recommendations.push('存在较多超长行，建议拆分复杂表达式并统一格式化');
  }
  if (categoryCounter.todo) {
    recommendations.push('存在 TODO/FIXME 标记，建议按优先级建立修复计划');
  }
  if (categoryCounter.architecture) {
    recommendations.push('index.html 体积偏大，建议进一步模块化拆分');
  }

  const report = {
    summary: {
      total_files: deduped.length,
      total_lines: totalLines,
      issues: {
        error: levelCounter.error || 0,
        warning: levelCounter.warning || 0,
        info: levelCounter.info || 0
      },
      issue_rate: Number(((issues.length / Math.max(totalLines, 1)) * 100).toFixed(2))
    },
    issues,
    recommendations
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Audit report generated: ${REPORT_PATH}`);
  console.log(`Files: ${deduped.length}, Lines: ${totalLines}, Issues: ${issues.length}`);
}

main();
