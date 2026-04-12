import type { ReactNode } from 'react';

export type ProfileAccentType = 'freelancer' | 'client';

function joinClasses(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

function getInitials(name: string): string {
  const parts = name
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'U';
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
}

function getAccentColor(type: ProfileAccentType): string {
  return type === 'client' ? '#F59E0B' : '#8B5CF6';
}

function getAvatarGradientClass(type: ProfileAccentType): string {
  return type === 'client'
    ? 'bg-gradient-to-br from-[#F59E0B] to-[#D97706]'
    : 'bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]';
}

function getRingClass(type: ProfileAccentType): string {
  return type === 'client' ? 'ring-[#F59E0B]/30' : 'ring-[#8B5CF6]/30';
}

export function ProfileAvatar({
  type,
  name,
  imageUrl,
  showOnlineDot = false,
  className,
}: {
  type: ProfileAccentType;
  name: string;
  imageUrl?: string | null;
  showOnlineDot?: boolean;
  className?: string;
}) {
  const ringClass = getRingClass(type);
  const avatarBaseClass = joinClasses(
    'w-[88px] h-[88px] rounded-full ring-4 ring-offset-2 ring-offset-[var(--card-bg)]',
    ringClass,
  );

  return (
    <div className={joinClasses('relative shrink-0', className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className={joinClasses(avatarBaseClass, 'object-cover')} />
      ) : (
        <div
          className={joinClasses(
            avatarBaseClass,
            getAvatarGradientClass(type),
            'flex items-center justify-center text-3xl font-black text-white select-none',
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {showOnlineDot ? (
        <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-400 rounded-full ring-2 ring-[var(--card-bg)]" />
      ) : null}
    </div>
  );
}

export function ProfileSectionCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={joinClasses(
        'bg-[var(--card-bg)] rounded-2xl border border-white/7 p-6 mb-4 transition-all duration-200 hover:border-white/12',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ProfileSectionHeader({
  title,
  accentColor,
  isOwner,
  onEdit,
  editLabel = 'Edit',
  editIcon,
}: {
  title: string;
  accentColor: string;
  isOwner?: boolean;
  onEdit?: () => void;
  editLabel?: string;
  editIcon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-5 rounded-full" style={{ backgroundColor: accentColor }} />
        <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: `${accentColor}CC` }}>
          {title}
        </span>
      </div>

      {isOwner && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs text-white/30 px-2.5 py-1.5 rounded-lg border border-transparent transition-all duration-150"
          style={{
            ['--profile-accent' as string]: accentColor,
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.color = accentColor;
            event.currentTarget.style.backgroundColor = `${accentColor}14`;
            event.currentTarget.style.borderColor = `${accentColor}33`;
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.color = 'rgba(255,255,255,0.3)';
            event.currentTarget.style.backgroundColor = 'transparent';
            event.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {editIcon}
          {editLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ProfileStatCard({
  icon,
  value,
  label,
  accentColor,
  suffix,
  className,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  accentColor: string;
  suffix?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={joinClasses(
        'bg-white/[0.03] rounded-xl p-4 border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200 group',
        className,
      )}
    >
      <div className="mb-3" style={{ color: `${accentColor}B3` }}>
        {icon}
      </div>
      <p className="text-2xl font-black text-white leading-none flex items-center gap-2">
        {value}
        {suffix}
      </p>
      <p className="text-xs text-white/40 mt-1.5 font-medium uppercase tracking-wide">{label}</p>
    </article>
  );
}

export function ProfileEmptyState({
  icon,
  title,
  description,
  cta,
  onCta,
  accentColor,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: string;
  onCta?: () => void;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-white/8 bg-white/[0.02] text-center">
      <div className="w-10 h-10 mx-auto mb-3 text-white/15">{icon}</div>
      <p className="text-sm font-semibold text-white/40 mb-1">{title}</p>
      <p className="text-xs text-white/25 max-w-[200px] mx-auto">{description}</p>
      {cta && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="mt-3 text-xs font-semibold hover:underline cursor-pointer"
          style={{ color: accentColor }}
        >
          {cta}
        </button>
      ) : null}
    </div>
  );
}

export function ProfileInfoHeader({
  icon,
  title,
  accentColor,
}: {
  icon: ReactNode;
  title: string;
  accentColor: string;
}) {
  return (
    <div className="w-full flex items-center gap-2.5 mb-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
    </div>
  );
}

export function ProfileInfoRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={joinClasses('py-2.5 border-b border-white/5 last:border-0 flex justify-between items-center gap-3', className)}>
      <span className="text-xs text-white/40 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

export { getAccentColor };
