import { logger } from '@/lib/logger';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Send, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../ui/Toast'; // Assuming we have a Toast context/hook

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    freelancerId: string;
    freelancerName: string;
}

const contactSchema = z.object({
    subject: z.string().min(5, 'يجب أن يكون العنوان 5 أحرف على الأقل'),
    message: z.string().min(20, 'يجب أن تكون الرسالة 20 حرفاً على الأقل'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactModal({ isOpen, onClose, freelancerId, freelancerName }: ContactModalProps) {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
        resolver: zodResolver(contactSchema),
    });

    if (!isOpen) return null;

    const onSubmit = async (data: ContactFormData) => {
        if (!user) {
            showToast('يجب تسجيل الدخول لإرسال رسالة', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // First check if a conversation exists or create one
            // This logic depends on how your messages are structured. 
            // Assuming a simple messages table or conversation table.

            // For now, let's insert directly into messages if we have a receiver_id
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: freelancerId, // Make sure messages table supports receiver_id or user separate logic
                    content: `**${data.subject}**\n\n${data.message}`,
                    read: false,
                });

            if (error) throw error;

            showToast('تم إرسال الرسالة بنجاح', 'success');
            reset();
            onClose();
        } catch (error) {
            logger.error('Error sending message:', error);
            showToast('حدث خطأ أثناء إرسال الرسالة', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900">مراسلة {freelancerName}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    {!user && (
                        <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl flex items-start gap-3 text-sm mb-4">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>يجب عليك تسجيل الدخول لتتمكن من مراسلة المستقلين.</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الموضوع</label>
                        <input
                            type="text"
                            {...register('subject')}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            placeholder="مثال: استفسار بخصوص مشروع تصميم..."
                            disabled={!user}
                        />
                        {errors.subject && (
                            <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">الرسالة</label>
                        <textarea
                            {...register('message')}
                            rows={5}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                            placeholder="اكتب تفاصيل رسالتك هنا..."
                            disabled={!user}
                        />
                        {errors.message && (
                            <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                        )}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            إلغاء
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            isLoading={isSubmitting}
                            disabled={!user}
                            leftIcon={<Send className="w-4 h-4" />}
                        >
                            إرسال
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
