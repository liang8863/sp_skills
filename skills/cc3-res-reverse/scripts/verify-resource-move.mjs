#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

function readOption(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const repo = path.resolve(readOption("--repo", process.cwd()));
const baseline = readOption("--baseline");
const gameId = readOption("--game-id");

if (!baseline || !gameId) {
  console.error("Usage: verify-resource-move.mjs --repo <project> --baseline <commit> --game-id <id>");
  process.exit(2);
}

function git(args) {
  return execFileSync("git", args, { cwd: repo, encoding: "utf8" });
}

const tree = git(["ls-tree", "-r", baseline, "--", "assets/resources", "assets/prefabs"])
  .split(/\r?\n/)
  .filter(Boolean);
const destinationRoot = path.join(repo, "assets", "resources", `${gameId}_res`);
let checked = 0;
let missing = 0;
let mismatch = 0;
const examples = [];

for (const line of tree) {
  const match = line.match(/^\d+\s+blob\s+([0-9a-f]+)\t(.+)$/);
  if (!match) continue;

  const [, expectedHash, sourcePath] = match;
  let relativePath;
  if (sourcePath.startsWith("assets/prefabs/")) {
    relativePath = path.join("prefabs", sourcePath.slice("assets/prefabs/".length));
  } else if (sourcePath.startsWith("assets/resources/")) {
    relativePath = sourcePath.slice("assets/resources/".length);
  } else {
    continue;
  }

  checked += 1;
  const destination = path.join(destinationRoot, relativePath);
  if (!fs.existsSync(destination)) {
    missing += 1;
    if (examples.length < 10) examples.push({ sourcePath, destination: path.relative(repo, destination), status: "missing" });
    continue;
  }

  const actualHash = git(["hash-object", destination]).trim();
  if (actualHash !== expectedHash) {
    mismatch += 1;
    if (examples.length < 10) {
      examples.push({ sourcePath, destination: path.relative(repo, destination), expectedHash, actualHash });
    }
  }
}

const result = { baseline, gameId, checked, missing, mismatch, examples };
console.log(JSON.stringify(result, null, 2));
process.exitCode = missing === 0 && mismatch === 0 ? 0 : 1;
