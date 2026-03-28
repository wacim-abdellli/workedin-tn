import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, DollarSign, FileText, Activity, UserPlus, Shield, Flag } from 'lucide-react';
import { supabaseAnon } from '@/lib/supabase';
import { useTranslation } from '@/i18n';

async function countWithRetry(queryFn: () => PromiseLike<{ count: number | null; error: unknown }>) {
    const { count } = await Promise.race([
        queryFn(),
        new Promise<{ count: number | null; error: unknown }>((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 8000)
        )
    ]);
    return count ?? 0;
}

interface OverviewStats {
    totalUsers: number;
    activeJobs: number;
    activeContracts: number;
    totalRevenue: number;
    todaySignups: number;
    todayContracts: number;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number | string; color: string }) {
    return (
        <div className="card border-white/50 dark:border-white/12 bg-white/88 dark:bg-slate-950/65 backdrop-blur-xl shadow-[0_24px_60px_-28px_rgba(14,65,227,0.42)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center shadow-md`}><Icon className="w-6 h-6 text-white" /></div>
            </div>
            <p className="text-3xl font-bold text-foreground mt-4">{value}</p>
            <p className="text-sm text-muted">{label}</p>
        </div>
    );
}

export default function OverviewTab() {
    const { language } = useTranslation();
    const tr = (ar: string, en: string, fr?: string) => language === 'ar' ? ar : language === 'fr' ? (fr || en) : en;

    const { data: stats } = useQuery({
        queryKey: ['admin-overview-stats'],
        queryFn: async (): Promise<OverviewStats> => {
            const today = new Date().toISOString().split('T')[0];
            const [totalUsers, activeJobs, activeContracts, todaySignups, todayContracts] = await Promise.all([
                countWithRetry(() => supabaseAnon.from('profiles').select('id', { count: 'exact', head: true })),
                countWithRetry(() => supabaseAnon.from('jobs').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress'])),
                countWithRetry(() => supabaseAnon.from('contracts').select('id', { count: 'exact', head: true }).eq('status', 'active')),
                countWithRetry(() => supabaseAnon.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', today)),
                countWithRetry(() => supabaseAnon.from('contracts').select('id', { count: 'exact', head: true }).gte('created_at', today)),
            ]);
            return { totalUsers, activeJobs, activeContracts, totalRevenue: 0, todaySignups, todayContracts };
        },
        staleTime: 30000,
    });

    const s = stats || { totalUsers: 0, activeJobs: 0, activeContracts: 0, totalRevenue: 0, todaySignups: 0, todayContracts: 0 };
    const panelClass = 'card border-white/45 dark:border-white/10 bg-white/80 dark:bg-slate-950/55 backdrop-blur-xl shadow-[0_16px_45px_-24px_rgba(21,84,247,0.38)]';

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users} label={tr('إجمالي المستخدمين', 'Total users', 'Utilisateurs totaux')} value={s.totalUsers} color="bg-[#1554f7]" />
                <StatCard icon={Briefcase} label={tr('وظائف نشطة', 'Active jobs', 'Offres actives')} value={s.activeJobs} color="bg-[#0e41e3]" />
                <StatCard icon={FileText} label={tr('عقود نشطة', 'Active contracts', 'Contrats actifs')} value={s.activeContracts} color="bg-[#9333ea]" />
                <StatCard icon={DollarSign} label={tr('الإيرادات (د.ت)', 'Revenue (TND)', 'Revenus (TND)')} value={s.totalRevenue} color="bg-[#f86545]" />
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
                <div className={panelClass}>
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-500" />{tr('نشاط اليوم', 'Today activity', 'Activite du jour')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2"><UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-300" /><span className="text-emerald-800 dark:text-emerald-200 font-medium">{tr('تسجيلات جديدة', 'New signups', 'Nouvelles inscriptions')}</span></div>
                            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{s.todaySignups}</p>
                        </div>
                        <div className="p-4 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-cyan-600 dark:text-cyan-300" /><span className="text-cyan-800 dark:text-cyan-200 font-medium">{tr('عقود جديدة', 'New contracts', 'Nouveaux contrats')}</span></div>
                            <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">{s.todayContracts}</p>
                        </div>
                    </div>
                </div>
                <div className={panelClass}>
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-yellow-600" />
                        {tr('طلبات التحقق المعلقة', 'Pending verifications', 'Verifications en attente')}
                    </h3>
                    <p className="text-sm text-muted text-center py-4">{tr('لا توجد طلبات معلقة', 'No pending requests', 'Aucune demande en attente')}</p>
                </div>
            </div>
            <div className={panelClass}>
                <h3 className="font-bold text-foreground mb-4 flex items-center gap-2"><Flag className="w-5 h-5 text-red-600" />{tr('البلاغات', 'Reports', 'Signalements')}</h3>
                <p className="text-sm text-muted text-center py-6">{tr('لا توجد بلاغات حالياً', 'No reports for now', 'Aucun signalement pour le moment')}</p>
            </div>
        </div>
    );
}
