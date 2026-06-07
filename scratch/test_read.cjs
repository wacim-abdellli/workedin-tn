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
            if (step.tool_calls && step.tool_calls.length > 0) {
                console.log(`Step ${index} tool_calls[0]:`, step.tool_calls[0]);
                if (index > 100) break; // only print a few
            }
        } catch (e) {
            console.error(e);
        }
    }
}
run();
