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
                    if (call.name === 'run_command') {
                        const cmd = call.args.CommandLine || '';
                        if (cmd.toLowerCase().includes('git')) {
                            console.log(`Step ${index}: git command -> ${cmd}`);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`Error parsing line ${index}:`, e.message);
        }
    }
}

run().catch(console.error);
