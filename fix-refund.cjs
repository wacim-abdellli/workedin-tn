const fs = require('fs');

let c = fs.readFileSync('src/pages/JobDetail.tsx', 'utf8');

c = c.replace(
    /onSuccess: \(\) => \{\n\s*\/\/ Refund connects\n\s*if \(user\?\.id && myProposal\?\.id\) \{\n\s*refundConnects\(user\.id, myProposal\.id\);\n\s*\}/,
    `onSuccess: async () => {
            // Refund connects atomically to ensure balance is intact
            if (user?.id && myProposal?.id) {
                await refundConnects(user.id, myProposal.id);
            }`
);

fs.writeFileSync('src/pages/JobDetail.tsx', c);
console.log('Fixed connects refund by making it awaited');