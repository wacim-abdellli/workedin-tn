const fs = require('fs');
['40000_get_client_stats.sql', '50000_get_total_unread_count.sql', '20000_category_job_counts.sql'].forEach(f => {
    let p = 'supabase/migrations/202604010' + f;
    let s = fs.readFileSync(p, 'utf8');
    // Revert what powershell or my replace broke
    s = s.replace(/\\{3}/g, '$$$$');
    s = s.replace(/\$/g, '$$$$');
    s = s.replace(/\$\$\$\$\$\$/g, '$$$$'); // if duplicated
    
    // just explicitly set the content based on what they should be
    console.log(p);
});
