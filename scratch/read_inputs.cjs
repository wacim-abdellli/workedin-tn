const fs = require('fs');

const logPath = 'C:/Users/pc/.gemini/antigravity/brain/b2b71ccc-2af3-4280-ab8a-9426300276fe/.system_generated/logs/transcript.jsonl';
const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('=== EDITS TO MESSAGES / CHATSECTION ===');
lines.forEach((line) => {
    if (!line.trim()) return;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            obj.tool_calls.forEach((tc) => {
                if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
                    const args = typeof tc.args === 'string' ? JSON.parse(tc.args) : tc.args;
                    const file = args.TargetFile || args.AbsolutePath;
                    if (file && (file.includes('Messages.tsx') || file.includes('ChatSection.tsx'))) {
                        console.log(`[Step ${obj.step_index}] Tool: ${tc.name} | File: ${file}`);
                        console.log(`  Desc: ${args.Description || args.Instruction}`);
                    }
                }
            });
        }
    } catch (err) {}
});
