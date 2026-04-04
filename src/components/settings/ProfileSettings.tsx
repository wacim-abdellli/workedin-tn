import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Eye, Loader2, Save, Shield, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OptimizedImage from '@/components/common/OptimizedImage';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { getWorkspaceOnboardingPath, isWorkspaceReady } from '@/lib/workspaceRoutes';
import { switchWorkspace } from '@/lib/switchWorkspace';

export default function ProfileSettings() {
    const { dir, t, tx } = useTranslation();
    const { user, profile, freelancerProfile, activeMode, refreshProfile, updateProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isSaving, setIsSaving] = useState(false);
    const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState<'freelancer' | 'client' | null>(null);
    const [form, setForm] = useState({ full_name: '', phone: '', email: '', bio: '', location: '' });

    useEffect(() => {
        if (profile) {
            setForm({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                email: profile.email || user?.email || '',
                bio: profile.bio || '',
                location: profile.location || '',
            });
        }
    }, [profile]);

    const workspaceReady = isWorkspaceReady(profile, freelancerProfile, activeMode);
    const needsIdentityVerification = !profile?.cin_verified;
    const needsCoreProfileFields = !profile?.bio || !profile?.avatar_url || !profile?.location || !profile?.full_name;

    const nextSetupPath = !workspaceReady
        ? getWorkspaceOnboardingPath(activeMode)
        : needsIdentityVerification ? '/verify-identity'
        : needsCoreProfileFields ? '/settings?tab=profile'
        : null;

    const nextSetupLabel = !workspaceReady
        ? t.auth.accountPanel.completeSetup
        : needsIdentityVerification
            ? tx('settings.setupStatus.verifyIdentity', undefined, 'Verify your identity')
            : tx('settings.setupStatus.completeProfile', undefined, 'Complete your profile');

    const showSecondarySetupChip = nextSetupPath !== null && nextSetupPath !== '/verify-identity';

    const identityStatus: 'verified' | 'missing' = profile?.cin_verified
        ? 'verified' : 'missing';

    const coreProfileFilledCount = [profile?.full_name, profile?.avatar_url, profile?.location, profile?.bio].filter(Boolean).length;
    const isCoreProfileComplete = coreProfileFilledCount === 4;

    const setupStatusItems = [
        {
            key: 'workspace',
            label: tx('settings.setupStatus.workspaceSetup', undefined, 'Workspace setup'),
            done: workspaceReady,
            doneText: tx('settings.setupStatus.done', undefined, 'Done'),
            pendingText: tx('settings.setupStatus.pending', undefined, 'Pending'),
        },
        {
            key: 'identity',
            label: tx('settings.setupStatus.identityVerification', undefined, 'Identity verification'),
            done: identityStatus === 'verified',
            doneText: tx('settings.setupStatus.verified', undefined, 'Verified'),
            pendingText: tx('settings.setupStatus.required', undefined, 'Required'),
        },
        {
            key: 'profile',
            label: tx('settings.setupStatus.profileBasics', undefined, 'Profile basics'),
            done: isCoreProfileComplete,
            doneText: tx('settings.setupStatus.complete', undefined, 'Complete'),
            pendingText: tx('settings.setupStatus.progress', { done: coreProfileFilledCount, total: 4 }, `${coreProfileFilledCount}/4`),
        },
    ];

    const nextSetupHint = nextSetupPath
        ? !workspaceReady
            ? tx('settings.setupStatus.nextHintOnboarding', undefined, 'Next step: finish onboarding for this workspace.')
            : needsIdentityVerification
                ? tx('settings.setupStatus.nextHintIdentity', undefined, 'Next step: submit your identity documents for verification.')
                : tx('settings.setupStatus.nextHintProfile', undefined, 'Next step: complete the missing profile fields.')
        : tx('settings.setupStatus.allDone', undefined, 'All required setup steps are complete.');

     const handleSave = async () => {
         if (!user?.id) return;
         setIsSaving(true);
         try {
             await updateProfile({
                 full_name: form.full_name,
                 phone: form.phone,
                   email: form.email,
                   bio: form.bio,
                 location: form.location,
             });
             await refreshProfile?.();
             // Invalidate dashboard query cache to ensure fresh data
             queryClient.invalidateQueries({ queryKey: ['freelancer-dashboard'] });
             queryClient.invalidateQueries({ queryKey: ['clientDashboardStats'] });
             queryClient.invalidateQueries({ queryKey: ['clientDashboardJobs'] });
             queryClient.invalidateQueries({ queryKey: ['clientActiveContracts'] });
             showToast(tx('settings.toasts.profileSaved', undefined, 'Profile updated successfully'), 'success');
         } catch (error: any) {
             logger.error('Error saving profile:', error);
             if (error?.message?.includes('duplicate key value violates unique constraint') && error?.message?.includes('phone')) {
                 showToast(tx('settings.toasts.phoneTaken', undefined, 'This phone number is already in use by another account.'), 'error');
             } else {
                 showToast(tx('settings.toasts.profileSaveError', undefined, 'Failed to save profile changes'), 'error');
             }
         } finally {
             setIsSaving(false);
         }
     };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/avatar.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user.id);
            await refreshProfile?.();
            showToast(tx('settings.toasts.avatarUpdated', undefined, 'Profile image updated'), 'success');
        } catch (error) {
            logger.error('Error uploading avatar:', error);
            showToast(tx('settings.toasts.avatarUpdateError', undefined, 'Failed to upload profile image'), 'error');
        }
    };

    const handleWorkspaceSelection = async (type: 'freelancer' | 'client' | 'both') => {
        const userId = user?.id;
        if (!userId) return;
        if (type !== 'both') {
            setIsSwitchingWorkspace(type);
            try {
                await switchWorkspace({ userId, targetWorkspace: type, currentUserType: profile?.user_type ?? 'client', profile, freelancerProfile, navigate });
            } catch (error) {
                logger.error('Workspace selection error:', error);
                showToast(t.auth.accountPanel.switchError, 'error');
            } finally {
                window.setTimeout(() => setIsSwitchingWorkspace(null), 350);
            }
            return;
        }
        try {
            const { error } = await supabase.from('profiles').update({ user_type: 'both' }).eq('id', userId);
            if (error) throw error;
            if (!freelancerProfile) {
                const { error: fe } = await supabase.from('freelancer_profiles').upsert({ id: userId, skills: [], availability: 'available' });
                if (fe) throw fe;
            }
            await refreshProfile();
            showToast(tx('settings.toasts.workspaceBothEnabled', undefined, 'Both workspaces are now enabled on your account.'), 'success');
        } catch (error) {
            logger.error('Workspace selection error:', error);
            showToast(t.common.error + ': ' + (error instanceof Error ? error.message : ''), 'error');
        }
    };

    // Completion widget
    const completionFields = [
        { key: 'full_name', label: tx('settings.completion.fullName', undefined, 'Name'), value: profile?.full_name },
        { key: 'avatar_url', label: tx('settings.completion.avatar', undefined, 'Profile photo'), value: profile?.avatar_url },
        { key: 'location', label: tx('settings.completion.location', undefined, 'Location'), value: profile?.location },
        { key: 'bio', label: tx('settings.completion.bio', undefined, 'Bio'), value: profile?.bio },
        { key: 'user_type', label: tx('settings.completion.accountType', undefined, 'Account type'), value: profile?.user_type },
        { key: 'identity_verification', label: tx('settings.completion.identityVerification', undefined, 'Identity verification'), value: Boolean(profile?.cin_verified) },
        { key: 'onboarding_completed', label: tx('settings.completion.onboarding', undefined, 'Onboarding'), value: profile?.onboarding_completed },
    ];
    const completedCount = completionFields.filter(f => f.value).length;
    const completionPct = Math.round((completedCount / completionFields.length) * 100);
    const missingFields = completionFields.filter(f => !f.value);

    void dir; // used by parent via useTranslation

    return (
        <div className="space-y-3">
            {/* Avatar + user info */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    {profile?.avatar_url ? (
                        <OptimizedImage src={profile.avatar_url} alt={form.full_name} className="w-24 h-24 rounded-xl" imgClassName="object-cover" />
                    ) : (
                        <div
                            className="flex h-24 w-24 items-center justify-center rounded-xl text-base font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${getAvatarGradient(form.full_name || 'User').join(', ')})` }}
                        >
                            {getInitials(form.full_name || 'User')}
                        </div>
                    )}
                    <label className="absolute -bottom-2 -end-2 w-8 h-8 bg-brand rounded-full text-brand-foreground flex items-center justify-center shadow-lg hover:bg-brand/90 transition-colors cursor-pointer">
                        <Camera className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                </div>
                <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-base text-foreground">{form.full_name || tx('settings.userFallback', undefined, 'User')}</h3>
                          {(profile?.user_type === 'freelancer' || profile?.user_type === 'both') && (
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2.5 py-0 gap-1.5 rounded-full"
                                  onClick={() => navigate(`/freelancer/${profile?.username || user?.id}`)}
                              >
                                  <Eye className="w-3 h-3" />
                                  {tx('settings.viewProfile', undefined, 'View Public Profile')}
                              </Button>
                          )}
                      </div>
                    <p className="text-muted-foreground">{form.phone}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            profile?.user_type === 'both'
                                ? 'border border-brand/20 bg-brand/5 text-brand'
                                : 'border border-border bg-surface text-muted-foreground'
                        }`}>
                            <User className="w-3 h-3" />
                            {profile?.user_type === 'freelancer' ? tx('settings.accountTypeFreelancer', undefined, 'Freelancer')
                                : profile?.user_type === 'client' ? tx('settings.accountTypeClient', undefined, 'Client')
                                : profile?.user_type === 'both' ? tx('settings.accountTypeBoth', undefined, 'Both')
                                : tx('settings.accountTypeUnknown', undefined, 'Not set')}
                        </span>
                        {profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                                <Check className="w-3 h-3" />{tx('settings.identityVerified', undefined, 'Identity verified')}
                            </span>
                        ) : (
                            <button onClick={() => navigate('/verify-identity')} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-brand/20 bg-brand/5 text-brand transition-colors hover:bg-brand/10">
                                <Shield className="w-3 h-3" />{tx('settings.verifyIdentity', undefined, 'Verify your identity')}
                            </button>
                        )}
                        {nextSetupPath === null ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                                <Check className="w-3 h-3" />{tx('settings.profileComplete', undefined, 'Profile complete')}
                            </span>
                        ) : showSecondarySetupChip ? (
                            <button onClick={() => navigate(nextSetupPath)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 transition-colors">
                                <User className="w-3 h-3" />{nextSetupLabel}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Completion widget */}
            <div className={`group relative mt-4 p-5 rounded-xl border border-white/10 dark:border-gray-800 shadow-2xl backdrop-blur-xl overflow-hidden ${completionPct === 100 ? 'bg-gradient-to-b from-green-500/10 to-green-500/5' : 'bg-gradient-to-b from-brand/10 to-brand/5'}`}>
                <div className={`absolute top-0 right-0 h-[200px] w-[200px] rounded-full blur-[80px] pointer-events-none transition-all duration-700 ${completionPct === 100 ? 'bg-green-500/20 group-hover:bg-green-500/30' : 'bg-brand/20 group-hover:bg-brand/30'}`} />
                <div className="relative z-10 flex items-center justify-between mb-5">
                    <span className="font-bold text-base text-foreground tracking-tight">{tx('settings.profileCompletionTitle', undefined, 'Profile completion')}</span>
                    <span className={`text-base font-black drop-shadow-sm ${completionPct === 100 ? 'text-green-400' : 'text-brand'}`}>{completionPct}%</span>
                </div>
                <div className="relative z-10 h-3 bg-black/20 rounded-full overflow-hidden inset-shadow-sm border border-white/5">
                    <div className={`h-full rounded-full transition-all duration-700 ${completionPct === 100 ? 'bg-gradient-to-r from-green-400 to-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-gradient-to-r from-brand/80 to-brand shadow-[0_0_15px_rgba(var(--brand),0.6)]'}`} style={{ width: `${completionPct}%` }} />
                </div>
                {missingFields.length > 0 && (
                    <div className="relative z-10 mt-3 flex flex-wrap gap-3 items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{tx('settings.requiredLabel', undefined, 'Required:')}</span>
                        {missingFields.slice(0, 3).map(m => <span key={m.key} className="text-xs font-bold px-3 py-1 bg-white dark:bg-gray-800 text-foreground rounded-full border border-white/10 dark:border-gray-800 shadow-sm backdrop-blur-md">{m.label}</span>)}
                        {missingFields.length > 3 && <span className="text-xs font-bold text-brand uppercase tracking-widest px-2">{tx('settings.moreRequired', { count: missingFields.length - 3 }, `+${missingFields.length - 3} more`)}</span>}
                    </div>
                )}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label={tx('settings.fullName', undefined, 'Full name')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                <Input label={tx('settings.phoneNumberLabel', undefined, 'Phone number')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={tx('common.phonePlaceholder', undefined, 'Enter your phone number')} />
                <Input label={tx('settings.emailOptionalLabel', undefined, 'Email (optional)')} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={tx('settings.emailPlaceholder', undefined, 'email@example.com')} />
                <Input label={tx('settings.location', undefined, 'Location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>

            {/* Workspace switcher */}
            <div className="mt-4 relative overflow-hidden rounded-xl border border-white/10 dark:border-gray-800 bg-card/80 p-5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
                <div className="absolute -left-20 top-20 h-[300px] w-[300px] rounded-full bg-brand/5 blur-[100px] pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-brand">{t.auth.accountPanel.sectionLabel}</p>
                        <h4 className="mt-3 text-base font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">{t.auth.accountPanel.switchWorkspace}</h4>
                        <p className="mt-2 text-base text-muted-foreground/90">{profile?.user_type === 'both' ? t.auth.accountPanel.switchWorkspaceBoth : t.auth.accountPanel.switchWorkspaceSingle}</p>
                    </div>
                    {nextSetupPath ? <Button variant="primary" className="rounded-xl shadow-lg hover:shadow-brand/25 transition-all hover:-translate-y-0.5" onClick={() => navigate(nextSetupPath)}>{nextSetupLabel}</Button> : null}
                </div>
                <div className="relative z-10 mt-3 rounded-xl border border-white/5 bg-white dark:bg-gray-800 ] p-5 backdrop-blur-lg">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand shadow-sm">
                                {activeMode === 'freelancer' ? t.auth.accountPanel.freelancerLabel : t.auth.accountPanel.clientLabel}
                            </span>
                            <span className="text-sm font-bold text-foreground">{workspaceReady ? t.auth.accountPanel.ready : t.auth.accountPanel.needsSetup}</span>
                        </div>
                        </div>
                </div>
                {/* Setup status summary */}
                <div className="relative z-10 mt-3 rounded-xl border border-white/5 bg-white dark:bg-gray-800 ] p-5 backdrop-blur-lg">
                    <div className="grid gap-3 sm:grid-cols-3">
                        {setupStatusItems.map(item => (
                            <div key={item.key} className={`rounded-xl border p-4 transition-transform hover:-translate-y-1 ${item.done ? 'border-green-500/30 bg-green-500/10 shadow-[0_4px_20px_-5px_rgba(34,197,94,0.15)]' : 'border-orange-500/30 bg-orange-500/10 shadow-[0_4px_20px_-5px_rgba(249,115,22,0.15)]'}`}>
                                <p className="text-xs font-bold tracking-wide text-foreground/80 uppercase">{item.label}</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${item.done ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {item.done ? <Check className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                                    </div>
                                    <span className={`text-sm font-bold ${item.done ? 'text-green-400' : 'text-orange-400'}`}>{item.done ? item.doneText : item.pendingText}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-5 text-sm font-medium text-muted-foreground/80 border-t border-white/5 pt-4">{nextSetupHint}</p>
                </div>
                <div className="relative z-10 mt-3 grid gap-3 md:grid-cols-2">
                        {([
                            { type: 'freelancer' as const, label: t.auth.accountPanel.freelancerLabel, desc: t.auth.accountPanel.freelancerDesc },
                            { type: 'client' as const, label: t.auth.accountPanel.clientLabel, desc: t.auth.accountPanel.clientDesc },
                        ] as const).map(({ type, label, desc }) => {
                            const isActive = activeMode === type;
                            const isAvailable = profile?.user_type === 'both' || profile?.user_type === type;
                            const actionLabel = isActive ? t.auth.accountPanel.current : isAvailable ? t.auth.accountPanel.switchAction : t.auth.accountPanel.enable;
                            return (
                                <button key={type} type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); void handleWorkspaceSelection(type); }} disabled={isActive || isSwitchingWorkspace !== null}
                                    className={`group rounded-xl border p-4 text-left transition-all duration-300 hover:shadow-2xl ${isActive ? 'border-brand/40 bg-brand/10 shadow-[0_0_30px_-5px_rgba(var(--brand),0.3)]' : 'border-white/10 dark:border-gray-800 bg-white dark:bg-gray-800 dark:bg-gray-900 hover:-translate-y-1 hover:border-brand/40 hover:bg-brand/5'} ${isActive ? 'cursor-default pointer-events-none' : ''}`}>
                                    <div className="flex flex-col h-full justify-between gap-3">
                                        <div>
                                            <div className="text-base font-bold text-foreground">{label}</div>
                                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground/90">{desc}</p>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className={`h-1.5 w-12 rounded-full ${isActive ? 'bg-brand shadow-[0_0_10px_rgba(var(--brand),0.8)]' : 'bg-white dark:bg-gray-800 dark:bg-gray-700'}`} />
                                            <span className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-widest ${isActive ? 'border-brand/30 bg-brand/20 text-brand shadow-sm' : 'border-white/10 dark:border-gray-800 bg-white dark:bg-gray-800 dark:bg-gray-800 text-muted-foreground transition-colors group-hover:border-brand/30 group-hover:text-foreground'}`}>
                                                {isSwitchingWorkspace === type ? <><Loader2 className="h-4 w-4 animate-spin" />{t.auth.accountPanel.switching}</> : actionLabel}
                                            </span>
                                        </div>
                                    </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bio */}
            <div>
                <label className="label">{tx('settings.bioLabel', undefined, 'Bio')}</label>
                <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={4} className="input-base w-full resize-none" placeholder={tx('settings.bioPlaceholder', undefined, 'Write a short bio about yourself...')} />
            </div>

            <div className="flex justify-end">
                <Button variant="primary" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                    {tx('settings.saveChanges', undefined, 'Save changes')}
                </Button>
            </div>
        </div>
    );
}
