import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Heart, Star, MapPin, Briefcase, Clock } from 'lucide-react';
import Button from '../ui/Button';
import IconButton from '../ui/IconButton';
import { cn } from '../../lib/utils';

// Define the interface for Freelancer props
// Based on MOCK_FREELANCERS structure in FindFreelancers.tsx
export interface Freelancer {
    id: string;
    name: string;
    title: string;
    avatar: string | null;
    rating: number;
    reviews: number;
    hourly_rate: number;
    location: string;
    skills: string[];
    success_rate: number;
    jobs_completed: number;
    response_time: string;
    is_verified: boolean;
    is_available: boolean;
}

interface FreelancerCardProps {
    freelancer: Freelancer;
    viewMode?: 'grid' | 'list';
    isSaved?: boolean;
    onToggleSave?: (id: string) => void;
}

function FreelancerCard({
    freelancer,
    viewMode = 'grid',
    isSaved = false,
    onToggleSave
}: FreelancerCardProps) {
    const navigate = useNavigate();

    return (
        <div
            className={`
                group card-hover-shine relative bg-white dark:bg-dark-900 rounded-2xl 
                border border-gray-200 dark:border-dark-700 
                hover:border-primary-500/30 dark:hover:border-primary-500/30
                shadow-sm hover:shadow-xl hover:shadow-primary-500/10
                transition-all duration-300 ease-out transform hover:-translate-y-1
                cursor-pointer
                ${viewMode === 'list' ? 'flex flex-col md:flex-row gap-6 p-6' : 'p-6 flex flex-col'}
            `}
            onClick={() => navigate(`/freelancer/${freelancer.id}`)}
        >
            {/* Avatar Section */}
            <div className={`${viewMode === 'list' ? 'shrink-0 md:w-48 flex flex-col items-center justify-center border-b md:border-b-0 md:border-l border-gray-100 dark:border-dark-700 pb-4 md:pb-0 md:pl-6' : 'mb-6 text-center'}`}>
                <div className="relative inline-block">
                    <div className="w-20 h-20 rounded-2xl rotate-3 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-800/20 absolute inset-0 transition-transform group-hover:rotate-6" />
                    <div className={`
                        relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-600 
                        flex items-center justify-center text-white text-3xl font-bold font-cairo shadow-lg shadow-primary-500/20
                        group-hover:scale-105 transition-transform duration-300
                    `}>
                        {freelancer.avatar ? (
                            <img
                                src={freelancer.avatar}
                                alt={freelancer.name}
                                className="w-full h-full object-cover rounded-2xl"
                            />
                        ) : (
                            freelancer.name.charAt(0)
                        )}
                        {freelancer.is_available && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-dark-900 rounded-full" title="متاح للعمل" />
                        )}
                    </div>
                </div>

                {viewMode === 'list' && (
                    <div className="mt-4 text-center">
                        <div className="font-bold text-xl text-primary-600 dark:text-primary-400">
                            {freelancer.hourly_rate} <span className="text-sm text-muted font-normal">د.ت/ساعة</span>
                        </div>
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full inline-block">
                            {freelancer.success_rate}% نسبة نجاح
                        </div>
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                    <div className={viewMode === 'list' ? '' : 'text-center w-full'}>
                        <h3 className="text-lg font-bold text-dark-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex items-center gap-2 justify-center lg:justify-start">
                            {freelancer.name}
                            {freelancer.is_verified && (
                                <div className="tooltip" data-tip="هوية موثقة">
                                    <Shield className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                                </div>
                            )}
                        </h3>
                        <p className="text-sm text-muted font-medium mt-1">{freelancer.title}</p>
                    </div>
                    {viewMode !== 'list' && onToggleSave && (
                        <div className="absolute top-4 left-4 z-10">
                            <IconButton
                                icon={<Heart className={cn("w-5 h-5 transition-all", isSaved && "fill-current")} />}
                                label={isSaved ? "إلغاء الحفظ" : "حفظ المستقل"}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleSave(freelancer.id);
                                }}
                                isActive={isSaved}
                                variant="danger"
                                size="sm"
                            />
                        </div>
                    )}
                </div>

                {/* Rating & Location */}
                <div className={`flex items-center gap-4 text-sm mb-4 ${viewMode === 'list' ? '' : 'justify-center border-b border-gray-50 dark:border-dark-800 pb-4'}`}>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-yellow-700 dark:text-yellow-500">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="font-bold">{freelancer.rating}</span>
                        <span className="text-yellow-600/60 dark:text-yellow-500/60 text-xs">({freelancer.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted">
                        <MapPin className="w-3.5 h-3.5" />
                        {freelancer.location}
                    </div>
                </div>

                {/* Stats Grid (Grid View) */}
                {viewMode !== 'list' && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="p-2 bg-gray-50 dark:bg-dark-800 rounded-xl text-center">
                            <div className="text-lg font-bold text-primary-600 dark:text-primary-400">{freelancer.hourly_rate} د.ت</div>
                            <div className="text-[10px] text-muted">السعر / ساعة</div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-dark-800 rounded-xl text-center">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">{freelancer.success_rate}%</div>
                            <div className="text-[10px] text-muted">نسبة النجاح</div>
                        </div>
                    </div>
                )}

                {/* Skills */}
                <div className={`flex flex-wrap gap-1.5 ${viewMode === 'list' ? 'mb-4' : 'justify-center'}`}>
                    {freelancer.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-colors">
                            {skill}
                        </span>
                    ))}
                    {freelancer.skills.length > 3 && (
                        <span className="px-2 py-1 text-xs text-muted">+ {freelancer.skills.length - 3}</span>
                    )}
                </div>

                {/* Footer (List View: Actions) */}
                {viewMode === 'list' && (
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-700 mt-auto">
                        <div className="flex items-center gap-6 text-sm text-muted">
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {freelancer.jobs_completed} مشروع مكتمل
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                رد خلال {freelancer.response_time}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {onToggleSave && (
                                <IconButton
                                    icon={<Heart className={cn("w-5 h-5 transition-all", isSaved && "fill-current")} />}
                                    label={isSaved ? "إلغاء الحفظ" : "حفظ المستقل"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleSave(freelancer.id);
                                    }}
                                    isActive={isSaved}
                                    variant={isSaved ? "danger" : "outline"}
                                    size="md"
                                    className={cn("rounded-xl", !isSaved && "border-gray-200 dark:border-dark-600")}
                                />
                            )}
                            <Button size="sm" onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/freelancer/${freelancer.id}`);
                            }}>
                                عرض الملف الشخصي
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(FreelancerCard);
