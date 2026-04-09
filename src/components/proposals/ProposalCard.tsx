import { useState, memo } from 'react';
import {
    MessageSquare, Star, Clock, MapPin,
    CheckCircle, Shield,
    FileText, Download, DollarSign
} from 'lucide-react';
import Button from '../ui/Button';
import type { Proposal } from '../../types/proposal';

interface ProposalCardProps {
    proposal: Proposal;
    onMessage: (id: string) => void;
    onShortlist: (id: string) => void;
    onHire: (id: string) => void;
}

function ProposalCard({ proposal, onMessage, onShortlist, onHire }: ProposalCardProps) {
    const [expanded, setExpanded] = useState(false);
    const { freelancer, cover_letter, bid_amount, duration, created_at, status } = proposal;

    return (
        <div className={`bg-card rounded-2xl border transition-all duration-200 hover:shadow-md ${status === 'shortlisted' ? 'border-primary-200 ring-1 ring-primary-100' : 'border-border'}`}>
            <div className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* LEFT: Freelancer Info */}
                    <div className="flex-shrink-0 flex lg:flex-col gap-4 lg:w-48">
                        <div className="relative">
                            <img
                                src={freelancer.avatar_url || 'https://via.placeholder.com/80'}
                                alt={freelancer.full_name}
                                className="w-16 h-16 lg:w-20 lg:h-20 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            {freelancer.is_online && (
                                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                            )}
                        </div>

                        <div>
                            <h3 className="font-bold text-foreground dark:text-white leading-tight hover:text-primary-600 cursor-pointer mb-1">
                                {freelancer.full_name}
                            </h3>
                            <p className="text-sm text-muted mb-2">{freelancer.title || 'مستقل'}</p>

                            <div className="flex items-center gap-1 text-xs text-muted mb-2">
                                <MapPin className="w-3 h-3" />
                                {freelancer.country || 'تونس'}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {freelancer.is_verified && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                                        <Shield className="w-3 h-3" />
                                        موثق
                                    </span>
                                )}
                                {freelancer.rating > 4.5 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-medium border border-yellow-100">
                                        <Star className="w-3 h-3" />
                                        متميز
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CENTER: Proposal Content */}
                    <div className="flex-1 min-w-0 border-t lg:border-t-0 lg:border-s border-border pt-4 lg:pt-0 lg:pe-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-1 bg-surface px-2 py-1 rounded-lg">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-bold text-foreground dark:text-white text-sm">{freelancer.rating}</span>
                                <span className="text-muted text-xs">({freelancer.reviews_count})</span>
                            </div>
                            <span className="text-muted">|</span>
                            <span className="text-sm text-muted">
                                <strong className="text-foreground dark:text-white">{freelancer.jobs_completed}</strong> وظيفة مكتملة
                            </span>
                            <span className="text-muted">|</span>
                            <span className="text-sm text-muted">
                                <strong className="text-foreground dark:text-white">{freelancer.success_rate}%</strong> نجاح
                            </span>
                        </div>

                        <div className="relative">
                            <p className={`text-muted-foreground leading-relaxed text-sm ${!expanded ? 'line-clamp-3' : ''}`}>
                                {cover_letter}
                            </p>
                            {!expanded && cover_letter.length > 200 && (
                                <button
                                    onClick={() => setExpanded(true)}
                                    className="text-primary-600 text-sm font-medium hover:underline mt-1"
                                >
                                    قراءة المزيد...
                                </button>
                            )}
                        </div>

                        {proposal.attachments && proposal.attachments.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                                {proposal.attachments.map((file, index: number) => (
                                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg max-w-xs group cursor-pointer hover:bg-muted transition-colors">
                                        <div className="p-1.5 bg-card rounded-md shadow-sm">
                                            <FileText className="w-4 h-4 text-primary-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-foreground dark:text-white truncate">{file.name || `مرفق ${index + 1}`}</p>
                                            <p className="text-[10px] text-muted">{file.size || 'PDF'}</p>
                                        </div>
                                        <Download className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                            <Clock className="w-3 h-3" />
                            <span>منذ {new Date(created_at).toLocaleDateString('ar-TN')}</span>
                        </div>
                    </div>

                    {/* RIGHT: Bid & Actions */}
                    <div className="lg:w-64 border-t lg:border-t-0 lg:border-s border-border pt-4 lg:pt-0 lg:pe-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-baseline justify-between mb-1">
                                <span className="text-2xl font-bold text-foreground dark:text-white">{bid_amount}</span>
                                <span className="text-sm font-medium text-muted">د.ت</span>
                            </div>
                            <div className="text-xs text-green-600 mb-4 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                عرض مدروس
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        مدة التنفيذ
                                    </span>
                                    <span className="font-medium text-foreground dark:text-white">{duration} يوم</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        إجمالي التكلفة
                                    </span>
                                    <span className="font-medium text-foreground dark:text-white">{bid_amount} د.ت</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Button
                                variant="primary"
                                className="w-full justify-center"
                                onClick={() => onHire(proposal.id)}
                            >
                                توظيف
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-center"
                                    onClick={() => onMessage(proposal.id)}
                                >
                                    <MessageSquare className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={status === 'shortlisted' ? 'secondary' : 'outline'}
                                    className="w-full justify-center"
                                    onClick={() => onShortlist(proposal.id)}
                                >
                                    <Star className={`w-4 h-4 ${status === 'shortlisted' ? 'fill-current' : ''}`} />
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default memo(ProposalCard);
