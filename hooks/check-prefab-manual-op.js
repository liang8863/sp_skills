#!/usr/bin/env node
/**
 * Stop Hook: 拦截「叫用户手动操作 prefab/编辑器」的回复
 *
 * 当 Claude 的回复中出现指示用户手动 Cocos Editor 操作的句子时，
 * 阻止回复并提醒使用 prefab-scene-json skill 自动化处理。
 *
 * 只匹配「祈使语气前缀 + 编辑器操作动词」的组合，
 * 并剔除 code block、表格、引用块等非正文内容，避免误触。
 */
let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
    try {
        const data = JSON.parse(input);

        // 防止无限循环
        if (data.stop_hook_active) {
            process.exit(0);
        }

        const message = data.last_assistant_message || "";
        if (!message) {
            process.exit(0);
        }

        // 剔除非正文内容：code block、行内 code、表格行、引用块
        const prose = message
            .replace(/```[\s\S]*?```/g, "")   // fenced code blocks
            .replace(/`[^`]+`/g, "")           // inline code
            .replace(/^\|.*\|$/gm, "")         // table rows
            .replace(/^>\s.*$/gm, "");         // blockquotes

        // 按行检测：「祈使语气前缀 + 手动编辑器操作」
        const instructivePrefix = "(?:你需要|接下來|接下来|請|请|記得|记得|最後|最后|然後|然后|再)";
        const editorAction = "(?:在.*(?:編輯器|编辑器|Editor|Inspector).*(?:拖|綁定|绑定|設定|设定|操作)|手動.*(?:拖|綁定|绑定).*(?:欄位|栏位|屬性|属性|prefab)|將.*拖到|将.*拖到)";
        const pattern = new RegExp(instructivePrefix + ".*" + editorAction, "i");

        if (pattern.test(prose)) {
            console.log(
                JSON.stringify({
                    decision: "block",
                    reason:
                        "⚠️ 禁止叫用户手动操作 Cocos Editor 绑定 prefab。" +
                        "必须载入 prefab-scene-json skill，用 oneoff 脚本（tools/oneoff/）自动完成 @property 绑定。" +
                        "代码能做的事，不留给人手动做。",
                }),
            );
        }
    } catch (_e) {
        process.exit(0);
    }
});
