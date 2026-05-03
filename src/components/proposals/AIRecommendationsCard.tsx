import { Sparkles, AlertCircle, CheckCircle, Info, TrendingUp, Users, Clock, Target } from 'lucide-react';
import type { AIRecommendations, RecommendationInsight } from '../../services/aiRecommendations';

interface AIRecommendationsCardProps {
    recommendations?: AIRecommendations | null;
    isLoading?: boolean;
}

export default function AIRecommendationsCard({ recommendations, isLoading = false }: AIRecommendationsCardProps) {
    if (isLoading || !recommendations) {
        return (
            <div className="rounded-xl p-6 relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent">
                <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl opacity-20 bg-amber-500" />
                <div className="relative animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
                        <div className="flex-1">
                            <div className="h-5 bg-white/10 rounded w-1/2 mb-1"></div>
                            <div className="h-3 bg-white/10 rounded w-1/3"></div>
                        </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded w-full"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-white/10 rounded"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    const getInsightIcon = (severity: string) => {
        switch (severity) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-amber-400" />;
            default:
                return <Info className="w-5 h-5 text-blue-400" />;
        }
    };

    const getScoreBadgeColor = (score: number) => {
        if (score >= 75) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (score >= 50) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    };

    return (
        <div className="rounded-xl p-6 relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent space-y-5">
            {/* Header with gradient */}
            <div aria-hidden className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full blur-3xl opacity-20 bg-amber-500" />
            
            <div className="relative">
                {/* Title Section */}
                <div className="flex items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/20">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">AI Recommendations</h3>
                            <p className="text-xs text-white/40">Smart insights to improve your job</p>
                        </div>
                    </div>
                    <div className={`rounded-lg border px-3 py-1.5 flex items-center gap-2 ${getScoreBadgeColor(recommendations.opportunityScore)}`}>
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-bold">{recommendations.opportunityScore}%</span>
                    </div>
                </div>

                {/* Key Metrics Row */}
                {recommendations.averageResponseTime && (
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/40 mb-1">Avg Response</p>
                            <p className="text-sm font-bold text-white">{Math.round(recommendations.averageResponseTime)}h</p>
                        </div>
                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-white/40 mb-1">Top Matches</p>
                            <p className="text-sm font-bold text-white">{recommendations.freelancerMatches.length}</p>
                        </div>
                        {recommendations.budgetBenchmark && (
                            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wide text-white/40 mb-1">Percentile</p>
                                <p className="text-sm font-bold text-white">{recommendations.budgetBenchmark.positionPercentile}%</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Budget Analysis if available */}
                {recommendations.budgetBenchmark && (
                    <div className="mb-5 p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-white/60">Budget Positioning</p>
                            <p className="text-xs font-bold text-amber-400">{recommendations.budgetBenchmark.positionPercentile}th percentile</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                                    style={{ width: `${recommendations.budgetBenchmark.positionPercentile}%` }}
                                ></div>
                            </div>
                            <p className="text-xs font-bold text-white/70">
                                Avg: {recommendations.budgetBenchmark.avgBudget}
                            </p>
                        </div>
                    </div>
                )}

                {/* Insights */}
                <div className="space-y-3">
                    {recommendations.insights.length > 0 ? (
                        recommendations.insights.map((insight, idx) => (
                            <InsightCard key={idx} insight={insight} getIcon={getInsightIcon} />
                        ))
                    ) : (
                        <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-center">
                            <p className="text-sm text-white/60">No specific insights at this time. Keep monitoring proposals!</p>
                        </div>
                    )}
                </div>

                {/* Top Freelancers Preview */}
                {recommendations.freelancerMatches.length > 0 && (
                    <div className="mt-5 pt-5 border-t border-white/10">
                        <p className="text-xs font-bold uppercase tracking-wide text-white/60 mb-3">Top Matches</p>
                        <div className="space-y-2">
                            {recommendations.freelancerMatches.slice(0, 2).map((proposal, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {proposal.freelancer.avatar_url && (
                                            <img
                                                src={proposal.freelancer.avatar_url}
                                                alt={proposal.freelancer.full_name}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{proposal.freelancer.full_name}</p>
                                            <p className="text-xs text-white/50 truncate">{proposal.freelancer.title || 'Freelancer'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-amber-400">{proposal.freelancer.success_rate}%</p>
                                            <p className="text-[10px] text-white/40">{proposal.freelancer.jobs_completed} jobs</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-5 pt-5 border-t border-white/10">
                    <p className="text-xs text-white/50 text-center mb-3">
                        💡 Tip: Use these insights to refine your job or decide between candidates
                    </p>
                </div>
            </div>
        </div>
    );
}

function InsightCard({
    insight,
    getIcon,
}: {
    insight: RecommendationInsight;
    getIcon: (severity: string) => React.ReactNode;
}) {
    return (
        <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
            <div className="flex items-start gap-3">
                <div className="mt-1">{getIcon(insight.severity)}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{insight.title}</p>
                    <p className="text-xs text-white/60 mt-1">{insight.description}</p>
                    {insight.action && (
                        <button
                            onClick={insight.action.callback}
                            className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                        >
                            {insight.action.label} →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
