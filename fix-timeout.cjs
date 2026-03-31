const fs = require('fs');

let c = fs.readFileSync('src/services/jobs.ts', 'utf8');

c = c.replace(
/export async function getJobById\(jobId: string\) \{[\s\S]*?\.single\(\);\n\}/,
`export async function getJobById(jobId: string) {
    const fetchPromise = () => supabaseAnon
        .from('jobs')
        .select('*, client:profiles!jobs_client_id_fkey(id, full_name, email, avatar_url, location, created_at)')
        .eq('id', jobId)
        .single();
    
    const timeout = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('getJobById timed out after 8s')), 8000)
    );

    try {
        return await Promise.race([fetchPromise(), timeout]);
    } catch (err) {
        console.error('[getJobById] fatal:', err);
        return { data: null, error: err };
    }
}`
);

c = c.replace(
/export async function getJobsByClient\(clientId: string\) \{\n    return supabase\n        \.from\('jobs'\)\n        \.select\('\*'\)\n        \.eq\('client_id', clientId\)\n        \.order\('created_at', \{ ascending: false \}\);\n\}/,
`export async function getJobsByClient(clientId: string) {
    const fetchPromise = () => supabase
        .from('jobs')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    const timeout = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('getJobsByClient timed out after 8s')), 8000)
    );

    try {
        return await Promise.race([fetchPromise(), timeout]);
    } catch (err) {
        console.error('[getJobsByClient] fatal:', err);
        return { data: [], error: err };
    }
}`
);

c = c.replace(
/export async function getSimilarJobs\(jobId: string, category: string, limit = 3\) \{\n    return supabase\n        \.from\('jobs'\)\n        \.select\('\*'\)\n        \.eq\('category', category\)\n        \.eq\('status', 'open'\)\n        \.neq\('id', jobId\)\n        \.limit\('limit'\);\n\}/,
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
console.log('Fixed services/jobs timeouts');
