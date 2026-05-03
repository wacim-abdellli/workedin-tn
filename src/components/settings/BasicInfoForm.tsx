import { useState, useEffect } from 'react';
import { Camera, Check, Eye, Loader2, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import { getAvatarGradient, getInitials } from '@/lib/avatar';
import { uploadAvatar } from '@/services/profiles';
import { sanitizePhoneInput } from '@/lib/phone';
import { getLocalizedGovernorateOptions } from '@/lib/governorates';
import { logger } from '@/lib/logger';
import { useRef } from 'react';

export interface BasicFormData {
    full_name: string;
    phone: string;
    email: string;
    bio: string;
    location: string;
}

interface BasicInfoFormProps {
    form: BasicFormData;
    onChange: (next: BasicFormData) => void;
}

export function buildBasicInitialForm(
    profile: ReturnType<typeof import('@/contexts/AuthContext').useAuth>['profile'],
    userEmail?: string
): BasicFormData {
    return {
        full_name: profile?.full_name || '',
        phone: profile?.phone || '',
        email: profile?.email || userEmail || '',
        bio: profile?.bio || '',
        location: profile?.location || '',
    };
}

export function BasicInfoForm({ form, onChange }: BasicInfoFormProps) {
    const { t, tx, language } = useTranslation();
    const { user, profile, activeMode, updateProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);
    const localAvatarPreviewRef = useRef<string | null>(null);

    useEffect(() => {
        return () => { if (localAvatarPreviewRef.current) URL.revokeObjectURL(localAvatarPreviewRef.current); };
    }, []);

    useEffect(() => {
        if (localAvatarPreview && profile?.avatar_url && !profile.avatar_url.startsWith('blob:')) {
            URL.revokeObjectURL(localAvatarPreview);
            localAvatarPreviewRef.current = null;
            setLocalAvatarPreview(null);
        }
    }, [profile?.avatar_url, localAvatarPreview]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;
        if (localAvatarPreviewRef.current) URL.revokeObjectURL(localAvatarPreviewRef.current);
        const preview = URL.createObjectURL(file);
        localAvatarPreviewRef.current = preview;
        setLocalAvatarPreview(preview);
        setIsUploadingAvatar(true);
        try {
            const avatarUrl = await uploadAvatar(user.id, file);
            await updateProfile({ avatar_url: avatarUrl, avatar_url_freelancer: avatarUrl, avatar_url_client: avatarUrl });
            showToast(tx('settings.toasts.avatarUpdated', undefined, 'Profile image updated'), 'success');
        } catch (err) {
            logger.error('Avatar upload error:', err);
            URL.revokeObjectURL(preview);
            localAvatarPreviewRef.current = null;
            setLocalAvatarPreview(null);
            showToast(tx('settings.toasts.avatarUpdateError', undefined, 'Failed to upload image'), 'error');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const set = (patch: Partial<BasicFormData>) => onChange({ ...form, ...patch });
    const avatarSrc = localAvatarPreview || profile?.avatar_url;

    return (
        <div className="space-y-6">
            {/* Avatar row */}
            <div className="flex items-center gap-5">
                <div className="relative group shrink-0">
                    {avatarSrc ? (
                        <img
                            src={avatarSrc}
                            alt={form.full_name}
                            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-offset-2 transition-all duration-300 group-hover:scale-105"
                            style={{ ringColor: 'var(--workspace-primary)', ringOffsetColor: 'var(--color-background-base)' }}
                        />
                    ) : (
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-lg font-bold text-white transition-all duration-300 group-hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${getAvatarGradient(form.full_name || 'U').join(', ')})` }}
                        >
                            {getInitials(form.full_name || 'U')}
                        </div>
                    )}
                    <label
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all duration-200 hover:scale-110 text-white"
                        style={{ background: 'var(--workspace-primary)' }}
                    >
                        {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif" className="hidden" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
                    </label>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                            {form.full_name || tx('settings.userFallback', undefined, 'User')}
                        </h3>
                        {(profile?.user_type === 'freelancer' || profile?.user_type === 'both') && (
                            <Button type="button" variant="outline" size="xs" className="h-5 text-xs px-2 py-0 gap-1" onClick={() => navigate(`/freelancer/${profile?.username || user?.id}`)}>
                                <Eye className="w-3 h-3" />
                                {tx('settings.viewProfile', undefined, 'View public profile')}
                            </Button>
                        )}
                    </div>
                    <p className="text-xs mb-2 truncate" style={{ color: 'var(--color-text-tertiary)' }}>{form.email}</p>
                    <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: 'var(--workspace-primary)' }}>
                            <User className="w-3 h-3" />
                            {profile?.user_type === 'freelancer' ? t.auth.accountPanel.freelancerLabel
                                : profile?.user_type === 'client' ? t.auth.accountPanel.clientLabel
                                : profile?.user_type === 'both' ? tx('settings.accountTypeBoth', undefined, 'Both')
                                : tx('settings.accountTypeUnknown', undefined, 'Not set')}
                        </span>
                        {profile?.cin_verified ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ background: 'var(--color-status-success)' }}>
                                <Check className="w-3 h-3" />{tx('settings.identityVerified', undefined, 'Verified')}
                            </span>
                        ) : (
                            <button onClick={() => navigate('/verify-identity')} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all hover:opacity-80 text-white" style={{ background: 'var(--workspace-accent)' }}>
                                <Shield className="w-3 h-3" />{tx('settings.verifyIdentity', undefined, 'Verify identity')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="h-px" style={{ background: 'var(--color-border-subtle)' }} />

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input
                    label={tx('settings.fullName', undefined, 'Full name')}
                    value={form.full_name}
                    onChange={e => set({ full_name: e.target.value })}
                    placeholder="e.g. Wissem Abdelali"
                />
                <Input
                    label={tx('settings.phoneNumberLabel', undefined, 'Phone number')}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={e => set({ phone: sanitizePhoneInput(e.target.value) })}
                    placeholder="+216 XX XXX XXX"
                />
                <Input
                    label={tx('settings.emailOptionalLabel', undefined, 'Email (optional)')}
                    type="email"
                    value={form.email}
                    onChange={e => set({ email: e.target.value })}
                    placeholder="you@example.com"
                />
                <div className="relative" style={{ zIndex: 50 }}>
                    <CustomSelect
                        name="location"
                        label={tx('settings.location', undefined, 'Location')}
                        placeholder={t.profile.selectLocation || 'Select governorate'}
                        options={getLocalizedGovernorateOptions(language)}
                        variant={activeMode === 'client' ? 'client' : 'freelancer'}
                        value={form.location}
                        onChange={value => set({ location: value })}
                    />
                </div>
                <div className="md:col-span-2">
                    <Input
                        as="textarea"
                        rows={3}
                        label={tx('settings.bioLabel', undefined, 'Bio')}
                        value={form.bio}
                        onChange={e => set({ bio: e.target.value })}
                        placeholder={tx('settings.bioPlaceholder', undefined, 'Write a short bio about yourself...')}
                    />
                </div>
            </div>
        </div>
    );
}
