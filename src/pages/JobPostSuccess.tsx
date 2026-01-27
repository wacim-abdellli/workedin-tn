import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Search, Home, FileText } from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';

export default function JobPostSuccess() {
    const navigate = useNavigate();
    const { jobId } = useParams<{ jobId: string }>();

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-12 md:py-20">
                <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        تم نشر وظيفتك بنجاح!
                    </h1>
                    <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                        وظيفتك الآن قيد المراجعة وستظهر للمستقلين قريباً. يمكنك البدء بدعوة المستقلين المميزين للعمل معك.
                    </p>

                    <div className="space-y-3">
                        <Button
                            variant="primary"
                            className="w-full justify-center py-4 text-lg"
                            onClick={() => navigate(`/jobs/${jobId}`)}
                            leftIcon={<FileText className="w-5 h-5" />}
                        >
                            عرض الوظيفة
                        </Button>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                onClick={() => navigate('/freelancers')}
                                leftIcon={<Search className="w-4 h-4" />}
                            >
                                البحث عن مستقلين
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-center"
                                onClick={() => navigate('/')}
                                leftIcon={<Home className="w-4 h-4" />}
                            >
                                الرئيسية
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
