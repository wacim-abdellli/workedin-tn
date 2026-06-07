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
        if (index === 973) {
            const step = JSON.parse(line);
            console.log(`Step 973:`);
            console.log(JSON.stringify(step.tool_calls[0].args, null, 2));
            break;
        }
    }
}

run().catch(console.error);
