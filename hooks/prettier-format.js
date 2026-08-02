#!/usr/bin/env node
/**
 * PostToolUse Hook: 自動 prettier 格式化
 * 當 Edit/Write 工具修改 .ts 檔案後，自動執行 prettier --write
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
    try {
        const data = JSON.parse(input);
        const filePath = data.tool_input?.file_path;

        // 只處理 .ts 檔案
        if (!filePath || !filePath.endsWith(".ts")) {
            process.exit(0);
        }

        // 確認檔案存在
        if (!fs.existsSync(filePath)) {
            process.exit(0);
        }

        // 向上尋找包含 .prettierrc.js 的專案根目錄
        let dir = path.dirname(filePath);
        let projectRoot = null;
        while (dir !== path.dirname(dir)) {
            if (fs.existsSync(path.join(dir, ".prettierrc.js"))) {
                projectRoot = dir;
                break;
            }
            dir = path.dirname(dir);
        }

        if (!projectRoot) {
            // 找不到 .prettierrc.js，跳過
            process.exit(0);
        }

        // 執行 prettier
        execSync(`npx prettier --write "${filePath}"`, {
            cwd: projectRoot,
            stdio: "pipe",
            timeout: 15000,
        });
    } catch (_e) {
        // prettier 失敗不應該阻斷工作流
        process.exit(0);
    }
});
