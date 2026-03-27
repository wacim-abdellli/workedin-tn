import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Loader2, Save, Shield, User } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OptimizedImage from '@/components/common/OptimizedImage';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { getWorkspaceOnboardingPath, getWorkspaceSetupProgress, isWorkspaceReady } from '@/lib/workspaceRoutes';
import { switchWorkspace } from '@/lib/switchWorkspace';

export default function ProfileSettings() {
    const { dir, t, tx } = useTranslation();
    const { user, profile, freelancerProfile, activeMode, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [isSaving, setIsSaving] = useState(false);
    const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState<'freelancer' | 'client' | null>(null);
    const [form, setForm] = useState({ full_name: '', phone: '', email: '', bio: '', location: '' });

    useEffect(() => {
        if (profile) {
            setForm({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                email: '',
                bio: profile.bio || '',
                location: profile.location || '',
            });
        }
    }, [profile]);

    const workspaceReady = isWorkspaceReady(profile, freelancerProfile, activeMode);
    const needsIdentityVerification = !profile?.cin_verified && !profile?.cin_submitted;
    const needsCoreProfileFields = !profile?.bio || !profile?.avatar_url || !profile?.location || !profile?.full_name;

    const nextSetupPath = !workspaceReady
        ? getWorkspaceOnboardingPath(activeMode)
        : needsIdentityVerification ? '/verify-identity'
        : needsCoreProfileFields ? '/settings?tab=profile'
        : null;

    const nextSetupLabel = !workspaceReady
        ? t.auth.accountPanel.completeSetup
        : needsIdentityVerification
            ? tx('settings.verifyIdentity', undefined, 'Verify your identity')
            : tx('settings.completeProfile', undefined, 'Complete your profile');

    const showSecondarySetupChip = nextSetupPath !== null && nextSetupPath !== '/verify-identity';

    const identityStatus: 'verified' | 'pending' | 'missing' = profile?.cin_verified
        ? 'verified' : profile?.cin_submitted ? 'pending' : 'missing';

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
            pendingText: identityStatus === 'pending'
                ? tx('settings.setupStatus.underReview', undefined, 'Under review')
                : tx('settings.setupStatus.required', undefined, 'Required'),
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
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: form.full_name, bio: form.bio, location: form.location, updated_at: new Date().toISOString() })
                .eq('id', user.id);
            if (error) throw error;
            await refreshProfile?.();
            showToast(tx('settings.toasts.profileSaved', undefined, 'Profile updated successfully'), 'success');
        } catch (error) {
            logger.error('Error saving profile:', error);
            showToast(tx('settings.toasts.profileSaveError', undefined, 'Failed to save profile changes'), 'error');
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
        { key: 'identity_verification', label: tx('settings.completion.identityVerification', undefined, 'Identity verification'), value: Boolean(profile?.cin_verified || profile?.cin_submitted) },
        { key: 'onboarding_completed', label: tx('settings.completion.onboarding', undefined, 'Onboarding'), value: profile?.onboarding_completed },
    ];
    const completedCount = completionFields.filter(f => f.value).length;
    const completionPct = Math.round((completedCount / completionFields.length) * 100);
    const missingFields = completionFields.filter(f => !f.value);

    void dir; // used by parent via useTranslation

    return (
        <div className="space-y-6">
            {/* Avatar + user info */}
            <div className="flex items-center gap-6">
                <div className="relative">
                    {profile?.avatar_url ? (
                        <OptimizedImage src={profile.avatar_url} alt={form.full_name} className="w-24 h-24 rounded-2xl" imgClassName="object-cover" />
                    ) : (
                        <div
                            className="flex h-24 w-24 items-center justify-center rounded-2xl text-3xl font-bold text-white"
                            style={{ background: `linear-gradient(135deg, ${getAvatarGradient(form.full_name || 'User').join(', ')})` }}
                        >
                            {getInitials(form.full_name || 'User')}
                        </div>
                    )}
                    <label className="absolute -bottom-2 -end-2 w-8 h-8 bg-primary-600 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors cursor-pointer">
                        <Camera className="w-4 h-4" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-lg">{form.full_name || tx('settings.userFallback', undefined, 'User')}</h3>
                    <p className="text-muted">{form.phone}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            profile?.user_type === 'freelancer' ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                            : profile?.user_type === 'client' ? 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400'
                            : profile?.user_type === 'both' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                            <User className="w-3 h-3" />
                            {profile?.user_type === 'freelancer' ? tx('settings.accountTypeFreelancer', undefined, 'Freelancer')
                                : profile?.user_type === 'client' ? tx('settings.accountTypeClient', undefined, 'Client')
                                : profile?.user_type === 'both' ? tx('settings.accountTypeBoth', undefined, 'Both')
                                : tx('settings.accountTypeUnknown', undefined, 'Not set')}
                        </span>
                        {profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <Check className="w-3 h-3" />{tx('settings.identityVerified', undefined, 'Identity verified')}
                            </span>
                        ) : profile?.cin_submitted ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                                <Loader2 className="w-3 h-3 animate-spin" />{tx('settings.identityPending', undefined, 'Under review')}
                            </span>
                        ) : (
                            <button onClick={() => navigate('/verify-identity')} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <Shield className="w-3 h-3" />{tx('settings.verifyIdentity', undefined, 'Verify your identity')}
                            </button>
                        )}
                        {nextSetupPath === null ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                <Check className="w-3 h-3" />{tx('settings.profileComplete', undefined, 'Profile complete')}
                            </span>
                        ) : showSecondarySetupChip ? (
                            <button onClick={() => navigate(nextSetupPath)} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
                                <User className="w-3 h-3" />{nextSetupLabel}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Completion widget */}
            <div className={`p-4 rounded-2xl border-2 ${completionPct === 100 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">{tx('settings.profileCompletionTitle', undefined, 'Profile completion')}</span>
                    <span className={`text-lg font-bold ${completionPct === 100 ? 'text-green-600' : 'text-orange-600'}`}>{completionPct}%</span>
                </div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-[width] duration-300 ${completionPct === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-orange-400 to-orange-500'}`} style={{ width: `${completionPct}%` }} />
                </div>
                {missingFields.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs text-muted">{tx('settings.requiredLabel', undefined, 'Required:')}</span>
                        {missingFields.slice(0, 3).map(m => <span key={m.key} className="text-xs px-2 py-0.5 bg-white dark:bg-gray-800 rounded border">{m.label}</span>)}
                        {missingFields.length > 3 && <span className="text-xs text-muted">{tx('settings.moreRequired', { count: missingFields.length - 3 }, `+${missingFields.length - 3} more`)}</span>}
                    </div>
                )}
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={tx('settings.fullName', undefined, 'Full name')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                <Input label={tx('settings.phoneNumberLabel', undefined, 'Phone number')} value={form.phone} disabled />
                <Input label={tx('settings.emailOptionalLabel', undefined, 'Email (optional)')} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={tx('settings.emailPlaceholder', undefined, 'email@example.com')} />
                <Input label={tx('settings.location', undefined, 'Location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>

            {/* Workspace switcher */}
            <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-500">{t.auth.accountPanel.sectionLabel}</p>
                        <h4 className="mt-2 text-lg font-semibold text-foreground">{t.auth.accountPanel.switchWorkspace}</h4>
                        <p className="mt-1 text-sm text-muted">{profile?.user_type === 'both' ? t.auth.accountPanel.switchWorkspaceBoth : t.auth.accountPanel.switchWorkspaceSingle}</p>
                    </div>
                    {nextSetupPath ? <Button variant="primary" onClick={() => navigate(nextSetupPath)}>{nextSetupLabel}</Button> : null}
                </div>
                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-gray-50/90 p-4 dark:border-white/8 dark:bg-white/[0.04]">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${activeMode === 'freelancer' ? 'border-violet-500/20 bg-violet-500/12 text-violet-700 dark:text-violet-200' : 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200'}`}>
                                {activeMode === 'freelancer' ? t.auth.accountPanel.freelancerLabel : t.auth.accountPanel.clientLabel}
                            </span>
                            <span className="text-sm font-medium text-foreground">{workspaceReady ? t.auth.accountPanel.ready : t.auth.accountPanel.needsSetup}</span>
                        </div>
                        <span className="text-sm font-semibold text-muted">{getWorkspaceSetupProgress(profile, freelancerProfile, activeMode)}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                        <div className={`h-full rounded-full transition-[width] duration-300 ${activeMode === 'freelancer' ? 'bg-gradient-to-r from-violet-500 to-fuchsia-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} style={{ width: `${getWorkspaceSetupProgress(profile, freelancerProfile, activeMode)}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted">{t.auth.accountPanel.progressLabel}</p>
                </div>
                {/* Setup status summary */}
                <div className="mt-4 rounded-2xl border border-gray-200/80 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="grid gap-2 sm:grid-cols-3">
                        {setupStatusItems.map(item => (
                            <div key={item.key} className={`rounded-xl border px-3 py-2 ${item.done ? 'border-green-200 bg-green-50/80 dark:border-green-500/30 dark:bg-green-500/10' : 'border-orange-200 bg-orange-50/80 dark:border-orange-500/30 dark:bg-orange-500/10'}`}>
                                <p className="text-xs font-medium text-muted">{item.label}</p>
                                <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold">
                                    {item.done ? <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                                        : identityStatus === 'pending' && item.key === 'identity' ? <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-600 dark:text-orange-300" />
                                        : <Shield className="h-3.5 w-3.5 text-orange-600 dark:text-orange-300" />}
                                    <span className={item.done ? 'text-green-700 dark:text-green-200' : 'text-orange-700 dark:text-orange-200'}>{item.done ? item.doneText : item.pendingText}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-muted">{nextSetupHint}</p>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {([
                        { type: 'freelancer' as const, label: t.auth.accountPanel.freelancerLabel, desc: t.auth.accountPanel.freelancerDesc, tone: 'border-violet-300/30 bg-violet-500/[0.05] dark:border-violet-500/20 dark:bg-violet-500/[0.08]', chip: 'border-violet-400/20 bg-violet-500/12 text-violet-700 dark:text-violet-200' },
                        { type: 'client' as const, label: t.auth.accountPanel.clientLabel, desc: t.auth.accountPanel.clientDesc, tone: 'border-emerald-300/30 bg-emerald-500/[0.05] dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]', chip: 'border-emerald-400/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200' },
                    ] as const).map(({ type, label, desc, tone, chip }) => {
                        const isActive = activeMode === type;
                        const isAvailable = profile?.user_type === 'both' || profile?.user_type === type;
                        const actionLabel = isActive ? t.auth.accountPanel.current : isAvailable ? t.auth.accountPanel.switchAction : t.auth.accountPanel.enable;
                        return (
                            <button key={type} type="button" onClick={e => { e.preventDefault(); e.stopPropagation(); void handleWorkspaceSelection(type); }} disabled={isActive || isSwitchingWorkspace !== null}
                                className={`rounded-2xl border p-4 text-left transition-colors ${isActive ? tone : 'border-gray-200 bg-white hover:border-primary-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-primary-500/30'} ${isActive ? 'cursor-default' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-foreground">{label}</div>
                                        <p className="mt-2 text-sm leading-relaxed text-muted">{desc}</p>
                                    </div>
                                    <span className={`inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${chip}`}>
                                        {isSwitchingWorkspace === type ? <><Loader2 className="h-3 w-3 animate-spin" />{t.auth.accountPanel.switching}</> : actionLabel}
                                    </span>
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
