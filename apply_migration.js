const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function applyMigration() {
    try {
        const sql = fs.readFileSync('./supabase/migrations/20260403000000_fix_notifications_insert_policy.sql', 'utf-8');
        
        console.log('📝 Running migration...');
        const { error } = await supabase.rpc('exec_sql', { sql_text: sql });
        
        if (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
        
        console.log('✅ Migration applied successfully!');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

applyMigration();
