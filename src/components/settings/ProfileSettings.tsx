import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, Eye, Loader2, Save, Shield, User, Zap } from 'lucide-react';
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
import { switchWorkspace } from '@/lib/switchWorkspace';
import { uploadAvatar } from '@/services/profiles';

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
    }, [profile, user?.email]);

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
            const avatarUrl = await uploadAvatar(user.id, file);
            await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
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

    void dir;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Premium Avatar Section */}
            <div className="flex items-start gap-4">
                <div className="relative group">
                    {profile?.avatar_url ? (
                        <OptimizedImage
                            src={profile.avatar_url}
                            alt={form.full_name}
                            className="w-24 h-24 rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                            imgClassName="object-cover"
                            style={{ boxShadow: '0 0 0 2px var(--workspace-primary), 0 0 0 4px var(--color-background-base)' }}
                        />
                    ) : (
                        <div
                            className="flex h-24 w-24 items-center justify-center rounded-2xl text-lg font-semibold text-white transition-transform duration-300 group-hover:scale-[1.02]"
                            style={{
                                background: `linear-gradient(135deg, ${getAvatarGradient(form.full_name || 'User').join(', ')})`,
                                boxShadow: '0 0 0 2px var(--workspace-primary), 0 0 0 4px var(--color-background-base)',
                            }}
                        >
                            {getInitials(form.full_name || 'User')}
                        </div>
                    )}
                    <label className="absolute -bottom-2 -end-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all duration-200 hover:scale-110 text-white" style={{ background: "var(--workspace-primary)" }}>
                        <Camera className="w-4 h-4" />
                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                </div>
                <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg" style={{ color: "var(--color-text-primary)" }}>{form.full_name || tx('settings.userFallback', undefined, 'User')}</h3>
                          {(profile?.user_type === 'freelancer' || profile?.user_type === 'both') && (
                              <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  className="h-6 text-xs px-2 py-0 gap-1"
                                  onClick={() => navigate(`/freelancer/${profile?.username || user?.id}`)}
                              >
                                  <Eye className="w-3 h-3" />
                                  {tx('settings.viewProfile', undefined, 'View')}
                              </Button>
                          )}
                      </div>
                    <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>{form.email}</p>
                    <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: "var(--workspace-primary)" }}>
                            <User className="w-3 h-3" />
                            {profile?.user_type === 'freelancer' ? tx('settings.accountTypeFreelancer', undefined, 'Freelancer')
                                : profile?.user_type === 'client' ? tx('settings.accountTypeClient', undefined, 'Client')
                                : profile?.user_type === 'both' ? tx('settings.accountTypeBoth', undefined, 'Both')
                                : tx('settings.accountTypeUnknown', undefined, 'Not set')}
                        </span>
                        {profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: "var(--color-status-success)" }}>
                                <Check className="w-3 h-3" />{tx('settings.identityVerified', undefined, 'Verified')}
                            </span>
                        ) : (
                            <button onClick={() => navigate('/verify-identity')} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 text-white" style={{ background: "var(--workspace-accent)" }}>
                                <Shield className="w-3 h-3" />{tx('settings.verifyIdentity', undefined, 'Verify')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="border-t" style={{ borderColor: "var(--color-border-subtle)" }} />

            {/* Enhanced Form fields */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label={tx('settings.fullName', undefined, 'Full name')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                    <Input label={tx('settings.phoneNumberLabel', undefined, 'Phone number')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder={tx('common.phonePlaceholder', undefined, 'Enter your phone number')} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label={tx('settings.emailOptionalLabel', undefined, 'Email (optional)')} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={tx('settings.emailPlaceholder', undefined, 'email@example.com')} />
                    <Input label={tx('settings.location', undefined, 'Location')} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--color-text-secondary)" }}>{tx('settings.bioLabel', undefined, 'Bio')}</label>
                    <textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} className="input-base w-full resize-none text-sm transition-all duration-200 focus:ring-2" placeholder={tx('settings.bioPlaceholder', undefined, 'Write a short bio about yourself...')} style={{ background: "var(--color-background-base)", borderColor: "var(--color-border-subtle)", color: "var(--color-text-primary)", padding: "0.625rem 0.75rem" }} />
                </div>
            </div>

            <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-3.5 h-3.5" />} className="transition-all duration-200 hover:scale-105">
                    {tx('settings.saveChanges', undefined, 'Save changes')}
                </Button>
            </div>

            <div className="border-t" style={{ borderColor: "var(--color-border-subtle)" }} />

            {/* Enhanced Workspace Switcher */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" style={{ color: "var(--workspace-primary)" }} />
                    <h4 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{t.auth.accountPanel.switchWorkspace}</h4>
                </div>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{profile?.user_type === 'both' ? t.auth.accountPanel.switchWorkspaceBoth : t.auth.accountPanel.switchWorkspaceSingle}</p>
                
                <div className="grid gap-3 md:grid-cols-2">
                    {([
                        { type: 'freelancer' as const, label: t.auth.accountPanel.freelancerLabel, desc: t.auth.accountPanel.freelancerDesc },
                        { type: 'client' as const, label: t.auth.accountPanel.clientLabel, desc: t.auth.accountPanel.clientDesc },
                    ] as const).map(({ type, label, desc }) => {
                        const isActive = activeMode === type;
                        const isAvailable = profile?.user_type === 'both' || profile?.user_type === type;
                        const actionLabel = isActive ? t.auth.accountPanel.current : isAvailable ? t.auth.accountPanel.switchAction : t.auth.accountPanel.enable;
                        return (
                            <button 
                                key={type} 
                                type="button" 
                                onClick={e => { e.preventDefault(); e.stopPropagation(); void handleWorkspaceSelection(type); }} 
                                disabled={isActive || isSwitchingWorkspace !== null}
                                className="group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-300 hover:shadow-lg disabled:cursor-default"
                                style={{
                                    borderColor: isActive ? "color-mix(in srgb, var(--workspace-primary) 30%, var(--color-border-subtle))" : "var(--color-border-subtle)",
                                    background: isActive ? "color-mix(in srgb, var(--workspace-primary) 4%, var(--color-background-elevated))" : "var(--color-background-elevated)",
                                }}
                            >
                                <div className="relative">
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="p-2 rounded-lg" style={{ background: isActive ? "var(--workspace-primary)" : "var(--color-background-subtle)" }}>
                                            <User className="h-4 w-4" style={{ color: isActive ? "#ffffff" : "var(--color-text-secondary)" }} />
                                        </div>
                                        {isActive && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: "var(--workspace-primary)" }}>
                                                <Check className="w-3 h-3" />
                                                {actionLabel}
                                            </span>
                                        )}
                                        {!isActive && isSwitchingWorkspace === type && (
                                            <Loader2 className="h-4 w-4 animate-spin" style={{ color: "var(--workspace-primary)" }} />
                                        )}
                                    </div>
                                    <div className="text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>{label}</div>
                                    <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>{desc}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
