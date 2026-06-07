const fs = require('fs');
const readline = require('readline');

async function run() {
    const logPath = 'C:\\Users\\pc\\.gemini\\antigravity\\brain\\8b9209ae-472f-4adc-b1ce-8c3ea91127d6\\.system_generated\\logs\\transcript.jsonl';
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let index = 0;
    for await (const line of rl) {
        index++;
        try {
            const step = JSON.parse(line);
            if (step.tool_calls) {
                for (const call of step.tool_calls) {
                    if (call.name === 'view_file') {
                        const absPath = call.args.AbsolutePath || '';
                        if (absPath.includes('Messages.tsx')) {
                            console.log(`Step ${index} (view_file): StartLine=${call.args.StartLine}, EndLine=${call.args.EndLine}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
}

run().catch(console.error);
