import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const tabs = [
    { id: 'overview', label: 'Overview', icon: IconPulse },
    { id: 'files', label: 'Files', icon: IconFile },
    { id: 'milestones', label: 'Milestones', icon: IconMilestone },
    { id: 'activity', label: 'Activity', icon: IconActivity },
];

const fileFilters = ['All', 'Shared', 'Review', 'Final'];

const tokenStyle = {
    '--cw-bg-page': '#0D0D0E',
    '--cw-bg-modal': '#111214',
    '--cw-bg-card': '#161719',
    '--cw-border': 'rgba(255,255,255,0.07)',
    '--cw-border-hover': 'rgba(255,255,255,0.12)',
    '--cw-text': '#F0EFE8',
    '--cw-text-secondary': '#8A8880',
    '--cw-text-tertiary': '#55534F',
    '--cw-action': '#1D9E75',
    '--cw-action-bg': '#0F3D2E',
    '--cw-review': '#BA7517',
    '--cw-review-bg': '#2E1F0A',
    '--cw-complete': '#7F77DD',
    '--cw-complete-bg': '#1C1A3A',
    '--cw-info': '#185FA5',
    '--cw-info-bg': '#071B30',
    '--cw-danger': '#A32D2D',
    '--cw-danger-bg': '#1E0B0B',
};

