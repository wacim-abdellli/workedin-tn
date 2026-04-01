const fs = require('fs');
let code = fs.readFileSync('src/pages/ClientDashboard.tsx', 'utf8');

const oldPromiseAll = `            const [activeJobsRes, completedContractsRes, walletRes, jobsSummaryRes, notificationsRes] = await Promise.all([
                supabase.from('jobs').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .in('status', ['open', 'in_progress']),
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .eq('status', 'completed'),
                supabase.from('wallets').select('total_withdrawn').eq('user_id', userId).maybeSingle(),
                supabase.from('jobs').select('status, proposals_count').eq('client_id', userId),
                supabase.from('notifications').select('id,title,content,created_at')`;

const newPromiseAll = `            const [activeJobsRes, completedContractsRes, walletRes, proposalsWaitingReviewRes, totalProposalsRes, notificationsRes] = await Promise.all([
                supabase.from('jobs').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .in('status', ['open', 'in_progress']),
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .eq('status', 'completed'),
                supabase.from('wallets').select('total_withdrawn').eq('user_id', userId).maybeSingle(),
                supabase.from('jobs').select('id', { count: 'exact', head: true })
                    .eq('client_id', userId)
                    .eq('status', 'open')
                    .gt('proposals_count', 0),
                supabase.from('proposals').select('id, jobs!inner(client_id)', { count: 'exact', head: true })
                    .eq('jobs.client_id', userId),
                supabase.from('notifications').select('id,title,content,created_at')`;

code = code.replace(oldPromiseAll, newPromiseAll);

const oldReturn = `            const jobSummaryRows = jobsSummaryRes.data ?? [];

            return {
                activeJobs: activeJobsRes.count ?? 0,
                completedContracts: completedContractsRes.count ?? 0,
                totalSpent: Number(walletRes.data?.total_withdrawn ?? 0),
                proposalsWaitingReview: jobSummaryRows.filter((job) => job.status === 'open' && (job.proposals_count ?? 0) > 0).length,
                totalProposals: jobSummaryRows.reduce((sum, job) => sum + Number(job.proposals_count ?? 0), 0),
                unreadNotifications: notificationsRes.data ?? [],
            };`;

const newReturn = `            return {
                activeJobs: activeJobsRes.count ?? 0,
                completedContracts: completedContractsRes.count ?? 0,
                totalSpent: Number(walletRes.data?.total_withdrawn ?? 0),
                proposalsWaitingReview: proposalsWaitingReviewRes.count ?? 0,
                totalProposals: totalProposalsRes.count ?? 0,
                unreadNotifications: notificationsRes.data ?? [],
            };`;

code = code.replace(oldReturn, newReturn);
fs.writeFileSync('src/pages/ClientDashboard.tsx', code);
