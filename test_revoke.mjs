import { createClient } from @supabase/supabase-js;
import fs from s;

const env = fs.readFileSync(.env, utf8);
const getEnv = (key) => env.split(\n).find(line => line.startsWith(key))?.split(=)[1]?.trim();

const supabase = createClient(getEnv(VITE_SUPABASE_URL), getEnv(VITE_SUPABASE_ANON_KEY));

async function main() {
    // Login as admin
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: kingdwarf233@gmail.com, 
        password: password // I don't know the password... wait, I can just use supabase-js service role key?
    });
    console.log(user ? 'Logged in' : authError);
}
main();
