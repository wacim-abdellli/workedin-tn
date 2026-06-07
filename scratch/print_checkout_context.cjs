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
    const targetSteps = [776, 777, 778, 849, 850, 851, 950, 951, 952];
    for await (const line of rl) {
        index++;
        if (targetSteps.includes(index)) {
            const step = JSON.parse(line);
            console.log(`Step ${index} (Type: ${step.type}, Status: ${step.status}):`);
            if (step.content) {
                console.log(`  Content: ${step.content.substring(0, 500)}`);
            }
            if (step.tool_calls) {
                for (const call of step.tool_calls) {
                    console.log(`  Tool call: ${call.name}`);
                    console.log(`  Args: ${JSON.stringify(call.args).substring(0, 500)}`);
                }
            }
            if (step.tool_output) {
                console.log(`  Output: ${JSON.stringify(step.tool_output).substring(0, 300)}`);
            }
        }
    }
}

run().catch(console.error);
