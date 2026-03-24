const fs = require('fs');
const path = require('path');
const vm = require('vm');

const projectRoot = path.resolve(__dirname, '..');
const indexPath = path.join(projectRoot, 'index.html');

const html = fs.readFileSync(indexPath, 'utf8');
const scriptMatches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];

if (scriptMatches.length === 0) {
    throw new Error('index.html 中未找到内联 <script> 块');
}

let checked = 0;

for (const match of scriptMatches) {
    const source = match[1];
    const trimmed = source.trim();
    if (!trimmed) continue;

    const looksLikeJs =
        /(?:class\s+\w+|function\s+\w+|=>|const\s+\w+|let\s+\w+|var\s+\w+|window\.|document\.)/.test(trimmed);

    if (!looksLikeJs) continue;

    new vm.Script(trimmed, { filename: `inline-script-${checked + 1}.js` });
    checked += 1;
}

console.log(`[verify-runtime-syntax] checked ${checked} inline script blocks`);
