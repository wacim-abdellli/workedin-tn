import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Star,
    MapPin,
    Clock,
    CheckCircle,
    Heart,
    Grid,
    List,
    X,
    Briefcase,
    Award,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';

// Mock freelancer data
const MOCK_FREELANCERS = [
    {
        id: 'f1',
        name: 'أحمد بن علي',
        title: 'مصمم جرافيكي محترف',
        avatar: null,
        rating: 4.9,
        reviews: 24,
        hourly_rate: 25,
        location: 'تونس العاصمة',
        skills: ['تصميم جرافيكي', 'لوجو', 'هوية بصرية'],
        success_rate: 98,
        jobs_completed: 32,
        response_time: '< 1 ساعة',
        is_verified: true,
        is_available: true,
    },
    {
        id: 'f2',
        name: 'سارة المنصوري',
        title: 'مترجمة محترفة',
        avatar: null,
        rating: 5.0,
        reviews: 18,
        hourly_rate: 20,
        location: 'صفاقس',
        skills: ['ترجمة', 'كتابة محتوى', 'تدقيق لغوي'],
        success_rate: 100,
        jobs_completed: 45,
        response_time: '< 2 ساعة',
        is_verified: true,
        is_available: true,
    },
    {
        id: 'f3',
        name: 'محمد الشريف',
        title: 'مطور ويب Full Stack',
        avatar: null,
        rating: 4.7,
        reviews: 12,
        hourly_rate: 35,
        location: 'سوسة',
        skills: ['React', 'Node.js', 'TypeScript'],
        success_rate: 95,
        jobs_completed: 28,
        response_time: '< 3 ساعة',
        is_verified: true,
        is_available: false,
    },
    {
        id: 'f4',
        name: 'فاطمة الزهراء',
        title: 'كاتبة محتوى إبداعي',
        avatar: null,
        rating: 4.8,
        reviews: 31,
        hourly_rate: 15,
        location: 'نابل',
        skills: ['كتابة محتوى', 'تسويق رقمي', 'سوشيال ميديا'],
        success_rate: 97,
        jobs_completed: 56,
        response_time: '< 1 ساعة',
        is_verified: false,
        is_available: true,
    },
    {
        id: 'f5',
        name: 'يوسف الحبيب',
        title: 'مصور فوتوغرافي',
        avatar: null,
        rating: 4.6,
        reviews: 8,
        hourly_rate: 30,
        location: 'المنستير',
        skills: ['تصوير', 'مونتاج', 'إعلانات'],
        success_rate: 92,
        jobs_completed: 15,
        response_time: '< 6 ساعة',
        is_verified: true,
        is_available: true,
    },
    {
        id: 'f6',
        name: 'نور الهدى',
        title: 'مصممة UI/UX',
        avatar: null,
        rating: 4.9,
        reviews: 22,
        hourly_rate: 40,
        location: 'تونس العاصمة',
        skills: ['Figma', 'تصميم واجهات', 'تجربة المستخدم'],
        success_rate: 99,
        jobs_completed: 38,
        response_time: '< 2 ساعة',
        is_verified: true,
        is_available: true,
    },
];

const CATEGORIES = [
    'تصميم جرافيكي',
    'برمجة وتطوير',
    'كتابة وترجمة',
    'تسويق رقمي',
    'فيديو وصوت',
    'استشارات',
];

const SKILLS = [
    'React', 'Node.js', 'تصميم لوجو', 'ترجمة', 'كتابة محتوى',
    'Figma', 'تصوير', 'مونتاج', 'SEO', 'سوشيال ميديا',
];

