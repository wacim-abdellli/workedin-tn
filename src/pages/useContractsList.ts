import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceStore } from '@/lib/workspaceState';
import { supabase } from '@/lib/supabase';
import { canRetryWithLegacySelect, normalizeStatus } from './contractsListUtils';
import type { ContractRow, ContractRowRaw, JobRecord, PartnerRecord } from './contractsListUtils';

export function useContractsList() {
    const { user } = useAuth();
    const { activeWorkspace } = useWorkspaceStore();
    const isFreelancerWorkspace = activeWorkspace !== 'client';

    const { data: contracts = [], isLoading, error } = useQuery({
        queryKey: ['contracts-list-v2', user?.id, isFreelancerWorkspace],
        queryFn: async () => {
            if (!user?.id) return [] as ContractRow[];

            const withWorkspaceScope = <T,>(query: T): T => {
                const typedQuery = query as { eq: (column: string, value: string) => unknown };
                return (isFreelancerWorkspace
                    ? typedQuery.eq('freelancer_id', user.id)
                    : typedQuery.eq('client_id', user.id)) as T;
            };

            const primaryQuery = supabase
                .from('contracts')
                .select('id, job_id, title, status, amount, total_amount, created_at, client_id, freelancer_id')
                .order('created_at', { ascending: false });

            const scopedPrimaryQuery = withWorkspaceScope(primaryQuery);
            const primaryResult = await scopedPrimaryQuery;

            let baseRows = (primaryResult.data ?? []) as ContractRowRaw[];
            let baseError = primaryResult.error;

            if (baseError && baseError.code !== 'PGRST116' && canRetryWithLegacySelect(baseError)) {
                const legacyQuery = supabase
                    .from('contracts')
                    .select('id, job_id, status, amount, created_at, client_id, freelancer_id')
                    .order('created_at', { ascending: false });

                const scopedLegacyQuery = withWorkspaceScope(legacyQuery);
                const legacyResult = await scopedLegacyQuery;
                baseRows = (legacyResult.data ?? []) as ContractRowRaw[];
                baseError = legacyResult.error;
            }

            if (baseError && baseError.code !== 'PGRST116' && canRetryWithLegacySelect(baseError)) {
                const minimalQuery = supabase
                    .from('contracts')
                    .select('id, status, amount, created_at, client_id, freelancer_id')
                    .order('created_at', { ascending: false });

                const scopedMinimalQuery = withWorkspaceScope(minimalQuery);
                const minimalResult = await scopedMinimalQuery;
                baseRows = (minimalResult.data ?? []) as ContractRowRaw[];
                baseError = minimalResult.error;
            }

            if (baseError && baseError.code !== 'PGRST116') {
                console.warn('[ContractsList] contracts query failed', baseError);
                return [] as ContractRow[];
            }

            if (baseRows.length === 0) return [] as ContractRow[];

            const jobIds = [...new Set(baseRows.map((row) => row.job_id).filter(Boolean))] as string[];
            const partnerIds = [...new Set(baseRows.flatMap((row) => [row.client_id, row.freelancer_id]).filter(Boolean))] as string[];

            const jobsById = new Map<string, JobRecord>();
            const profilesById = new Map<string, PartnerRecord>();

            if (jobIds.length > 0) {
                const { data: jobsData, error: jobsError } = await supabase
                    .from('jobs')
                    .select('id, title, job_type, budget_min, budget_max, hourly_rate')
                    .in('id', jobIds);

                if (jobsError) {
                    console.warn('[ContractsList] job hydration failed', jobsError);
                } else {
                    (jobsData ?? []).forEach((job) => {
                        const row = job as JobRecord;
                        jobsById.set(row.id, row);
                    });
                }
            }

            if (partnerIds.length > 0) {
                const { data: publicProfilesData, error: publicProfilesError } = await supabase
                    .from('public_profiles')
                    .select('id, full_name, avatar_url')
                    .in('id', partnerIds);

                if (!publicProfilesError) {
                    (publicProfilesData ?? []).forEach((profile) => {
                        const row = profile as PartnerRecord;
                        profilesById.set(row.id, row);
                    });
                } else {
                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, full_name, avatar_url')
                        .in('id', partnerIds);

                    if (profilesError) {
                        console.warn('[ContractsList] profile hydration failed', profilesError);
                    } else {
                        (profilesData ?? []).forEach((profile) => {
                            const row = profile as PartnerRecord;
                            profilesById.set(row.id, row);
                        });
                    }
                }
            }

            return baseRows.map((raw) => ({
                id: raw.id,
                title: raw.title,
                createdAt: raw.created_at,
                status: normalizeStatus(raw.status),
                amount: raw.amount ?? 0,
                totalAmount: raw.total_amount ?? raw.amount ?? 0,
                client: profilesById.get(raw.client_id) ?? null,
                freelancer: profilesById.get(raw.freelancer_id) ?? null,
                job: raw.job_id ? (jobsById.get(raw.job_id) ?? null) : null,
            } as ContractRow));
        },
        enabled: !!user?.id,
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    return { contracts, isLoading, error, isFreelancerWorkspace };
}
