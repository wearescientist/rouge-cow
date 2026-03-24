const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const generatedRoot = path.join(projectRoot, 'generated_assets');
const metaRoot = path.join(generatedRoot, 'monster_behavior_preview', 'metadata');
const curatedRoot = path.join(generatedRoot, 'monster_walk_curated');
const args = process.argv.slice(2);

function readArg(name, fallback) {
  const prefix = `${name}=`;
  const found = args.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const sourceBaseRoot = path.resolve(readArg('--source-root', projectRoot));
const sourceMetaRoot = path.resolve(readArg('--source-meta-root', metaRoot));

const editorDataPath = path.join(sourceMetaRoot, 'behavior-editor-data.json');
const editsPath = path.join(sourceMetaRoot, 'behavior-edits.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function writeJs(filePath, globalName, value) {
  fs.writeFileSync(filePath, `window.${globalName} = ${JSON.stringify(value, null, 2)};`, 'utf8');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function cleanDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function pickPositions(total, variantId) {
  const explicitSelections = {
    bat__monsters_v2_sheet: [1, 3, 5, 7],
    bat__monsters_v9_sheet: [1, 3, 5, 7],
    bee__monsters_v6_sheet: [1, 3, 5, 7],
    chick__monsters_v6_sheet: [1, 3, 5, 7],
    crab__monsters_v2_sheet: [1, 4, 7, 10],
    crab__monsters_v6_sheet: [1, 3, 5, 7],
    crab__monsters_v8_sheet: [1, 3, 5, 7],
    fox__monsters_v2_sheet: [1, 3, 5, 7],
    fox__monsters_v6_sheet: [1, 3, 5, 7],
    fox__monsters_v7_sheet: [1, 3, 5, 7],
    fox__monsters_v10_sheet: [1, 3, 5, 7],
    ghost__monsters_v2_sheet: [1, 3, 5, 7],
    goose__monsters_v6_sheet: [1, 2, 3, 4],
    mimic__monsters_v5_sheet: [1, 3, 6, 8],
    mother__monsters_v2_sheet: [1, 3, 5, 7],
    pigeon__monsters_v2_sheet: [1, 3, 5, 7],
    pigeon__monsters_v4_sheet: [1, 3, 5, 7],
    rabbit2__monsters_v2_sheet: [1, 3, 5, 7],
    rabbit2__monsters_v4_sheet: [1, 3, 5, 7],
    rabbit2__monsters_v6_sheet: [1, 3, 5, 7],
    rabbit2__monsters_v8_sheet: [1, 3, 5, 7],
    rabbit2__monsters_v10_sheet: [1, 3, 5, 7],
    snail__monsters_v1_sheet: [1, 3, 5, 7],
    snail__monsters_v2_sheet: [1, 3, 5, 7],
    snail__monsters_v4_sheet: [1, 3, 5, 7],
    snail__monsters_v7_sheet: [1, 3, 5, 7],
    snail__monsters_v8_sheet: [1, 3, 5, 7],
    snail__monsters_v10_sheet: [1, 2, 3, 4],
    snake__monsters_v2_sheet: [1, 3, 5, 7],
    snake__monsters_v3_sheet: [1, 3, 5, 7],
    snake__monsters_v4_sheet: [1, 3, 5, 7],
    snake__monsters_v7_sheet: [1, 4, 7, 10],
    snake__monsters_v8_sheet: [1, 3, 5, 7],
    snake__monsters_v10_sheet: [1, 3, 5, 7],
    tiaotiao__monsters_v2_sheet: [1, 2, 4, 5],
    tiaotiao__monsters_v6_sheet: [1, 2, 4, 5],
    tiaotiao__monsters_v8_sheet: [1, 2, 4, 5],
    wolf_king__monsters_v1_sheet: [1, 3, 5, 7],
    wolf_king__monsters_v2_sheet: [1, 2, 4, 5],
    wolf_king__monsters_v4_sheet: [1, 3, 5, 7],
    wolf_king__monsters_v6_sheet: [1, 3, 5, 7],
    yinya__monsters_v1_sheet: [1, 3, 5, 7],
    yinya__monsters_v2_sheet: [1, 3, 5, 7],
    yinya__monsters_v4_sheet: [1, 3, 5, 7],
    yinya__monsters_v6_sheet: [1, 3, 5, 7],
    yinya__monsters_v7_sheet: [1, 3, 5, 7],
    yinya__monsters_v8_sheet: [1, 3, 5, 7],
  };
  if (total <= 4) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (!explicitSelections[variantId]) {
    throw new Error(`Missing explicit walk selection for ${variantId} (${total} active frames)`);
  }
  return explicitSelections[variantId].filter((n) => n >= 1 && n <= total);
}

function relToAbs(relPath) {
  return path.join(sourceBaseRoot, relPath.replaceAll('/', path.sep));
}

function absToRel(absPath) {
  return path.relative(projectRoot, absPath).replaceAll(path.sep, '/');
}

function copyFile(srcRel, destAbs) {
  ensureDir(path.dirname(destAbs));
  fs.copyFileSync(relToAbs(srcRel), destAbs);
}

function buildCurated() {
  const editorData = readJson(editorDataPath);
  const edits = readJson(editsPath);
  const walkEditMap = new Map(
    edits.behaviors
      .filter((item) => item && item.behaviorName === 'walk')
      .map((item) => [item.variantId, item])
  );

  cleanDir(curatedRoot);

  const curatedEditorData = [];
  const curatedEdits = {
    exportedAt: new Date().toISOString(),
    source: 'generated_assets/monster_behavior_preview/metadata/behavior-editor-data.json',
    behaviors: [],
  };
  const summary = [];

  for (const variant of editorData) {
    const walkBehavior = Array.isArray(variant.behaviors)
      ? variant.behaviors.find((item) => item.name === 'walk')
      : null;
    const edit = walkEditMap.get(variant.variantId);
    if (!walkBehavior || !edit) {
      continue;
    }

    const activeFrames = edit.frames.filter((frame) => !frame.deleted);
    if (!activeFrames.length) {
      continue;
    }

    const chosenPositions = pickPositions(activeFrames.length, variant.variantId);
    const pickedFrames = chosenPositions.map((position) => activeFrames[position - 1]).filter(Boolean);
    const variantWalkRoot = path.join(curatedRoot, variant.category, variant.monster, variant.version, 'walk');
    const curatedRelPaths = [];

    pickedFrames.forEach((frame, index) => {
      const destAbs = path.join(variantWalkRoot, `f${String(index + 1).padStart(2, '0')}.png`);
      copyFile(frame.src, destAbs);
      curatedRelPaths.push(absToRel(destAbs));
    });

    curatedEditorData.push({
      variantId: variant.variantId,
      category: variant.category,
      monster: variant.monster,
      version: variant.version,
      sourceKey: variant.sourceKey,
      layout: `1x${curatedRelPaths.length}`,
      rowMeans: variant.rowMeans,
      sourceFrames: curatedRelPaths,
      behaviors: [
        {
          name: 'walk',
          label: 'Walk',
          delayMs: walkBehavior.delayMs || edit.delayMs || 240,
          frameCount: curatedRelPaths.length,
          width: walkBehavior.width,
          height: walkBehavior.height,
          sourceFrameIndexes: curatedRelPaths.map((_, index) => index + 1),
          frames: curatedRelPaths,
        },
      ],
    });

    curatedEdits.behaviors.push({
      behaviorKey: `${variant.variantId}::walk`,
      variantId: variant.variantId,
      category: variant.category,
      monster: variant.monster,
      version: variant.version,
      sourceKey: variant.sourceKey,
      behaviorName: 'walk',
      behaviorLabel: 'Walk',
      delayMs: edit.delayMs || walkBehavior.delayMs || 240,
      loopMode: 'ping_pong',
      frames: curatedRelPaths.map((src, index) => ({
        sourceIndex: index + 1,
        src,
        flipX: false,
        deleted: false,
      })),
    });

    summary.push({
      variantId: variant.variantId,
      monster: variant.monster,
      version: variant.version,
      category: variant.category,
      originalActiveCount: activeFrames.length,
      keptCount: curatedRelPaths.length,
      keptOriginalOrder: chosenPositions,
      originalSourceIndexes: pickedFrames.map((frame) => frame.sourceIndex),
      curatedFrames: curatedRelPaths,
    });
  }

  writeJson(path.join(metaRoot, 'behavior-editor-data.json'), curatedEditorData);
  writeJs(path.join(metaRoot, 'behavior-editor-data.js'), 'MONSTER_BEHAVIOR_EDITOR_DATA', curatedEditorData);
  writeJson(path.join(metaRoot, 'behavior-edits.json'), curatedEdits);
  writeJs(path.join(metaRoot, 'behavior-edits.js'), 'MONSTER_BEHAVIOR_EDITS', curatedEdits);

  const reportDir = path.join(projectRoot, 'reports', 'walk_review');
  ensureDir(reportDir);
  writeJson(path.join(reportDir, 'walk_curation_summary.json'), summary);
}

function cleanupGeneratedAssets() {
  const keepPaths = new Set([
    path.join(generatedRoot, 'monster_behavior_preview'),
    path.join(metaRoot, 'behavior-editor-data.json'),
    path.join(metaRoot, 'behavior-editor-data.js'),
    path.join(metaRoot, 'behavior-edits.json'),
    path.join(metaRoot, 'behavior-edits.js'),
    curatedRoot,
  ]);

  const topEntries = fs.readdirSync(generatedRoot, { withFileTypes: true });
  for (const entry of topEntries) {
    const fullPath = path.join(generatedRoot, entry.name);
    if (fullPath === path.join(generatedRoot, 'monster_behavior_preview')) {
      const previewEntries = fs.readdirSync(fullPath, { withFileTypes: true });
      for (const previewEntry of previewEntries) {
        const previewPath = path.join(fullPath, previewEntry.name);
        if (previewEntry.name !== 'metadata') {
          fs.rmSync(previewPath, { recursive: true, force: true });
        }
      }
      const metaEntries = fs.readdirSync(metaRoot, { withFileTypes: true });
      for (const metaEntry of metaEntries) {
        const metaPath = path.join(metaRoot, metaEntry.name);
        if (!keepPaths.has(metaPath)) {
          fs.rmSync(metaPath, { recursive: true, force: true });
        }
      }
      continue;
    }
    if (!keepPaths.has(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    }
  }
}

buildCurated();
cleanupGeneratedAssets();
console.log('monster walk curation complete');
