import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Eye, LayoutDashboard, Copy, Share2, Sparkles, PartyPopper } from 'lucide-react';

import { Header } from '../components/layout';
import { useTranslation } from '../i18n';
import { ROUTES, getClientJobProposalsRoute } from '../lib/routes';
import { useToast } from '../components/ui/Toast';

export default function JobPostSuccess() {
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId: string }>();
    const { tx } = useTranslation();
    const { showToast } = useToast();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Automatically scroll to top
        window.scrollTo(0, 0);
    }, []);

    const copyLink = () => {
        if (!jobId) return;
        const link = `${window.location.origin}/jobs/${jobId}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        showToast(tx('jobs.posted.linkCopied', undefined, 'Job link copied to clipboard!'), 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col min-h-screen relative overflow-hidden" style={{ background: 'var(--page-bg)' }}>
            {/* Background effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] opacity-[0.15] pointer-events-none"
                 style={{ background: 'radial-gradient(circle at top, var(--workspace-primary) 0%, transparent 60%)', filter: 'blur(70px)' }} />
            
            <Header />

            <main className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-6 sm:p-10 text-center relative z-10 animate-in slide-in-from-bottom-8 fade-in flex-grow duration-700 ease-out">
                
                {/* Visual Checkmark Centerpiece */}
                <div className="relative mb-10 group mt-8 sm:mt-0">
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 animate-pulse" 
                         style={{ background: '#10b981' }} />
                    <div className="relative flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-[2.5rem] border-2 shadow-2xl overflow-hidden backdrop-blur-xl transition-transform duration-500 hover:scale-[1.02]"
                         style={{ 
                             background: 'linear-gradient(135deg, color-mix(in srgb, #10b981 15%, transparent), color-mix(in srgb, #10b981 2%, transparent))',
                             borderColor: 'color-mix(in srgb, #10b981 40%, transparent)'
                         }}>
                        
                        <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg relative z-10"
                             style={{ background: 'linear-gradient(135deg, #34d399, #10b981)' }}>
                            <Check className="w-7 h-7 text-white" strokeWidth={3.5} />
                        </div>
                    </div>
                    {/* Floating elements */}
                    <PartyPopper className="absolute -top-6 -right-6 w-9 h-9 text-amber-500 opacity-80 animate-bounce" style={{ animationDelay: '200ms', animationDuration: '2s' }} />
                    <Sparkles className="absolute -bottom-3 -left-8 w-11 h-11 text-emerald-400 opacity-60 animate-bounce" style={{ animationDelay: '700ms', animationDuration: '2.5s' }} />
                </div>

                {/* Main Titles */}
                <h1 className="text-4xl sm:text-5xl font-black mb-5 tracking-tight leading-tight" 
                    style={{ color: 'var(--text-primary)' }}>
                    {tx('jobs.posted.title', undefined, 'Your job is live and ready.')}
                </h1>
                
                <p className="max-w-md text-base sm:text-lg leading-relaxed mb-12" 
                   style={{ color: 'var(--text-secondary)' }}>
                    {tx('jobs.posted.description', undefined, 'Your brief has been published successfully. Freelancers can now discover it, and proposals will start rolling in soon.')}
                </p>

                {/* Primary Actions Grid */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mb-14">
                    <button 
                        onClick={() => navigate(jobId ? getClientJobProposalsRoute(jobId) : ROUTES.dashboard)}
                        className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
                        style={{ 
                            background: 'linear-gradient(135deg, var(--workspace-primary), color-mix(in srgb, var(--workspace-primary) 80%, black))', 
                            color: var(--color-text-primary), 
                            boxShadow: '0 12px 32px -8px color-mix(in srgb, var(--workspace-primary) 60%, transparent)' 
                        }}>
                        <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <Eye className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">{tx('jobs.posted.viewJob', undefined, 'View Job / Proposals')}</span>
                    </button>

                    <button 
                        onClick={() => navigate(ROUTES.dashboard)}
                        className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 font-bold transition-all hover:scale-[1.02] active:scale-[0.98] hover:bg-black/5 dark:hover:bg-white/5 border-2"
                        style={{ borderColor: 'color-mix(in srgb, var(--border) 80%, transparent)', color: 'var(--text-primary)' }}>
                        <LayoutDashboard className="w-5 h-5 text-emerald-500" />
                        {tx('jobs.posted.goToDashboard', undefined, 'Dashboard')}
                    </button>
                </div>

                {/* Sub-actions / Job Link */}
                {jobId && (
                    <div className="flex flex-col items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
                        <div className="flex items-center gap-2">
                            <div className="h-px w-8" style={{ background: 'color-mix(in srgb, var(--border) 60%, transparent)' }} />
                            <span className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>
                                {tx('jobs.posted.shareNetwork', undefined, 'Share with your network')}
                            </span>
                            <div className="h-px w-8" style={{ background: 'color-mix(in srgb, var(--border) 60%, transparent)' }} />
                        </div>
                        
                        <div className="group relative flex items-center gap-3 p-2 pl-5 rounded-2xl border-2 backdrop-blur-md transition-all hover:border-emerald-500/40 w-full max-w-[380px]"
                             style={{ background: 'color-mix(in srgb, var(--card-bg) 60%, transparent)', borderColor: 'color-mix(in srgb, var(--border) 50%, transparent)' }}>
                            <Share2 className="w-4 h-4 shrink-0 transition-colors group-hover:text-emerald-500" style={{ color: 'var(--text-muted)' }} />
                            <div className="flex-1 w-full text-start truncate select-all cursor-text outline-none text-sm font-semibold opacity-90 tracking-wide" 
                               style={{ color: 'var(--text-primary)' }}>
                                {window.location.origin}/jobs/{jobId}
                            </div>
                            <button 
                                onClick={copyLink}
                                className={`flex items-center justify-center w-11 h-11 shrink-0 rounded-xl transition-all duration-300 ${copied ? 'bg-emerald-500 text-white' : 'hover:bg-emerald-500 hover:text-white hover:scale-105 active:scale-95'}`}
                                style={{ 
                                    background: copied ? '#10b981' : 'color-mix(in srgb, #10b981 12%, transparent)', 
                                    color: copied ? '#fff' : '#10b981' 
                                }}>
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

