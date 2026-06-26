import { useNavigate } from 'react-router-dom';
import { Briefcase, FileSignature, MessageSquare } from 'lucide-react';
import { formatHiredDate, getRateLabel, getStatusBadge } from './contractsListUtils';
import type { ContractRow } from './contractsListUtils';

interface ContractCardProps {
    contract: ContractRow;
    isFreelancerWorkspace: boolean;
    hasBorder: boolean;
    tx: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
    language: string;
}

export default function ContractCard({
    contract,
    isFreelancerWorkspace,
    hasBorder,
    tx,
    language,
}: ContractCardProps) {
    const navigate = useNavigate();

    const partner = isFreelancerWorkspace ? contract.client : contract.freelancer;
    const partnerName = partner?.full_name || tx('contracts.unknownUser', undefined, 'Unknown User');
    const badge = getStatusBadge(contract.status);
    const rate = getRateLabel(contract, tx);

    return (
        <article
            className={`p-6 hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6 group ${hasBorder ? 'border-b border-white/5' : ''}`}
        >
            <div>
                <h3 className="text-base font-bold text-white group-hover:text-violet-400 transition-colors line-clamp-1 mb-2">
                    {contract.job?.title || contract.title || tx('contracts.unknownProject', undefined, 'Unknown Project')}
                </h3>

                <div className="flex items-center gap-4 text-xs text-white/50 flex-wrap">
                    <span>
                        {rate.typeLabel}: <span className="text-white font-semibold">{rate.amountLabel}</span>
                    </span>
                    <span>
                        {tx('contracts.startedDate', undefined, 'Started')}{' '}
                        <span className="text-white font-medium">{formatHiredDate(contract.createdAt, language)}</span>
                    </span>
                </div>

                <div className="mt-4 flex items-center gap-2.5 text-xs text-white/60">
                    {partner?.avatar_url ? (
                        <img
                            src={partner.avatar_url}
                            alt={partnerName}
                            className="w-6 h-6 rounded-full object-cover border border-white/10"
                        />
                    ) : (
                        <div className="w-6 h-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
                            <Briefcase className="w-3 h-3 text-white/30" />
                        </div>
                    )}
                    <span>
                        {isFreelancerWorkspace
                            ? tx('contracts.role.client', undefined, 'Client')
                            : tx('contracts.role.freelancer', undefined, 'Freelancer')}
                        : {' '}
                        <span className="font-semibold text-white/80">{partnerName}</span>
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-4 shrink-0">
                <span className={badge.className}>
                    {badge.icon}
                    {tx(badge.labelKey, undefined, badge.fallbackLabel)}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(
                            `/messages?contract=${contract.id}${partner?.id ? `&with=${partner.id}` : ''}`,
                            { state: { contractId: contract.id, otherUserId: partner?.id || null } },
                        )}
                        className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        {tx('contracts.message', undefined, 'Message')}
                    </button>

                    <button
                        type="button"
                        onClick={() => navigate(`/workspace/${contract.id}`)}
                        className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                    >
                        <FileSignature className="w-4 h-4" />
                        {tx('contracts.viewContract', undefined, 'Workspace')}
                    </button>
                </div>
            </div>
        </article>
    );
}
