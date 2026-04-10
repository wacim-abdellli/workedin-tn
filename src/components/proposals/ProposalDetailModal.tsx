import { useState, useEffect } from 'react';
import {
    X, MessageSquare, Star, MapPin,
    Clock, Briefcase, FileText,
    Download, ArrowLeft, Archive
} from 'lucide-react';
import Button from '../ui/Button';
import type { ProposalAttachment } from '../../types/proposal';
import { useTranslation } from "../../i18n";

interface ProposalDetailFreelancer {
    full_name: string;
    title: string;
    avatar_url: string | null;
    country: string;
    rating: number;
    reviews_count: number;
    jobs_completed: number;
    success_rate: number;
    is_online: boolean;
    availability?: string;
    bio: string;
}

interface ProposalDetailData {
    id: string;
    created_at: string;
    status: string;
    cover_letter: string;
    attachments: ProposalAttachment[];
    bid_amount: number;
    duration: number;
    freelancer: ProposalDetailFreelancer;
}

interface ProposalDetailModalProps {
    proposal: ProposalDetailData | null;
    isOpen: boolean;
    onClose: () => void;
    onMessage: () => void;
    onShortlist: () => void;
    onHire: () => void;
    onArchive: () => void;
}

export default function ProposalDetailModal({
    proposal,
    isOpen,
    onClose,
    onMessage,
    onShortlist,
    onHire,
    onArchive
}: ProposalDetailModalProps) {
    const { tx } = useTranslation();
    const [activeTab, setActiveTab] = useState('proposal');

    // Close on ESC
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!isOpen || !proposal) return null;

    const { freelancer } = proposal;

    const tabs = [
        { id: 'proposal', label: 'العرض' },
        { id: 'profile', label: 'الملف الشخصي' },
        { id: 'portfolio', label: 'معرض الأعمال' },
        { id: 'work-history', label: 'تاريخ العمل' },
        { id: 'reviews', label: 'التقييمات' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-card w-full h-full md:h-[90vh] md:max-w-7xl md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">

                {/* Close Button (Mobile & Desktop) */}
                <button
                    onClick={onClose}
                    className="absolute top-4 end-4 z-50 p-2 bg-card/90 rounded-full hover:bg-secondary md:hidden"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* LEFT SIDEBAR (Freelancer Info) */}
                <div className="w-full md:w-80 bg-surface border-e border-border flex flex-col overflow-y-auto">

                    {/* Header (Mobile only) */}
                    <div className="md:hidden p-4 border-b flex items-center gap-3">
                        <button onClick={onClose}><ArrowLeft className="w-6 h-6 rtl:rotate-180" /></button>
                        <h2 className="font-bold text-lg truncate">{freelancer.full_name}</h2>
                    </div>

                    <div className="p-6 text-center border-b border-border">
                        <div className="relative inline-block mb-4">
                            <img
                                src={freelancer.avatar_url || 'https://via.placeholder.com/150'}
                                alt={freelancer.full_name}
                                className="w-24 h-24 rounded-full border-4 border-white shadow-sm object-cover"
                            />
                            {freelancer.is_online && (
                                <span className="absolute bottom-1 end-1 w-5 h-5 bg-green-500 border-4 border-white rounded-full"></span>
                            )}
                        </div>
                        <h3 className="font-bold text-xl text-foreground dark:text-white mb-1">{freelancer.full_name}</h3>
                        <p className="text-muted text-sm mb-3">{freelancer.title || 'مستقل'}</p>

                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{freelancer.country || 'تونس'}</span>
                        </div>

                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${freelancer.availability === 'available' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {freelancer.availability === 'available' ? 'متاح للعمل' : 'مشغول حالياً'}
                        </div>
                    </div>

                    <div className="p-6 border-b border-border space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-muted text-sm">{tx('dynamic_key_2137084368')}</span>
                            <div className="flex items-center gap-1 font-bold">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                {freelancer.rating} <span className="text-muted text-xs font-normal">({freelancer.reviews_count})</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted text-sm">{tx('dynamic_key_611934998')}</span>
                            <span className="font-bold">{freelancer.jobs_completed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted text-sm">{tx('dynamic_key_1659906949')}</span>
                            <span className="font-bold text-green-600">{freelancer.success_rate || 95}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted text-sm">{tx('dynamic_key_29050573')}</span>
                            <span className="font-bold">{tx('dynamic_key_1259492927')}</span>
                        </div>
                    </div>

                    <div className="p-6">
                        <h4 className="font-bold text-sm mb-3">{tx('dynamic_key_1693322708')}</h4>
                        <div className="flex flex-wrap gap-2">
                            {['React', 'Node.js', 'UI Design', 'TypeScript'].map(skill => (
                                <span key={skill} className="px-2.5 py-1 bg-card border border-border rounded-lg text-xs font-medium text-muted-foreground">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER CONTENT */}
                <div className="flex-1 flex flex-col min-w-0 bg-card">

                    {/* Modal Header */}
                    <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card sticky top-0 z-20">
                        <div className="flex items-center gap-4">
                            {/* Tabs */}
                            <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                            ? 'bg-card text-foreground dark:text-white shadow-sm'
                                            : 'text-muted hover:text-foreground dark:text-white hover:bg-secondary'
                                            }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-2">
                            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="w-5 h-5 text-muted" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-8 relative">

                        {/* TAB: PROPOSAL */}
                        {activeTab === 'proposal' && (
                            <div className="animate-in fade-in duration-300 space-y-8">
                                <div>
                                    <div className="flex items-center gap-2 text-sm text-muted mb-4">
                                        <Clock className="w-4 h-4" />
                                        <span>{tx('dynamic_key_1718339647')}{new Date(proposal.created_at).toLocaleDateString('ar-TN')}</span>
                                        <span className="text-muted">|</span>
                                        <span className={proposal.status === 'viewed' ? 'text-green-600' : 'text-muted'}>
                                            {proposal.status === 'viewed' ? 'تمت المشاهدة' : 'جديد'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{tx('dynamic_key_365411007')}</h3>
                                    <div className="prose prose-lg max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {proposal.cover_letter}
                                    </div>
                                </div>

                                {proposal.attachments && proposal.attachments.length > 0 && (
                                    <div className="pt-6 border-t border-border">
                                        <h3 className="font-bold mb-4">{tx('dynamic_key_1712849267')}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {proposal.attachments.map((file, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 border border-border rounded-xl hover:bg-surface transition-colors cursor-pointer group">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm truncate">{file.name}</p>
                                                        <p className="text-xs text-muted">{file.size}</p>
                                                    </div>
                                                    <Download className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB: PROFILE */}
                        {activeTab === 'profile' && (
                            <div className="animate-in fade-in duration-300 space-y-8">
                                <section>
                                    <h3 className="font-bold text-lg mb-3">{tx('dynamic_key_1039014200')}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {freelancer.bio || 'لا توجد نبذة شخصية.'}
                                    </p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-lg mb-3">{tx('dynamic_key_623032746')}</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between p-3 bg-surface rounded-lg">
                                            <span>{tx('dynamic_key_2144569262')}</span>
                                            <span className="text-muted">{tx('dynamic_key_1262868023')}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-surface rounded-lg">
                                            <span>{tx('dynamic_key_1827230247')}</span>
                                            <span className="text-muted">{tx('dynamic_key_1530851603')}</span>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* TAB: PORTFOLIO */}
                        {activeTab === 'portfolio' && (
                            <div className="animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-muted">
                                        {tx('dynamic_key_2133212330')}</div>
                                    <div className="aspect-video bg-muted rounded-xl flex items-center justify-center text-muted">
                                        {tx('dynamic_key_418944631')}</div>
                                </div>
                            </div>
                        )}

                        {/* TAB: WORK HISTORY */}
                        {activeTab === 'work-history' && (
                            <div className="animate-in fade-in duration-300 text-center py-10 text-muted">
                                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>{tx('dynamic_key_1842506838')}</p>
                            </div>
                        )}

                        {/* TAB: REVIEWS */}
                        {activeTab === 'reviews' && (
                            <div className="animate-in fade-in duration-300 text-center py-10 text-muted">
                                <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>{tx('dynamic_key_41921266')}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR (Bid Stats & Actions) */}
                <div className="w-full md:w-80 bg-surface border-s border-border p-6 flex flex-col gap-6">

                    {/* Bid Card */}
                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                        <h4 className="font-bold text-foreground dark:text-white mb-4">{tx('dynamic_key_617719072')}</h4>
                        <div className="mb-4 text-center">
                            <p className="text-sm text-muted mb-1">{tx('dynamic_key_549959251')}</p>
                            <p className="text-3xl font-bold text-primary-600">{proposal.bid_amount} <span className="text-lg text-muted font-normal">{tx('dynamic_key_1524267')}</span></p>
                        </div>

                        <div className="space-y-3 py-4 border-t border-border">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{tx('dynamic_key_451961555')}</span>
                                <span className="font-medium">{proposal.duration} {tx('dynamic_key_1598663')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{tx('dynamic_key_1265703203')}</span>
                                <span className="font-medium text-muted">{(proposal.bid_amount * 0.1).toFixed(0)} {tx('dynamic_key_1524267')}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-dashed">
                                <span>{tx('dynamic_key_614661587')}</span>
                                <span>{(proposal.bid_amount * 1.1).toFixed(0)} {tx('dynamic_key_1524267')}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg mt-4 leading-relaxed">
                            {tx('dynamic_key_1111663922')}</div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 mt-auto">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full justify-center text-lg"
                            onClick={onHire}
                        >
                            {tx('dynamic_key_2071077264')}</Button>

                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                className="w-full justify-center"
                                onClick={onMessage}
                            >
                                <MessageSquare className="w-4 h-4 ms-2" />
                                {tx('dynamic_key_217425117')}</Button>
                            <Button
                                variant={proposal.status === 'shortlisted' ? 'secondary' : 'outline'}
                                className="w-full justify-center"
                                onClick={onShortlist}
                            >
                                <Star className={`w-4 h-4 ms-2 ${proposal.status === 'shortlisted' ? 'fill-current' : ''}`} />
                                {proposal.status === 'shortlisted' ? 'في القائمة' : 'تفضيل'}
                            </Button>
                        </div>

                        <button
                            onClick={onArchive}
                            className="w-full flex items-center justify-center gap-2 text-muted hover:text-red-500 text-sm py-2 transition-colors"
                        >
                            <Archive className="w-4 h-4" />
                            {tx('dynamic_key_6717295')}</button>
                    </div>
                </div>

            </div>
        </div>
    );
}
