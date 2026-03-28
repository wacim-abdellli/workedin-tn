import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface QueryErrorInfo {
    message: string;
    code?: string;
    details?: string;
    timeout?: boolean;
}

interface AdminTestResults {
    loading: boolean;
    session?: {
        email?: string;
        id?: string;
        hasSession: boolean;
        error?: string;
    };
    myProfile?: {
        data: unknown;
        error: QueryErrorInfo | null;
    };
    allProfiles?: {
        data?: Array<Record<string, unknown>> | null;
        count?: number;
        error?: QueryErrorInfo | null;
    };
    catchError?: {
        name?: string;
        message: string;
    };
}

export default function TestAdminAccess() {
    const [results, setResults] = useState<AdminTestResults>({ loading: true });
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        console.log(msg);
        setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${msg}`]);
    };

    useEffect(() => {
        async function runTests() {
            const tests: AdminTestResults = { loading: false };

            try {
                addLog('Starting tests...');
                
                // Test 1: Get session
                addLog('Test 1: Getting session...');
                const sessionStart = Date.now();
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                addLog(`Session retrieved in ${Date.now() - sessionStart}ms`);
                
                if (sessionError) {
                    addLog(`Session error: ${sessionError.message}`);
                }
                
                tests.session = {
                    email: session?.user?.email,
                    id: session?.user?.id,
                    hasSession: !!session,
                    error: sessionError?.message,
                };

                if (!session) {
                    addLog('❌ No session found - user not logged in!');
                    setResults(tests);
                    return;
                }

                // Test 2: Get own profile
                addLog('Test 2: Getting own profile...');
                const profileStart = Date.now();
                const { data: { user } } = await supabase.auth.getUser();
                const { data: myProfile, error: myError } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, is_admin')
                    .eq('id', user?.id)
                    .single();
                addLog(`Own profile retrieved in ${Date.now() - profileStart}ms`);
                
                if (myError) {
                    addLog(`Own profile error: ${myError.message}`);
                }
                
                tests.myProfile = { 
                    data: myProfile, 
                    error: myError ? { message: myError.message, code: myError.code } : null 
                };

                // Test 3: Try to fetch all profiles with timeout
                addLog('Test 3: Fetching all profiles (admin query)...');
                const allProfilesStart = Date.now();
                
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000);
                });
                
                const queryPromise = supabase
                    .from('profiles')
                    .select('id, email, full_name, is_admin')
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                try {
                    const { data: allProfiles, error: allError } = await Promise.race([
                        queryPromise,
                        timeoutPromise
                    ]);
                    
                    addLog(`All profiles query completed in ${Date.now() - allProfilesStart}ms`);
                    
                    if (allError) {
                        addLog(`All profiles error: ${allError.message} (code: ${allError.code})`);
                    } else {
                        addLog(`✅ Successfully fetched ${allProfiles?.length || 0} profiles`);
                    }
                    
                    tests.allProfiles = { 
                        data: allProfiles, 
                        count: allProfiles?.length || 0,
                        error: allError ? { message: allError.message, code: allError.code, details: allError.details } : null 
                    };
                } catch (timeoutError) {
                    const msg = timeoutError instanceof Error ? timeoutError.message : String(timeoutError);
                    addLog(`❌ Query timed out: ${msg}`);
                    tests.allProfiles = {
                        error: { message: 'Query timed out after 10 seconds', timeout: true }
                    };
                }

            } catch (error) {
                const msg = error instanceof Error ? error.message : String(error);
                addLog(`❌ Catch error: ${error instanceof Error ? error.name : 'Error'} - ${msg}`);
                tests.catchError = {
                    name: error instanceof Error ? error.name : undefined,
                    message: msg,
                };
            }

            addLog('Tests completed');
            setResults(tests);
        }

        runTests();
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
            <h1>Admin Access Test</h1>
            <h2>Direct Supabase Queries (No React Query)</h2>
            
            <div style={{ marginBottom: '20px', background: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
                <h3>Execution Log:</h3>
                {logs.map((log, i) => (
                    <div key={i} style={{ 
                        padding: '4px 0', 
                        color: log.includes('❌') ? '#fca5a5' : log.includes('✅') ? '#4ade80' : '#fff' 
                    }}>
                        {log}
                    </div>
                ))}
            </div>
            
            <pre style={{ background: '#2a2a2a', padding: '20px', borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(results, null, 2)}
            </pre>
            
            {results.allProfiles?.data && (
                <div style={{ marginTop: '20px', background: '#065f46', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ color: '#4ade80' }}>✅ SUCCESS! Found {results.allProfiles.count} profiles</h3>
                    <p>The database query works. The issue is with React Query or component lifecycle.</p>
                </div>
            )}
            {results.allProfiles?.error && (
                <div style={{ marginTop: '20px', background: '#7f1d1d', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ color: '#fca5a5' }}>❌ ERROR</h3>
                    <p>Code: {results.allProfiles.error.code}</p>
                    <p>Message: {results.allProfiles.error.message}</p>
                    {results.allProfiles.error.timeout && (
                        <p style={{ marginTop: '10px', color: '#fbbf24' }}>
                            The query is hanging. This suggests an RLS policy issue causing infinite loops or a network problem.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
