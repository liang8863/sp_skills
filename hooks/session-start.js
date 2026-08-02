#!/usr/bin/env node
/**
 * SessionStart Hook: 簡潔提醒
 * 提醒 Codex 繁體中文回覆、查閱 errors.md、精簡回覆
 */
const fs = require("fs");
const path = require("path");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
    try {
        const data = JSON.parse(input);
        const cwd = data.cwd || process.cwd();
        const errorsPath = path.join(cwd, ".codex", "errors.md");

        const lines = [
            "[SessionStart] Slot FE Client",
            "- 繁體中文回覆",
            "- 精簡回覆，避免冗長解釋",
        ];

        // 如果 errors.md 存在，提醒查閱
        if (fs.existsSync(errorsPath)) {
            lines.push("- 做 Bootstrap/API/Container/SlotReel 任務前先查 .codex/errors.md");
        }

        // 輸出提醒（會作為 Codex 參考提醒）
        console.log(JSON.stringify({ user_message: lines.join("\n") }));
    } catch (_e) {
        process.exit(0);
    }
});