export default function ContractWorkspace({ contract = {}, currentUser = { role: 'client', id: null } }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [fileFilter, setFileFilter] = useState('All');
    const [previewFile, setPreviewFile] = useState(null);
    const closePreviewRef = useRef(null);
    const tabRefs = useRef({});

    const handleOpenFile = async (file) => {
        const bucket = file.storageBucket || file.storage_bucket || 'contract-files';
        const path = file.storagePath || file.storage_path || '';
        if (file.url && !path) {
            window.open(file.url, '_blank', 'noopener');
            return;
        }
        if (!path) {
            console.error('File path not available.');
            return;
        }
        try {
            const { data, error: urlErr } = await supabase.storage.from(bucket).createSignedUrl(path, 300);
            if (urlErr) throw urlErr;
            if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener');
        } catch (err) {
            console.error('[ContractWorkspace] File open failed:', err);
        }
    };

    const vm = useMemo(() => buildViewModel(contract, currentUser), [contract, currentUser]);

    useEffect(() => {
        if (!previewFile) return undefined;

        closePreviewRef.current?.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') setPreviewFile(null);
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [previewFile]);

    const onTabKeyDown = (event, index) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        const nextIndex = event.key === 'Home'
            ? 0
            : event.key === 'End'
                ? tabs.length - 1
                : event.key === 'ArrowRight'
                    ? (index + 1) % tabs.length
                    : (index - 1 + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex].id;
        setActiveTab(nextTab);
        window.requestAnimationFrame(() => tabRefs.current[nextTab]?.focus());
    };

    return (
        <section
            style={tokenStyle}
            className="mx-auto flex max-h-[calc(100vh-32px)] w-full max-w-[1000px] flex-col overflow-hidden rounded-[14px] bg-[var(--cw-bg-modal)] text-[var(--cw-text)] shadow-[0_24px_80px_rgba(0,0,0,0.6)] sm:max-h-[calc(100vh-64px)]"
            aria-label="Contract workspace"
        >
            <style>{workspaceStyles}</style>

            {/* Header: always visible contract identity and trust-critical chips. */}
            <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={vm.counterpartyName} src={vm.counterpartyAvatar} />
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                            <h1 className="truncate text-[18px] font-medium tracking-[-0.01em] text-[var(--cw-text)]">
                                {vm.title}
                            </h1>
                            <StatusBadge status={vm.status} />
                        </div>
                        <p className="truncate text-[13px] text-[var(--cw-text-secondary)]">
                            {currentUser.role === 'client' ? 'Client view' : 'Freelancer view'} with {vm.counterpartyName}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <HeaderChip icon={<IconWallet />} label={formatAmount(vm.amount)} prominent />
                    <HeaderChip icon={<IconCalendar />} label={formatDate(vm.deadline, 'No deadline')} className="hidden sm:inline-flex" />
                    <button type="button" className={focusable('rounded-lg border border-[var(--cw-border)] bg-[var(--cw-bg-card)] p-2 text-[var(--cw-text-secondary)] transition-colors duration-[80ms] hover:border-[var(--cw-border-hover)] hover:text-[var(--cw-text)]')} aria-label="Contract actions">
                        <IconDots />
                    </button>
                </div>
            </header>

            {/* Tab navigation: keyboard-first Linear-style tabs. */}
            <nav className="sticky top-14 z-20 shrink-0 border-b border-[var(--cw-border)] bg-[var(--cw-bg-page)] px-5" aria-label="Workspace sections">
                <div role="tablist" className="flex h-11 items-end gap-5 overflow-x-auto">
                    {tabs.map((tab, index) => {
                        const Icon = tab.icon;
                        const selected = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                ref={(node) => { tabRefs.current[tab.id] = node; }}
                                id={`contract-workspace-tab-${tab.id}`}
                                type="button"
                                role="tab"
                                aria-selected={selected}
                                aria-controls={`contract-workspace-panel-${tab.id}`}
                                title={tab.label}
                                onClick={() => setActiveTab(tab.id)}
                                onKeyDown={(event) => onTabKeyDown(event, index)}
                                className={focusable(`relative flex h-11 shrink-0 items-center gap-2 text-[13px] font-medium transition-colors duration-150 ease-out ${selected ? 'text-[var(--cw-text)]' : 'text-[var(--cw-text-secondary)] hover:text-[var(--cw-text)]'}`)}
                            >
                                <span className="sm:hidden"><Icon /></span>
                                <span className="hidden sm:inline">{tab.label}</span>
                                {selected ? <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[var(--cw-action)]" /> : null}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* Tab content: animated panel body. */}
            <main
                key={activeTab}
                id={`contract-workspace-panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`contract-workspace-tab-${activeTab}`}
                className="contract-tab-panel min-h-0 flex-1 overflow-y-auto bg-[var(--cw-bg-page)] p-5"
            >
                {activeTab === 'overview' ? <OverviewTab vm={vm} currentUser={currentUser} /> : null}
                {activeTab === 'files' ? <FilesTab vm={vm} fileFilter={fileFilter} setFileFilter={setFileFilter} onPreview={setPreviewFile} /> : null}
                {activeTab === 'milestones' ? <MilestonesTab vm={vm} currentUser={currentUser} /> : null}
                {activeTab === 'activity' ? <ActivityTab vm={vm} /> : null}
            </main>

            {previewFile ? <FilePreviewOverlay file={previewFile} closeRef={closePreviewRef} onClose={() => setPreviewFile(null)} onOpen={() => { handleOpenFile(previewFile); setPreviewFile(null); }} /> : null}
        </section>
    );
}

function OverviewTab({ vm, currentUser }) {
    return (
        <div className="space-y-3">
            {vm.isCompleted ? <CompletedSummary vm={vm} /> : null}

            <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(300px,2fr)]">
                <ContractPulse vm={vm} />
                <NextMoveCard vm={vm} />
            </div>

            {!vm.isCompleted ? <ActionDeck vm={vm} currentUser={currentUser} /> : null}
        </div>
    );
}

function ContractPulse({ vm }) {
    const stats = [
        { label: 'Tasks Done', value: `${vm.tasksDone}/${vm.totalTasks}`, hint: vm.totalTasks > 0 ? 'milestone progress' : 'no milestones' },
        { label: 'Files', value: vm.files.length, hint: `${vm.reviewFiles.length} review / ${vm.finalFiles.length} final` },
        { label: 'Revisions Left', value: vm.revisionsLeft, hint: `${vm.revisionsUsed}/${vm.revisionsMax} used` },
    ];

    return (
        <section className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-4 py-[14px] transition-colors duration-[80ms] hover:border-[var(--cw-border-hover)]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <SectionLabel>Contract Pulse</SectionLabel>
                    <h2 className="mt-1 text-[18px] font-medium tracking-[-0.01em]">Health at a glance</h2>
                </div>
                <StatusBadge status={vm.status} />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-4 py-[14px]">
                        <SectionLabel>{stat.label}</SectionLabel>
                        <p className="mt-2 text-[24px] font-medium text-[var(--cw-text)]">{stat.value}</p>
                        <p className="font-mono text-[13px] text-[var(--cw-text-secondary)]">{stat.hint}</p>
                    </div>
                ))}
            </div>

            <div className="mt-3">
                <div className="mb-2 flex items-center justify-between text-[13px]">
                    <span className="text-[var(--cw-text-secondary)]">Overall progress</span>
                    <span className="font-mono text-[var(--cw-text)]">{vm.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--cw-bg-modal)]">
                    <div className="h-full rounded-full bg-[var(--cw-action)]" style={{ width: `${vm.progress}%` }} />
                </div>
            </div>
        </section>
    );
}

function NextMoveCard({ vm }) {
    return (
        <section className={`rounded-[10px] border border-[var(--cw-border)] border-l-[1.5px] ${vm.nextMove.borderClass} ${vm.nextMove.bgClass} px-4 py-[14px] shadow-[0_24px_80px_rgba(0,0,0,0.24)]`}>
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[var(--cw-border)] bg-black/15 text-[var(--cw-text)]">
                    {vm.nextMove.icon}
                </div>
                <div className="min-w-0 flex-1">
                    <SectionLabel>Next Move</SectionLabel>
                    <h2 className="mt-1 text-[18px] font-medium tracking-[-0.01em]">{vm.nextMove.title}</h2>
                    <p className="mt-2 text-[14px] leading-[1.6] text-[var(--cw-text-secondary)]">{vm.nextMove.body}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
                {vm.nextMove.primary ? <button type="button" className={primaryButton()}>{vm.nextMove.primary}</button> : null}
                <button type="button" className={secondaryButton()}>View history</button>
            </div>
        </section>
    );
}

function ActionDeck({ vm, currentUser }) {
    const actions = currentUser.role === 'client'
        ? getClientActions(vm)
        : getFreelancerActions(vm);

    if (actions.length === 0) {
        return (
            <section className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-4 py-[14px]">
                <p className="text-[14px] leading-[1.6] text-[var(--cw-text-secondary)]">No action required right now.</p>
            </section>
        );
    }

    return (
        <section className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-4 py-[14px]">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                    <SectionLabel>Action Deck</SectionLabel>
                    <h2 className="mt-1 text-[14px] font-medium">Available for your role</h2>
                </div>
                <span className="rounded-full border border-[var(--cw-review)] bg-[var(--cw-review-bg)] px-2.5 py-1 font-mono text-[13px] text-[var(--cw-text)]">
                    {vm.revisionsLeft} rev left
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {actions.map((action, index) => (
                    <button key={action.label} type="button" className={index === 0 ? primaryButton() : secondaryButton()}>
                        {action.label}
                    </button>
                ))}
            </div>
        </section>
    );
}

function CompletedSummary({ vm }) {
    return (
        <section className="rounded-[10px] border border-[var(--cw-border)] border-l-[1.5px] border-l-[var(--cw-complete)] bg-[var(--cw-complete-bg)] px-4 py-[14px]">
            <div className="flex items-start gap-3">
                <IconCheck />
                <div className="min-w-0 flex-1">
                    <SectionLabel>Read-only summary</SectionLabel>
                    <h2 className="mt-1 text-[18px] font-medium tracking-[-0.01em]">Review submitted. Contract closed.</h2>
                    <p className="mt-1 text-[14px] leading-[1.6] text-[var(--cw-text-secondary)]">
                        {vm.completedAt ? `Completed ${formatDateTime(vm.completedAt)}.` : 'The contract is complete.'} Rating summary: {vm.ratingSummary}.
                    </p>
                </div>
            </div>
        </section>
    );
}

function FilesTab({ vm, fileFilter, setFileFilter, onPreview }) {
    const normalizedFilter = fileFilter.toLowerCase();
    const filteredFiles = vm.files.filter((file) => normalizedFilter === 'all' || file.kind === normalizedFilter);

    return (
        <section className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-4 py-[14px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <SectionLabel>File Manager</SectionLabel>
                    <h2 className="mt-1 text-[18px] font-medium tracking-[-0.01em]">Shared, review, and final assets</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    {fileFilters.map((filter) => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setFileFilter(filter)}
                            className={focusable(`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors duration-[80ms] ${fileFilter === filter ? 'border-[var(--cw-text)] bg-[var(--cw-text)] text-[var(--cw-bg-page)]' : 'border-[var(--cw-border)] bg-[var(--cw-bg-modal)] text-[var(--cw-text-secondary)] hover:border-[var(--cw-border-hover)] hover:text-[var(--cw-text)]'}`)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-3 space-y-2">
                {filteredFiles.length > 0 ? filteredFiles.map((file) => <FileRow key={file.id} file={file} onPreview={onPreview} />) : <FilesEmpty vm={vm} />}
            </div>
        </section>
    );
}

function FileRow({ file, onPreview }) {
    return (
        <button
            type="button"
            onClick={() => onPreview(file)}
            className={focusable(`group flex w-full items-center gap-2 rounded-[10px] border border-l-[3px] border-[var(--cw-border)] ${file.leftBorder} bg-[var(--cw-bg-modal)] px-4 py-[14px] text-left transition-colors duration-[60ms] hover:border-[var(--cw-border-hover)] hover:bg-[var(--cw-bg-card)]`)}
        >
            <FileIcon kind={file.kind} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[var(--cw-text)]">{file.name}</p>
                <p className="truncate font-mono text-[13px] text-[var(--cw-text-secondary)]">
                    {[file.uploader, formatDate(file.date, 'Unknown'), file.size].filter(Boolean).join(' · ')}
                </p>
            </div>
            <span className={`hidden rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-[0.06em] sm:inline-flex ${file.badgeClass}`}>
                {file.statusLabel}
            </span>
            <span className="hidden translate-x-1 text-[13px] font-medium text-[var(--cw-text-secondary)] opacity-0 transition-all duration-[60ms] group-hover:translate-x-0 group-hover:text-[var(--cw-text)] group-hover:opacity-100 sm:inline">
                Open
            </span>
            <IconChevron />
        </button>
    );
}

function FilesEmpty({ vm }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-[10px] border border-dashed border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-4 py-[14px]">
            <div className="min-w-0">
                <p className="text-[14px] font-medium text-[var(--cw-text-secondary)]">No files shared yet</p>
                <p className="text-[13px] text-[var(--cw-text-tertiary)]">
                    {vm.currentRole === 'freelancer' ? 'Upload a delivery when work is ready.' : 'Files appear after the freelancer delivers or shares assets.'}
                </p>
            </div>
            {vm.currentRole === 'freelancer' && vm.canSubmitDelivery ? <button type="button" className={primaryButton()}>Upload file</button> : null}
        </div>
    );
}

function MilestonesTab({ vm, currentUser }) {
    return (
        <section className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-4 py-[14px]">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <SectionLabel>Milestones</SectionLabel>
                    <h2 className="mt-1 text-[18px] font-medium tracking-[-0.01em]">{vm.tasksDone}/{vm.totalTasks} completed</h2>
                </div>
                {currentUser.role === 'freelancer' && vm.milestones.length === 0 ? <button type="button" className={secondaryButton()}>+ Add milestone</button> : null}
            </div>

            {vm.milestones.length === 0 ? (
                <div className="mt-3 rounded-[10px] border border-dashed border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-4 py-[14px] text-[14px] text-[var(--cw-text-secondary)]">
                    No milestones defined.
                </div>
            ) : (
                <div className="mt-5 overflow-x-auto pb-2">
                    <div className="relative flex min-w-max gap-5 px-1">
                        <div className="absolute left-5 right-5 top-5 h-px bg-[var(--cw-border)]" />
                        <div className="absolute left-5 top-5 h-px bg-[var(--cw-action)]" style={{ width: `calc(${vm.progress}% - 2.5rem)` }} />
                        {vm.milestones.map((milestone, index) => <MilestoneDot key={milestone.id || index} milestone={milestone} index={index} />)}
                    </div>
                </div>
            )}
        </section>
    );
}

function MilestoneDot({ milestone, index }) {
    const done = ['completed', 'approved', 'paid'].includes(String(milestone.status || '').toLowerCase());
    return (
        <div className="relative w-52 shrink-0 pt-10">
            <div className={`absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border ${done ? 'border-[var(--cw-action)] bg-[var(--cw-action)] text-[var(--cw-bg-page)]' : 'border-[var(--cw-border)] bg-[var(--cw-bg-modal)] text-[var(--cw-text-secondary)]'}`}>
                {done ? <IconCheck /> : index + 1}
            </div>
            <div className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-4 py-[14px]">
                <p className="truncate text-[14px] font-medium">{milestone.title || milestone.description || `Milestone ${index + 1}`}</p>
                <p className="font-mono text-[13px] text-[var(--cw-text-secondary)]">{formatDate(milestone.due_date, 'No date')}</p>
                <span className="mt-3 inline-flex rounded-full border border-[var(--cw-border)] px-2 py-0.5 text-[11px] text-[var(--cw-text-secondary)]">
                    {done ? 'Done' : 'Open'}
                </span>
            </div>
        </div>
    );
}

function ActivityTab({ vm }) {
    return (
        <section className="rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-4 py-[14px]">
            <SectionLabel>Activity</SectionLabel>
            <h2 className="mt-1 text-[18px] font-medium tracking-[-0.01em]">Contract event history</h2>
            <div className="mt-3 space-y-2">
                {vm.activity.length > 0 ? vm.activity.map((event) => <ActivityRow key={event.id} event={event} />) : (
                    <div className="rounded-[10px] border border-dashed border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-4 py-[14px] text-[14px] text-[var(--cw-text-secondary)]">
                        No activity yet.
                    </div>
                )}
            </div>
        </section>
    );
}

function ActivityRow({ event }) {
    if (event.system) {
        return (
            <div className="flex justify-center">
                <div className="rounded-full border border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-3 py-1.5 text-center text-[13px] text-[var(--cw-text-secondary)]">
                    {event.message}{event.timestamp ? ` - ${formatTime(event.timestamp)}` : ''}
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-modal)] px-4 py-[14px]">
            <Avatar name={event.actorName} src={event.actorAvatarUrl} />
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14px] font-medium">{event.actorName || event.actorRole || 'User'}</p>
                    {event.actorRole ? <span className="rounded-full border border-[var(--cw-border)] px-2 py-0.5 text-[11px] text-[var(--cw-text-secondary)]">{event.actorRole}</span> : null}
                    {event.timestamp ? <span className="font-mono text-[13px] text-[var(--cw-text-secondary)]">{formatTime(event.timestamp)}</span> : null}
                </div>
                <p className="mt-1 text-[14px] leading-[1.6] text-[var(--cw-text-secondary)]">{event.message}</p>
            </div>
        </div>
    );
}

function FilePreviewOverlay({ file, closeRef, onClose, onOpen }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="File preview">
            <div className="w-full max-w-lg rounded-[14px] bg-[var(--cw-bg-modal)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <SectionLabel>File Preview</SectionLabel>
                        <h2 className="mt-1 truncate text-[18px] font-medium tracking-[-0.01em]">{file.name}</h2>
                        <p className="font-mono text-[13px] text-[var(--cw-text-secondary)]">
                            {[file.uploader, formatDate(file.date, 'Unknown'), file.size].filter(Boolean).join(' · ')}
                        </p>
                    </div>
                    <button ref={closeRef} type="button" onClick={onClose} className={secondaryButton()}>Close</button>
                </div>
                <div className="mt-4 rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-page)] px-4 py-[14px]">
                    <p className="text-[14px] leading-[1.6] text-[var(--cw-text-secondary)]">
                        This focused overlay prevents accidental opens. Press ESC to close, or continue to open according to contract access rules.
                    </p>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className={secondaryButton()}>Cancel</button>
                    <button type="button" onClick={onOpen} className={primaryButton()}>Open file</button>
                </div>
            </div>
        </div>
    );
}

function SectionLabel({ children }) {
    return <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--cw-text-tertiary)]">{children}</p>;
}

function StatusBadge({ status }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
            {status.icon}
            {status.label}
        </span>
    );
}

function HeaderChip({ icon, label, prominent, className = '' }) {
    return (
        <span className={`items-center gap-1.5 rounded-full border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-2.5 py-1.5 font-mono ${prominent ? 'text-[13px] text-[var(--cw-text)]' : 'text-[13px] text-[var(--cw-text-secondary)]'} ${className}`}>
            {icon}
            {label}
        </span>
    );
}

function Avatar({ name, src }) {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] text-[13px] font-medium text-[var(--cw-text-secondary)]">
            {src ? <img src={src} alt={name || 'User'} className="h-full w-full object-cover" /> : initials(name)}
        </div>
    );
}

function FileIcon({ kind }) {
    const Icon = kind === 'final' ? IconCheck : kind === 'review' ? IconReview : IconFile;
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[var(--cw-border)] bg-[var(--cw-bg-card)] text-[var(--cw-text-secondary)]">
            <Icon />
        </div>
    );
}

function buildViewModel(contract, currentUser) {
    const statusKey = normalizeStatus(contract.status);
    const currentRole = currentUser.role === 'freelancer' ? 'freelancer' : 'client';
    const milestones = Array.isArray(contract.milestones) ? contract.milestones : [];
    const tasksDone = milestones.filter((m) => ['completed', 'approved', 'paid'].includes(String(m.status || '').toLowerCase())).length;
    const totalTasks = milestones.length;
    const progress = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : statusKey === 'completed' ? 100 : 0;
    const revisionsUsed = Number(contract.revisionRequestsCount ?? contract.revision_requests_count ?? 0);
    const revisionsMax = Number(contract.maxRevisionRounds ?? contract.max_revision_rounds ?? 2);
    const revisionsLeft = Math.max(revisionsMax - revisionsUsed, 0);
    const reviewFiles = normalizeFiles(contract.reviewFiles || contract.review_files || [], 'review');
    const finalFiles = normalizeFiles(contract.finalFiles || contract.final_files || [], 'final');
    const sharedFiles = normalizeFiles(contract.sharedFiles || contract.shared_files || [], 'shared');
    const files = [...reviewFiles, ...finalFiles, ...sharedFiles];
    const isCompleted = statusKey === 'completed';
    const canSubmitDelivery = currentRole === 'freelancer' && ['active', 'revision_requested'].includes(statusKey);
    const canReviewDelivery = currentRole === 'client' && statusKey === 'delivery_submitted';

    return {
        id: contract.id,
        title: contract.title || contract.job?.title || 'Untitled contract',
        status: statusMeta(statusKey),
        amount: contract.amount ?? contract.total_amount ?? 0,
        deadline: contract.deadline || contract.job?.deadline || contract.dueDate || null,
        completedAt: contract.completedAt || contract.completed_at || null,
        ratingSummary: contract.ratingSummary || contract.rating_summary || '5 stars',
        counterpartyName: currentRole === 'client' ? contract.freelancer?.full_name || 'Freelancer' : contract.client?.full_name || 'Client',
        counterpartyAvatar: currentRole === 'client' ? contract.freelancer?.avatar_url : contract.client?.avatar_url,
        currentRole,
        milestones,
        tasksDone,
        totalTasks,
        progress,
        revisionsUsed,
        revisionsMax,
        revisionsLeft,
        reviewFiles,
        finalFiles,
        sharedFiles,
        files,
        activity: normalizeActivity(contract.activity || contract.activityEvents || []),
        isCompleted,
        canSubmitDelivery,
        canReviewDelivery,
        nextMove: nextMoveFor(statusKey, currentRole, canSubmitDelivery, canReviewDelivery, isCompleted),
    };
}

function normalizeFiles(files, kind) {
    return files.map((file, index) => {
        const accessState = file.accessState || file.access_state || '';
        const released = kind === 'final' && accessState === 'released';
        const statusLabel = kind === 'review' ? 'Review Asset' : kind === 'final' ? released ? 'Released' : 'Pending' : 'Shared';

        return {
            ...file,
            id: file.id || `${kind}-${index}`,
            name: file.name || file.file_name || 'Untitled file',
            uploader: file.uploader || file.senderName || file.uploaded_by || (kind === 'shared' ? 'Client upload' : 'Freelancer'),
            date: file.date || file.uploadedAt || file.created_at || null,
            size: file.size || file.sizeBytes || file.size_bytes || null,
            kind,
            statusLabel,
            leftBorder: kind === 'review' ? 'border-l-[var(--cw-review)]' : kind === 'final' ? 'border-l-[var(--cw-action)]' : 'border-l-[var(--cw-info)]',
            badgeClass: kind === 'review'
                ? 'border-[var(--cw-review)] bg-[var(--cw-review-bg)] text-[var(--cw-text)]'
                : kind === 'final'
                    ? 'border-[var(--cw-action)] bg-[var(--cw-action-bg)] text-[var(--cw-text)]'
                    : 'border-[var(--cw-info)] bg-[var(--cw-info-bg)] text-[var(--cw-text)]',
        };
    });
}

function normalizeActivity(activity) {
    return activity.map((event, index) => ({
        id: event.id || `activity-${index}`,
        message: event.message || event.text || 'Contract event',
        timestamp: event.timestamp || event.created_at || null,
        actorName: event.actorName || event.actor_name || null,
        actorRole: event.actorRole || event.actor_role || null,
        actorAvatarUrl: event.actorAvatarUrl || event.actor_avatar_url || null,
        system: Boolean(event.system || event.actorRole === 'system' || event.actor_role === 'system'),
    }));
}

function nextMoveFor(statusKey, role, canSubmitDelivery, canReviewDelivery, isCompleted) {
    if (canSubmitDelivery) {
        return {
            icon: <IconUpload />,
            title: statusKey === 'revision_requested' ? 'Submit revised delivery' : 'Submit delivery',
            body: 'Upload review files and protected final files. Final assets stay locked until client acceptance.',
            primary: 'Submit delivery',
            borderClass: 'border-l-[var(--cw-action)]',
            bgClass: 'bg-[var(--cw-action-bg)]',
        };
    }

    if (canReviewDelivery) {
        return {
            icon: <IconReview />,
            title: 'Review delivered work',
            body: 'Inspect review assets, then approve and release escrow or request revision.',
            primary: 'Approve work',
            borderClass: 'border-l-[var(--cw-action)]',
            bgClass: 'bg-[var(--cw-action-bg)]',
        };
    }

    if (isCompleted) {
        return {
            icon: <IconCheck />,
            title: 'Contract completed',
            body: 'Payment and delivery are finalized. The workspace is now a read-only contract record.',
            primary: null,
            borderClass: 'border-l-[var(--cw-complete)]',
            bgClass: 'bg-[var(--cw-complete-bg)]',
        };
    }

    return {
        icon: <IconActivity />,
        title: role === 'client' ? 'Waiting for delivery' : 'Work in progress',
        body: role === 'client' ? 'The freelancer is working. Delivery files will appear here when submitted.' : 'Keep the client updated and submit delivery when ready.',
        primary: null,
        borderClass: 'border-l-[var(--cw-info)]',
        bgClass: 'bg-[var(--cw-info-bg)]',
    };
}

function getClientActions(vm) {
    if (!vm.canReviewDelivery) return [];
    return [{ label: 'Approve work' }, { label: 'Request revision' }, { label: 'Release payment' }];
}

function getFreelancerActions(vm) {
    if (!vm.canSubmitDelivery) return [];
    return [{ label: 'Submit delivery' }, { label: 'Upload file' }, { label: 'Message client' }];
}

function normalizeStatus(status) {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'in_review') return 'delivery_submitted';
    return value || 'active';
}

function statusMeta(statusKey) {
    if (statusKey === 'active') return { label: 'Active', className: 'border-[var(--cw-action)] bg-[var(--cw-action-bg)] text-[var(--cw-text)] contract-active-pulse', icon: <IconActivity /> };
    if (statusKey === 'delivery_submitted') return { label: 'Review', className: 'border-[var(--cw-review)] bg-[var(--cw-review-bg)] text-[var(--cw-text)]', icon: <IconReview /> };
    if (statusKey === 'revision_requested') return { label: 'Revision', className: 'border-[var(--cw-review)] bg-[var(--cw-review-bg)] text-[var(--cw-text)]', icon: <IconMilestone /> };
    if (statusKey === 'completed') return { label: 'Completed', className: 'border-[var(--cw-complete)] bg-[var(--cw-complete-bg)] text-[var(--cw-text)]', icon: <IconCheck /> };
    if (statusKey === 'disputed') return { label: 'Disputed', className: 'border-[var(--cw-danger)] bg-[var(--cw-danger-bg)] text-[var(--cw-text)]', icon: <IconDanger /> };
    return { label: 'Pending', className: 'border-[var(--cw-info)] bg-[var(--cw-info-bg)] text-[var(--cw-text)]', icon: <IconWallet /> };
}

function primaryButton() {
    return focusable('rounded-lg bg-[var(--cw-action)] px-3 py-2 text-[14px] font-medium text-[var(--cw-text)] transition-colors duration-[80ms] hover:bg-[#24b889]');
}

function secondaryButton() {
    return focusable('rounded-lg border border-[var(--cw-border)] bg-[var(--cw-bg-card)] px-3 py-2 text-[14px] font-medium text-[var(--cw-text-secondary)] transition-colors duration-[80ms] hover:border-[var(--cw-border-hover)] hover:text-[var(--cw-text)]');
}

function focusable(className) {
    return `${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cw-action)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cw-bg-page)]`;
}

function formatAmount(value) {
    const amount = Number(value || 0);
    return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0)} TND`;
}

function formatDate(value, fallback) {
    if (!value) return fallback;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString();
}

function formatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function initials(name) {
    return String(name || 'U').trim().slice(0, 2).toUpperCase();
}

function Svg({ children }) {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">{children}</svg>;
}

function IconPulse() { return <Svg><path d="M3 12h4l2-6 4 12 2-6h6" /></Svg>; }
function IconFile() { return <Svg><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></Svg>; }
function IconMilestone() { return <Svg><path d="M4 6h16" /><path d="M4 12h10" /><path d="M4 18h7" /></Svg>; }
function IconActivity() { return <Svg><path d="M12 8v5l3 2" /><path d="M21 12a9 9 0 1 1-3-6.7" /></Svg>; }
function IconWallet() { return <Svg><path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /><path d="M16 12h4" /><path d="M6 7V5a2 2 0 0 1 2-2h8" /></Svg>; }
function IconCalendar() { return <Svg><path d="M7 3v4" /><path d="M17 3v4" /><path d="M4 9h16" /><path d="M5 5h14v16H5z" /></Svg>; }
function IconDots() { return <Svg><path d="M12 12h.01" /><path d="M19 12h.01" /><path d="M5 12h.01" /></Svg>; }
function IconCheck() { return <Svg><path d="M20 6 9 17l-5-5" /></Svg>; }
function IconReview() { return <Svg><path d="M4 5h16v14H4z" /><path d="m8 12 2 2 5-5" /></Svg>; }
function IconUpload() { return <Svg><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></Svg>; }
function IconDanger() { return <Svg><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 4.3 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" /></Svg>; }
function IconChevron() { return <Svg><path d="m9 18 6-6-6-6" /></Svg>; }

const workspaceStyles = `
@keyframes contractTabIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes contractActivePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}
.contract-tab-panel {
  animation: contractTabIn 150ms ease-out;
}
.contract-active-pulse {
  animation: contractActivePulse 2s ease-in-out infinite;
}
`;
