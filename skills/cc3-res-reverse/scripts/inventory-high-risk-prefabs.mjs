#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const repo = path.resolve(readOption("--repo", process.cwd()));
const gameId = readOption("--game-id");
if (!gameId) {
  console.error("Usage: inventory-high-risk-prefabs.mjs --repo <project> --game-id <id>");
  process.exit(2);
}

const scriptRoot = path.join(repo, "assets", "scripts");
const resourceRoot = path.join(repo, "assets", "resources", `${gameId}_res`);
const scriptUuidToName = new Map();
for (const entry of fs.readdirSync(scriptRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".js")) continue;
  const scriptPath = path.join(scriptRoot, entry.name);
  const metaPath = `${scriptPath}.meta`;
  if (!fs.existsSync(metaPath)) continue;
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  scriptUuidToName.set(meta.uuid, entry.name.slice(0, -3));
}

function walk(directory) {
  const files = [];
  if (!fs.existsSync(directory)) return files;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(filePath));
    else if (entry.name.endsWith(".prefab")) files.push(filePath);
  }
  return files;
}

const highRisk = /(Number(Display|Roll)|NumberCurved|NumberLabel|RemainingNumber|TimedWinRoll|WinRoll|CustomNumberDisplay|FeatureBuy|BonusLoading|TotalWin|BigWin|Multiplier|Infoboard|InfoBoard|SpinButton|WaysController|SymbolAsset|SlotItemPool|AnimParticleSystem|FixedWild|WildPayout|Atlas)/;
const hits = [];
let prefabCount = 0;
let parseFailures = 0;

for (const prefabPath of walk(resourceRoot).sort()) {
  prefabCount += 1;
  let document;
  try {
    document = JSON.parse(fs.readFileSync(prefabPath, "utf8"));
  } catch (error) {
    parseFailures += 1;
    hits.push({ prefab: path.relative(repo, prefabPath).replaceAll("\\", "/"), parseError: String(error) });
    continue;
  }

  const components = Array.isArray(document) ? document : Object.values(document);
  components.forEach((component, index) => {
    if (!component || typeof component !== "object") return;
    const scriptName = scriptUuidToName.get(component.__type__);
    if (!scriptName || !highRisk.test(scriptName)) return;

    const entry = {
      prefab: path.relative(repo, prefabPath).replaceAll("\\", "/"),
      componentIndex: index,
      scriptName,
      fields: Object.keys(component).sort(),
    };
    for (const field of ["numberSprite", "numberBlurSprite", "numberSpriteAtlas", "numberBlurSpriteAtlas"]) {
      if (Array.isArray(component[field])) {
        entry[`${field}Count`] = component[field].length;
        entry[`${field}Uuids`] = component[field].map((value) => value?.__uuid__ ?? null);
      } else if (component[field] !== undefined) {
        entry[field] = component[field];
      }
    }
    for (const field of ["numberContainer", "displayController", "infoboardMessageController", "spriteMessageNode", "winText", "totalText"]) {
      if (component[field] !== undefined) entry[field] = component[field];
    }
    hits.push(entry);
  });
}

console.log(JSON.stringify({ gameId, prefabCount, parseFailures, hitCount: hits.length, hits }, null, 2));
process.exitCode = parseFailures === 0 ? 0 : 1;
