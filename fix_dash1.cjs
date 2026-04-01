const fs = require('fs');
let code = fs.readFileSync('src/pages/FreelancerDashboard.tsx', 'utf8');

const oldPromiseAll = `            const [contractsCountRes, contractRowsRes, proposalsRes, walletRes, viewsRes, notificationsRes, recentProposalsRes, activeContractsListRes] = await Promise.all([
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'active'),
                supabase.from('contracts').select('id')
                    .eq('freelancer_id', userId)
                    .eq('status', 'active'),
                supabase.from('proposals').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'pending'),`;

const newPromiseAll = `            const [contractsCountRes, proposalsRes, walletRes, viewsRes, notificationsRes, recentProposalsRes, activeContractsListRes] = await Promise.all([
                supabase.from('contracts').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'active'),
                supabase.from('proposals').select('id', { count: 'exact', head: true })
                    .eq('freelancer_id', userId)
                    .eq('status', 'pending'),`;

code = code.replace(oldPromiseAll, newPromiseAll);

const oldMilestoneLogic = `            const contractIds = (contractRowsRes.data ?? []).map((contract) => contract.id);

            const milestonesRes = contractIds.length > 0
                ? await supabase.from('milestones')
                    .select('id,description,due_date,amount,status,contract_id')
                    .in('contract_id', contractIds)
                    .eq('status', 'pending')
                    .order('due_date', { ascending: true })
                    .limit(4)
                : { data: [] as DashboardMilestone[] };`;

const newMilestoneLogic = `            const milestonesRes = await supabase.from('milestones')
                .select('id,description,due_date,amount,status,contract_id,contracts!inner(freelancer_id, status)')
                .eq('contracts.freelancer_id', userId)
                .eq('contracts.status', 'active')
                .eq('status', 'pending')
                .order('due_date', { ascending: true })
                .limit(4);`;

code = code.replace(oldMilestoneLogic, newMilestoneLogic);
fs.writeFileSync('src/pages/FreelancerDashboard.tsx', code);
