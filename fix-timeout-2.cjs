const fs = require('fs');
let c = fs.readFileSync('src/services/jobs.ts', 'utf8');

c = c.replace(
/export async function getSimilarJobs\(jobId: string, category: string, limit = 3\) \{[\s\S]*?\.limit\(limit\);\n\}/,
`export async function getSimilarJobs(jobId: string, category: string, limit = 3) {
    const fetchPromise = () => supabase
        .from('jobs')
        .select('*')
        .eq('category', category)
        .eq('status', 'open')
        .neq('id', jobId)
        .limit(limit);

    const timeout = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('getSimilarJobs timed out after 8s')), 8000)
    );

    try {
        return await Promise.race([fetchPromise(), timeout]);
    } catch (err) {
        console.error('[getSimilarJobs] fatal:', err);
        return { data: [], error: err };
    }
}`
);

fs.writeFileSync('src/services/jobs.ts', c);
console.log('Fixed getSimilarJobs');