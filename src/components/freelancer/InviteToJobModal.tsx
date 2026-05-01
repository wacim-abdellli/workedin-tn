import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/i18n';
import { ROUTES } from '@/lib/routes';
import { X, Briefcase, Plus, ChevronRight, Loader2 } from 'lucide-react';
import type { Job } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface InviteToJobModalProps {
    isOpen: boolean;
    onClose: () => void;
    freelancerId: string;
    freelancerName: string;
}

export default function InviteToJobModal({ isOpen, onClose, freelancerId, freelancerName }: InviteToJobModalProps) {
    const { user } = useAuth();
    const { tx } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [isInviting, setIsInviting] = useState<string | null>(null);

    const { data: openJobs, isLoading } = useQuery({
        queryKey: ['client-open-jobs', user?.id],
        queryFn: async () => {
            if (!user?.id) return [];
            
            const { data, error } = await supabase
                .from('jobs')
                .select('id, title, budget_max, budget_min, job_type, created_at')
                .eq('client_id', user.id)
                .eq('status', 'open')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Job[];
        },
        enabled: isOpen && !!user?.id,
    });

    if (!isOpen) return null;

    const handleCreateNewJob = () => {
        onClose();
        navigate(`${ROUTES.jobsNew}?invite=${encodeURIComponent(freelancerId)}`, {
            state: {
                inviteFreelancerId: freelancerId,
                inviteFreelancerName: freelancerName,
            },
        });
    };

    const handleInviteToJob = async (job: Job) => {
        if (!user?.id) return;
        setIsInviting(job.id);

        try {
            // Check if there is already a proposal
            const { data: existingProposals } = await supabase
                .from('proposals')
                .select('id')
                .eq('job_id', job.id)
                .eq('freelancer_id', freelancerId);

            if (existingProposals && existingProposals.length > 0) {
                // They already have a proposal, go straight to proposals view so client can hire
                onClose();
                navigate(`/jobs/${job.id}`);
                showToast(tx('inviteModal.alreadyApplied', undefined, 'This freelancer has already applied to this job. You can hire them directly from the proposals.'), 'success');
                return;
            }

            // Create a direct offer/contract or invite
            // For now, let's create a direct contract in pending_payment state
            const amount = job.budget_min || job.budget_max || 0;
            
            const { error } = await supabase.from('contracts').insert({
                job_id: job.id,
                freelancer_id: freelancerId,
                client_id: user.id,
                amount: amount,
                status: 'pending_payment',
                payment_status: 'pending',
                started_at: new Date().toISOString()
            });

            if (error) throw error;

            showToast(tx('inviteModal.success', undefined, `Successfully sent an offer to ${freelancerName}!`), 'success');
            onClose();
            // Redirect to the contract or workspace
            navigate(ROUTES.myContracts);

        } catch (error) {
            console.error('Error inviting freelancer:', error);
            showToast(tx('inviteModal.error', undefined, 'Failed to send offer. Please try again.'), 'error');
        } finally {
            setIsInviting(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="w-full max-w-lg bg-[var(--color-bg-elevated)] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                        {tx('inviteModal.title', undefined, 'Hire or Invite Freelancer')}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-lg text-[var(--color-text-primary)]/50 hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 overflow-y-auto max-h-[60vh]">
                    <p className="text-sm text-[var(--color-text-primary)]/60 mb-4">
                        {tx('inviteModal.description', { name: freelancerName }, `Choose an existing open job to hire ${freelancerName} for, or create a brand new job.`)}
                    </p>

                    <button
                        onClick={handleCreateNewJob}
                        className="w-full flex items-center justify-center gap-2 py-3.5 mb-6 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-white/40 rounded-xl text-[var(--color-text-primary)] transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-semibold text-sm">
                            {tx('inviteModal.createNew', undefined, 'Create a new job for this freelancer')}
                        </span>
                    </button>

                    <h3 className="text-xs font-bold tracking-wider text-[var(--color-text-primary)]/40 uppercase mb-3">
                        {tx('inviteModal.existingJobs', undefined, 'Your Open Jobs')}
                    </h3>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-8 text-[var(--color-text-primary)]/40">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : openJobs && openJobs.length > 0 ? (
                        <div className="space-y-2">
                            {openJobs.map((job) => (
                                <div 
                                    key={job.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-[var(--color-bg-muted)] hover:border-white/30 transition-colors group"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{job.title}</h4>
                                        <p className="text-xs text-[var(--color-text-primary)]/50 mt-1 capitalize">{job.job_type.replace('_', ' ')}</p>
                                    </div>
                                    <button
                                        onClick={() => handleInviteToJob(job)}
                                        disabled={isInviting === job.id}
                                        className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#8B5CF6] hover:bg-[#7c3aed] text-[var(--color-text-primary)] text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isInviting === job.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                {tx('inviteModal.hire', undefined, 'Hire')}
                                                <ChevronRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 border border-white/5 rounded-xl bg-[var(--color-bg-elevated)]">
                            <Briefcase className="w-8 h-8 text-[var(--color-text-primary)]/20 mx-auto mb-2" />
                            <p className="text-sm text-[var(--color-text-primary)]/50">
                                {tx('inviteModal.noJobs', undefined, 'You have no open jobs at the moment.')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


