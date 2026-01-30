import { CheckCircle } from 'lucide-react';
import type { FreelancerData } from '@/types/freelancer';

interface SidebarProps {
    freelancer: FreelancerData;
}

export default function ProfileSidebar({ freelancer }: SidebarProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ar-TN', {
            year: 'numeric',
            month: 'long',
        });
    };

    return (
        <div className="space-y-6">
            {/* Availability Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4">معلومات العمل</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-gray-600">الحالة</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${freelancer.availability === 'available' ? 'bg-green-100 text-green-700' :
                            freelancer.availability === 'busy' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                            {freelancer.availability === 'available' ? 'متاح للعمل' :
                                freelancer.availability === 'busy' ? 'مشغول حالياً' : 'غير متصل'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-gray-600">عضو منذ</span>
                        <span className="text-gray-900">{formatDate(freelancer.joined_at)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-gray-600">آخر ظهور</span>
                        <span className="text-gray-900">منذ ساعة</span>
                    </div>
                </div>
            </div>

            {/* Languages */}
            {freelancer.languages.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-4">اللغات</h3>
                    <div className="space-y-3">
                        {freelancer.languages.map((lang, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <span className="text-gray-700">{lang.language}</span>
                                <span className="text-xs text-muted bg-gray-100 px-2 py-1 rounded">
                                    {lang.proficiency}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {freelancer.education.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-bold mb-4">التعليم</h3>
                    <div className="space-y-4">
                        {freelancer.education.map((edu, idx) => (
                            <div key={idx} className="relative ps-4 border-s-2 border-gray-100">
                                <h4 className="font-bold text-sm text-gray-900">{edu.institution}</h4>
                                <p className="text-xs text-gray-600 mb-1">{edu.degree} - {edu.field}</p>
                                <p className="text-xs text-muted">{edu.startYear} - {edu.endYear}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Verifications */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold mb-4">التوثيقات</h3>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.cin ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.cin ? 'text-gray-900' : 'text-gray-400'}>الهوية الشخصية</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.phone ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.phone ? 'text-gray-900' : 'text-gray-400'}>رقم الهاتف</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.email ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.email ? 'text-gray-900' : 'text-gray-400'}>البريد الإلكتروني</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle className={`w-5 h-5 ${freelancer.verifications.payment ? 'text-green-500' : 'text-gray-300'}`} />
                        <span className={freelancer.verifications.payment ? 'text-gray-900' : 'text-gray-400'}>وسيلة الدفع</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