export default function FindFreelancers() {
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortBy, setSortBy] = useState('recommended');
    const [showFilters, setShowFilters] = useState(false);
    const [savedFreelancers, setSavedFreelancers] = useState<string[]>([]);

    // Filter states
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const [minRating, setMinRating] = useState(0);
    const [rateRange, setRateRange] = useState<[number, number]>([0, 100]);
    const [availableOnly, setAvailableOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);

    const toggleSaved = (id: string) => {
        setSavedFreelancers(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedSkills([]);
        setMinRating(0);
        setRateRange([0, 100]);
        setAvailableOnly(false);
        setVerifiedOnly(false);
    };

    const filteredFreelancers = MOCK_FREELANCERS.filter(f => {
        if (searchQuery && !f.name.includes(searchQuery) && !f.title.includes(searchQuery)) return false;
        if (minRating && f.rating < minRating) return false;
        if (f.hourly_rate < rateRange[0] || f.hourly_rate > rateRange[1]) return false;
        if (availableOnly && !f.is_available) return false;
        if (verifiedOnly && !f.is_verified) return false;
        if (selectedSkills.length > 0 && !selectedSkills.some(s => f.skills.includes(s))) return false;
        return true;
    });

    const FilterSidebar = () => (
        <div className="space-y-6">
            {/* Search */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">بحث</label>
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث عن موظفين حرين..."
                        className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 text-sm"
                    />
                </div>
            </div>

            {/* Categories */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">التصنيف</label>
                <div className="space-y-2">
                    {CATEGORIES.map(cat => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat)}
                                onChange={() => setSelectedCategories(prev =>
                                    prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                                )}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-600">{cat}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Skills */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المهارات</label>
                <div className="flex flex-wrap gap-2">
                    {SKILLS.slice(0, 6).map(skill => (
                        <button
                            key={skill}
                            onClick={() => setSelectedSkills(prev =>
                                prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
                            )}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedSkills.includes(skill)
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                                }`}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hourly Rate */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر بالساعة: {rateRange[0]} - {rateRange[1]} د.ت
                </label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={rateRange[0]}
                        onChange={(e) => setRateRange([Number(e.target.value), rateRange[1]])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="من"
                    />
                    <input
                        type="number"
                        value={rateRange[1]}
                        onChange={(e) => setRateRange([rateRange[0], Number(e.target.value)])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        placeholder="إلى"
                    />
                </div>
            </div>

            {/* Rating */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للتقييم</label>
                <div className="flex gap-2">
                    {[0, 3, 4, 4.5].map(rating => (
                        <button
                            key={rating}
                            onClick={() => setMinRating(rating)}
                            className={`flex-1 py-2 text-xs rounded-lg border transition-all ${minRating === rating
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                                }`}
                        >
                            {rating === 0 ? 'الكل' : `${rating}+`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Toggles */}
            <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">متاح الآن فقط</span>
                    <input
                        type="checkbox"
                        checked={availableOnly}
                        onChange={(e) => setAvailableOnly(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm text-gray-700">موثقين فقط</span>
                    <input
                        type="checkbox"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                </label>
            </div>

            {/* Clear */}
            <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                <X className="w-4 h-4 ml-2" />
                مسح الفلاتر
            </Button>
        </div>
    );

    const FreelancerCard = ({ freelancer }: { freelancer: typeof MOCK_FREELANCERS[0] }) => (
        <div
            className={`card hover:shadow-lg transition-all cursor-pointer group ${viewMode === 'list' ? 'flex gap-6' : ''
                }`}
            onClick={() => navigate(`/freelancer/${freelancer.id}`)}
        >
            {/* Avatar */}
            <div className={`${viewMode === 'list' ? 'shrink-0' : 'mb-4'}`}>
                <div className={`${viewMode === 'list' ? 'w-20 h-20' : 'w-16 h-16 mx-auto'} rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-white text-xl font-bold relative`}>
                    {freelancer.name.charAt(0)}
                    {freelancer.is_available && (
                        <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                    )}
                </div>
            </div>

            <div className="flex-1">
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className={viewMode === 'list' ? '' : 'text-center w-full'}>
                        <h3 className="font-bold text-foreground group-hover:text-primary-600 transition-colors flex items-center gap-2 justify-center lg:justify-start">
                            {freelancer.name}
                            {freelancer.is_verified && (
                                <CheckCircle className="w-4 h-4 text-blue-500" />
                            )}
                        </h3>
                        <p className="text-sm text-muted">{freelancer.title}</p>
                    </div>
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleSaved(freelancer.id); }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Heart className={`w-5 h-5 ${savedFreelancers.includes(freelancer.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                    </button>
                </div>

                {/* Stats */}
                <div className={`flex items-center gap-4 text-sm mb-3 ${viewMode === 'list' ? '' : 'justify-center'}`}>
                    <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{freelancer.rating}</span>
                        <span className="text-muted">({freelancer.reviews})</span>
                    </span>
                    <span className="flex items-center gap-1 text-muted">
                        <MapPin className="w-4 h-4" />
                        {freelancer.location}
                    </span>
                </div>

                {/* Rate & Success */}
                <div className={`flex items-center gap-4 mb-3 ${viewMode === 'list' ? '' : 'justify-center'}`}>
                    <span className="text-primary-600 font-bold">
                        {freelancer.hourly_rate} د.ت/ساعة
                    </span>
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Award className="w-4 h-4" />
                        {freelancer.success_rate}% نجاح
                    </span>
                </div>

                {/* Skills */}
                <div className={`flex flex-wrap gap-2 mb-3 ${viewMode === 'list' ? '' : 'justify-center'}`}>
                    {freelancer.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {skill}
                        </span>
                    ))}
                </div>

                {/* Quick Stats (List view) */}
                {viewMode === 'list' && (
                    <div className="flex items-center gap-6 text-sm text-muted pt-2 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {freelancer.jobs_completed} مشروع
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {freelancer.response_time}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container-custom py-8">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">اكتشف موظفين حرين</h1>
                        <p className="text-muted">{filteredFreelancers.length} موظف حر متاح</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Sort */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                        >
                            <option value="recommended">الأكثر توافقاً</option>
                            <option value="rating">الأعلى تقييماً</option>
                            <option value="reviews">الأكثر تقييمات</option>
                            <option value="rate_low">الأقل سعراً</option>
                            <option value="rate_high">الأعلى سعراً</option>
                        </select>

                        {/* View Toggle */}
                        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2.5 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                <Grid className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2.5 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mobile Filter Toggle */}
                        <Button
                            variant="outline"
                            className="lg:hidden"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex gap-8">
                    {/* Filter Sidebar - Desktop */}
                    <div className="hidden lg:block w-72 shrink-0">
                        <div className="card sticky top-24">
                            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                                <Filter className="w-5 h-5" />
                                تصفية النتائج
                            </h3>
                            <FilterSidebar />
                        </div>
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1">
                        {filteredFreelancers.length > 0 ? (
                            <div className={
                                viewMode === 'grid'
                                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                                    : 'space-y-4'
                            }>
                                {filteredFreelancers.map(freelancer => (
                                    <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                                ))}
                            </div>
                        ) : (
                            <div className="card text-center py-16">
                                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-foreground mb-2">لا توجد نتائج</h3>
                                <p className="text-muted mb-4">جرب تغيير معايير البحث</p>
                                <Button variant="primary" onClick={clearFilters}>
                                    مسح الفلاتر
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Filter Modal */}
            {showFilters && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
                    <div className="absolute inset-y-0 right-0 w-80 bg-white p-6 overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg">الفلاتر</h3>
                            <button onClick={() => setShowFilters(false)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <FilterSidebar />
                    </div>
                </div>
            )}
        </div>
    );
}
