#!/usr/bin/env node
/**
 * Reference helper: update README.md's Codex skills section.
 *
 * Codex does not auto-run hooks from this directory. Run manually if the
 * `.codex/skills` inventory changes and the README section should be refreshed.
 */
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const README_PATH = path.join(ROOT, "README.md");
const SKILLS_DIR = path.join(ROOT, ".codex", "skills");

const START_MARKER = "<!-- CODEX-CONFIG-START -->";
const END_MARKER = "<!-- CODEX-CONFIG-END -->";

function main() {
  if (!fs.existsSync(README_PATH) || !fs.existsSync(SKILLS_DIR)) return;

  let readme = fs.readFileSync(README_PATH, "utf8");
  const startIdx = readme.indexOf(START_MARKER);
  const endIdx = readme.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) return;

  const skills = scanSkills(SKILLS_DIR);
  const md = generateMarkdown(skills);
  const before = readme.substring(0, startIdx + START_MARKER.length);
  const after = readme.substring(endIdx);
  readme = `${before}\n\n${md}\n\n${after}`;
  fs.writeFileSync(README_PATH, readme, "utf8");
}

function scanSkills(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const skillDir = path.join(dir, entry.name);
      const skillFile = path.join(skillDir, "SKILL.md");
      if (!fs.existsSync(skillFile)) return null;
      const fm = parseFrontmatter(fs.readFileSync(skillFile, "utf8"));
      return {
        name: fm.name || entry.name,
        description: fm.description || "",
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  let currentKey = null;
  let currentValue = "";

  for (const line of match[1].split(/\r?\n/)) {
    if (currentKey && (line.startsWith("  ") || line.startsWith("\t"))) {
      currentValue += ` ${line.trim()}`;
      fm[currentKey] = currentValue.trim();
      continue;
    }

    const kvMatch = line.match(/^(\S[\w-]*)\s*:\s*(>-?|\|-?|.*)$/);
    if (!kvMatch) continue;

    currentKey = kvMatch[1];
    const val = kvMatch[2].trim();
    if (val === ">" || val === ">-" || val === "|" || val === "|-") {
      currentValue = "";
      fm[currentKey] = "";
    } else {
      currentValue = unquoteYaml(val);
      fm[currentKey] = currentValue;
    }
  }

  return fm;
}

function unquoteYaml(value) {
  if (
    (value.startsWith("'") && value.endsWith("'")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  return value;
}

function categoryFor(name) {
  if (
    [
      "architect",
      "code-quality",
      "cocos-expert",
      "dynamic-loading",
      "services-expert",
      "slot-specialist",
      "testing-docs",
    ].includes(name)
  ) {
    return "Role Skills";
  }
  if (name.endsWith("-workflow") || name === "slot-fe-client-workflow") {
    return "Workflow Skills";
  }
  if (
    name.startsWith("hbfy-") ||
    name.startsWith("yjzr-") ||
    name.startsWith("run-msxrj-") ||
    name.startsWith("thpsj-") ||
    name.startsWith("template-") ||
    name.startsWith("ext-module-")
  ) {
    return "Scoped Project Skills";
  }
  return "Core Project Skills";
}

function generateMarkdown(skills) {
  const groups = new Map();
  for (const skill of skills) {
    const category = categoryFor(skill.name);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(skill);
  }

  let md = "";
  md += "### Codex Skills\n\n";
  md += "位置：`.codex/skills/`\n\n";
  md +=
    "Codex 會依據 skill 描述載入相關能力。Claude agents 已轉為 role skills；需要 Codex sub-agent 時，僅在用戶明確要求 delegation 或 parallel agent work 時使用。\n\n";

  for (const [category, items] of groups) {
    md += `#### ${category}\n\n`;
    md += "| Skill | 說明 |\n";
    md += "|-------|------|\n";
    for (const skill of items) {
      md += `| \`${skill.name}\` | ${skill.description.replace(/\s+/g, " ").trim()} |\n`;
    }
    md += "\n";
  }

  md +=
    "> 原 `.claude` hooks 已保留在 `.codex/hooks/` 作為參考；Codex 不會自動執行它們。";
  return md;
}

main();
