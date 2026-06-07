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
        if (index === 19 || index === 20) {
            const step = JSON.parse(line);
            console.log(`Step ${index} (Type: ${step.type}, Status: ${step.status}):`);
            if (step.content) {
                console.log(`  Content: ${step.content}`);
            }
            if (step.tool_calls) {
                console.log(`  Tool: ${JSON.stringify(step.tool_calls)}`);
            }
            if (step.tool_output) {
                console.log(`  Output: ${JSON.stringify(step.tool_output)}`);
            }
        }
    }
}

run().catch(console.error);
