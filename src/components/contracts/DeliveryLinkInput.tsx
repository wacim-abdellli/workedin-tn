import { useState } from 'react';
import { PlusCircle, Info } from 'lucide-react';
import { CATEGORIES } from './deliveryFormConstants';
import type { DeliveryLink } from './types';

type DeliveryLinkInputProps = {
    onAddLink: (link: DeliveryLink) => void;
};

export default function DeliveryLinkInput({ onAddLink }: DeliveryLinkInputProps) {
    const [newUrl, setNewUrl] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newCategory, setNewCategory] = useState<DeliveryLink['category']>('github');
    const [newKind, setNewKind] = useState<DeliveryLink['link_kind']>('review_link');
    const [newCredentials, setNewCredentials] = useState('');
    const [linkError, setLinkError] = useState<string | null>(null);

    const handleAddLink = () => {
        setLinkError(null);

        const trimmedUrl = newUrl.trim();
        if (!trimmedUrl) {
            setLinkError('URL is required');
            return;
        }

        if (!/^https?:\/\/\S+\.\S+/.test(trimmedUrl)) {
            setLinkError('Please enter a valid URL (starting with http:// or https://)');
            return;
        }

        const label = newLabel.trim() || CATEGORIES.find(c => c.value === newCategory)?.label || 'Link';

        const newLinkItem: DeliveryLink = {
            url: trimmedUrl,
            label,
            category: newCategory,
            link_kind: newKind,
            credentials: newKind === 'final_link' && newCredentials.trim() ? newCredentials.trim() : undefined,
        };

        onAddLink(newLinkItem);
        setNewUrl('');
        setNewLabel('');
        setNewCredentials('');
        setNewCategory('github');
    };

    return (
        <div className="space-y-2 rounded-lg border border-white/[0.05] bg-black/40 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Add Deliverable Link</p>
            <div className="grid grid-cols-2 gap-2">
                <label className="block">
                    <span className="text-[10px] text-zinc-500">Category</span>
                    <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as DeliveryLink['category'])}
                        className="mt-1 w-full rounded-md border border-white/[0.08] bg-[#070709] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-violet-400/50"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </label>
                <label className="block">
                    <span className="text-[10px] text-zinc-500">Release Stage</span>
                    <select
                        value={newKind}
                        onChange={(e) => setNewKind(e.target.value as DeliveryLink['link_kind'])}
                        className="mt-1 w-full rounded-md border border-white/[0.08] bg-[#070709] px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-violet-400/50"
                    >
                        <option value="review_link">🔓 For Review (Staging/Preview)</option>
                        <option value="final_link">🔒 Final Hand-off (Escrow Locked)</option>
                    </select>
                </label>
            </div>

            <div className="grid grid-cols-12 gap-2">
                <div className="col-span-4">
                    <span className="text-[10px] text-zinc-500">Label / Name</span>
                    <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. Figma System"
                        className="mt-1 w-full rounded-md border border-white/[0.08] bg-[#070709] px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-650 focus:border-violet-400/50"
                    />
                </div>
                <div className="col-span-8">
                    <span className="text-[10px] text-zinc-500">URL</span>
                    <div className="mt-1 flex gap-1.5">
                        <input
                            type="text"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-md border border-white/[0.08] bg-[#070709] px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-650 focus:border-violet-400/50"
                        />
                        <button
                            type="button"
                            onClick={handleAddLink}
                            className="flex items-center justify-center rounded-md bg-violet-650/20 px-3 text-violet-300 border border-violet-500/20 hover:bg-violet-600/40 active:scale-95 transition-all"
                        >
                            <PlusCircle className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {newKind === 'final_link' && (
                <label className="block">
                    <span className="text-[10px] text-zinc-500">Escrow Locked Credentials / Access Keys</span>
                    <textarea
                        value={newCredentials}
                        onChange={(e) => setNewCredentials(e.target.value)}
                        placeholder="e.g. Login user & password (hidden securely until escrow payment approval)"
                        rows={1.5}
                        className="mt-1 w-full resize-none rounded-md border border-white/[0.08] bg-[#070709] px-2.5 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-650 focus:border-violet-400/50"
                    />
                </label>
            )}

            {linkError && (
                <p className="text-[10.5px] text-red-300 mt-1 flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" /> {linkError}
                </p>
            )}
        </div>
    );
}
