import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building, CheckCircle, Camera } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { uploadFile } from '../lib/supabase';
import { GOVERNORATES } from '../types';
import type { Governorate } from '../types';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import { Header } from '../components/layout';

// Validation schema
const clientSchema = z.object({
    full_name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
    company_name: z.string().optional(),
    location: z.string().min(1, 'اختر ولايتك'),
});

type ClientFormData = z.infer<typeof clientSchema>;

function ClientOnboarding() {
    const { t } = useTranslation();
    const { user, updateProfile } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
    });

    // Handle avatar upload
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showToast('حجم الصورة يجب أن يكون أقل من 5 ميجا', 'error');
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const onSubmit = async (data: ClientFormData) => {
        setIsLoading(true);
        try {
            // Upload avatar if exists
            let avatarUrl = undefined;
            if (avatarFile && user) {
                const path = `${user.id}/avatar-${Date.now()}.${avatarFile.name.split('.').pop()}`;
                avatarUrl = await uploadFile('avatars', path, avatarFile);
            }

            await updateProfile({
                full_name: data.full_name,
                location: data.location,
                bio: data.company_name ? `شركة: ${data.company_name}` : undefined,
                avatar_url: avatarUrl,
            });

            showToast('تم إكمال التسجيل بنجاح!', 'success');
            navigate('/client/dashboard');
        } catch (error) {
            showToast('حدث خطأ في حفظ البيانات', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-12">
                <div className="max-w-lg mx-auto">
                    <div className="card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-secondary-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-secondary-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">أكمل ملفك الشخصي</h2>
                                <p className="text-muted text-sm">معلومات بسيطة للبدء</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Avatar Upload */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div
                                        className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white shadow-lg"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-10 h-10 text-gray-400" />
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -end-1 w-8 h-8 rounded-full bg-secondary-600 text-white flex items-center justify-center shadow-lg hover:bg-secondary-700 transition-colors"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>
                            </div>

                            <Input
                                {...register('full_name')}
                                label={t.profile.fullName}
                                placeholder={t.profile.fullNamePlaceholder}
                                error={errors.full_name?.message}
                                leftIcon={<User className="w-5 h-5" />}
                            />

                            <Input
                                {...register('company_name')}
                                label={`${t.profile.companyName} (${t.profile.optional})`}
                                placeholder={t.profile.companyNamePlaceholder}
                                leftIcon={<Building className="w-5 h-5" />}
                            />

                            <Select
                                {...register('location')}
                                label={t.profile.location}
                                placeholder={t.profile.selectLocation}
                                error={errors.location?.message}
                                options={GOVERNORATES.map((gov: Governorate) => ({ value: gov, label: gov }))}
                            />

                            <Button
                                type="submit"
                                variant="secondary"
                                size="lg"
                                className="w-full"
                                isLoading={isLoading}
                                rightIcon={<CheckCircle className="w-5 h-5" />}
                            >
                                {t.auth.completeProfile}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClientOnboarding;
