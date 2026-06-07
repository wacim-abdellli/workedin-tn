/**
 * CollapsibleMessageText.tsx
 * A self-contained "Read More / Read Less" text component for long messages.
 * Extracted from the Messages.tsx god component.
 */
import { useState } from 'react';
import { useTranslation } from '../../i18n';

interface CollapsibleMessageTextProps {
    text: string;
    isDeleted: boolean;
    isOwnMessage: boolean;
    maxLength?: number;
}

export const CollapsibleMessageText = ({
    text,
    isDeleted,
    isOwnMessage,
    maxLength = 300,
}: CollapsibleMessageTextProps) => {
    const { tx } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!text || text.length <= maxLength) {
        return (
            <p
                className={`whitespace-pre-wrap break-words ${isDeleted ? 'italic leading-tight' : ''}`}
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}
            >
                {text}
                {!isDeleted && <span className="inline-block w-14 h-1 select-none pointer-events-none" />}
            </p>
        );
    }

    const displayText = isExpanded ? text : `${text.slice(0, maxLength)}...`;

    return (
        <div>
            <p
                className={`whitespace-pre-wrap break-words ${isDeleted ? 'italic leading-tight' : ''}`}
                style={{ wordBreak: 'break-word', overflowWrap: 'break-word', wordWrap: 'break-word' }}
            >
                {displayText}
                {!isDeleted && <span className="inline-block w-14 h-1 select-none pointer-events-none" />}
            </p>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`mt-1 text-[11px] font-semibold tracking-wide uppercase opacity-70 hover:opacity-100 transition-opacity ${
                    isOwnMessage ? 'text-white' : 'text-amber-500'
                }`}
            >
                {isExpanded
                    ? tx('pages.messages.seeLess', {}, 'See less')
                    : tx('pages.messages.seeMore', {}, 'See more')}
            </button>
        </div>
    );
};
