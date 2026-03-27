import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DirectQueryTest() {
    const [result, setResult] = useState<any>({ status: 'starting' });

    useEffect(() => {
        let mounted = true;
        
        async function testQuery() {
            try {
                console.log('Starting direct query test...');
                setResult({ status: 'querying', startTime: Date.now() });
                
                // Direct query with AbortController to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=id,email,full_name,is_admin&order=created_at.desc&limit=10`,
                    {
                        headers: {
                            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                        },
                        signal: controller.signal,
                    }
                );
                
                clearTimeout(timeoutId);
                
                const data = await response.json();
                const endTime = Date.now();
                
                if (mounted) {
                    setResult({
                        status: response.ok ? 'success' : 'error',
                        statusCode: response.status,
                        data: data,
                        count: Array.isArray(data) ? data.length : 0,
                        duration: endTime - result.startTime,
                    });
                }
                
                console.log('Query result:', { status: response.status, data });
                
            } catch (error: any) {
                console.error('Query error:', error);
                if (mounted) {
                    setResult({
                        status: 'error',
                        error: {
                            name: error.name,
                            message: error.message,
                        }
                    });
                }
            }
        }
        
        testQuery();
        
        return () => { mounted = false; };
    }, []);

    return (
        <div style={{ padding: '20px', fontFamily: 'monospace', background: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
            <h1>Direct REST API Query Test</h1>
            <p>Bypassing Supabase JS client entirely - using raw fetch()</p>
            
            <div style={{ marginTop: '20px', background: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
                <h3>Status: {result.status}</h3>
                {result.duration && <p>Duration: {result.duration}ms</p>}
                {result.statusCode && <p>HTTP Status: {result.statusCode}</p>}
                {result.count !== undefined && <p>Records: {result.count}</p>}
            </div>
            
            <pre style={{ marginTop: '20px', background: '#2a2a2a', padding: '20px', borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result, null, 2)}
            </pre>
            
            {result.status === 'success' && result.count > 0 && (
                <div style={{ marginTop: '20px', background: '#065f46', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ color: '#4ade80' }}>✅ SUCCESS!</h3>
                    <p>The REST API works directly. The issue is with the Supabase JS client.</p>
                    <p>This means RLS policies are fine, but the JS client has a problem.</p>
                </div>
            )}
            
            {result.status === 'error' && result.statusCode === 401 && (
                <div style={{ marginTop: '20px', background: '#7f1d1d', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ color: '#fca5a5' }}>❌ 401 Unauthorized</h3>
                    <p>RLS is blocking the query. Your account is not recognized as admin.</p>
                </div>
            )}
            
            {result.error?.name === 'AbortError' && (
                <div style={{ marginTop: '20px', background: '#7f1d1d', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ color: '#fca5a5' }}>❌ Query Timeout</h3>
                    <p>The request took longer than 5 seconds. Network or database issue.</p>
                </div>
            )}
        </div>
    );
}
