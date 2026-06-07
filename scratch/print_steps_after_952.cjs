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
        if (index > 952 && index <= 1100) {
            const step = JSON.parse(line);
            if (step.tool_calls) {
                for (const call of step.tool_calls) {
                    if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content' || (call.name === 'run_command' && call.args.CommandLine.includes('git'))) {
                        console.log(`Step ${index} (${call.name}):`);
                        console.log(`  Args: ${JSON.stringify(call.args).substring(0, 300)}`);
                    }
                }
            }
        }
    }
}

run().catch(console.error);
