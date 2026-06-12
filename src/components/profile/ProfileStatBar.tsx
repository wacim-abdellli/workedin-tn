/**
 * ProfileStatBar - Hidden by default to match Upwork design
 * The reference design doesn't show a stat bar, so this component is minimal
 */


import type { ProfileHeroVariant } from './ProfileHero';

export interface ProfileStat {
    label: string;
    value: string | number;
    highlight?: boolean;
}

interface ProfileStatBarProps {
    stats: ProfileStat[];
    variant: ProfileHeroVariant;
}

export function ProfileStatBar({ stats: _stats, variant: _variant }: ProfileStatBarProps) {
    // Hidden by default to match Upwork reference design
    return null;
}
