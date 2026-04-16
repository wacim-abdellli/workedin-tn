import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Check, ArrowRight, Eye, LayoutDashboard, Copy, Share2 } from 'lucide-react';

import { Header } from '../components/layout';
import { useTranslation } from '../i18n';
import { ROUTES, getClientJobProposalsRoute } from '../lib/routes';
import { useToast } from '../components/ui/Toast';

export default function JobPostSuccess() {
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId: string }>();
    const { tx } = useTranslation();
    const { showToast } = useToast();

    useEffect(() => {
        // Automatically scroll to top
        window.scrollTo(0, 0);
    }, []);

    const copyLink = () => {
        if (!jobId) return;
        const link = `${window.location.origin}/jobs/${jobId}`;
        navigator.clipboard.writeText(link);
        showToast(tx('jobs.posted.linkCopied', undefined, 'Job link copied to clipboard!'), 'success');
    };

    return (
        <div className="flex flex-col min-h-screen" style={{ background: 'var(--page-bg)' }}>
            <Header />

            <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center animate-in fade-in duration-500">
                
                {/* Visual Checkmark Centerpiece */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 rounded-full blur-3xl opacity-20 animate-pulse" 
                         style={{ background: '#10b981' }} />
                    <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-[2rem] border-2 shadow-2xl"
                         style={{ 
                             background: 'linear-gradient(135deg, color-mix(in srgb, #10b981 12%, var(--card-bg)), var(--card-bg))',
                             borderColor: 'color-mix(in srgb, #10b981 30%, transparent)'
                         }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                             style={{ background: '#10b981' }}>
                            <Check className="w-6 h-6 text-white" strokeWidth={3} />
                        </div>
                    </div>
                </div>

                {/* Main Titles */}
                <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight" 
                    style={{ color: 'var(--text-primary)' }}>
                    {tx('jobs.posted.title', undefined, 'Your job is live and ready.')}
                </h1>
                
                <p className="max-w-md text-sm sm:text-base leading-relaxed mb-10" 
                   style={{ color: 'var(--text-secondary)' }}>
                    {tx('jobs.posted.description', undefined, 'Your brief has been published successfully. Freelancers can now discover it, and proposals will start rolling in soon.')}
                </p>

                {/* Primary Actions Grid */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-12">
                    <button 
                        onClick={() => navigate(jobId ? getClientJobProposalsRoute(jobId) : ROUTES.dashboard)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-bold transition-all hover:brightness-110"
                        style={{ background: 'var(--workspace-primary)', color: '#fff', boxShadow: '0 8px 24px -8px color-mix(in srgb, var(--workspace-primary) 60%, transparent)' }}>
                        <Eye className="w-4 h-4" />
                        {tx('jobs.posted.viewJob', undefined, 'View Job / Proposals')}
                    </button>

                    <button 
                        onClick={() => navigate(ROUTES.dashboard)}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-bold border transition-all hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)', color: 'var(--text-primary)' }}>
                        <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                        {tx('jobs.posted.goToDashboard', undefined, 'Dashboard')}
                    </button>
                </div>

                {/* Sub-actions / Job Link */}
                {jobId && (
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                            {tx('jobs.posted.shareNetwork', undefined, 'Share with your network')}
                        </span>
                        <div className="flex items-center gap-2 p-1.5 pl-4 rounded-full border shadow-sm max-w-[300px] sm:max-w-sm"
                             style={{ background: 'var(--card-bg)', borderColor: 'color-mix(in srgb, var(--border) 60%, transparent)' }}>
                            <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                                {window.location.origin}/jobs/{jobId.slice(0,8)}...
                            </span>
                            <button 
                                onClick={copyLink}
                                className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:bg-emerald-500 hover:text-white"
                                style={{ background: 'color-mix(in srgb, #10b981 10%, transparent)', color: '#10b981' }}>
                                <Copy className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
