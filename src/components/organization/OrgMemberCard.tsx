import { useState } from 'react';
import type { AppItem } from '../../lib/supabase';
import { cn } from '../../ui';

function initials(name: string): string {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

interface OrgMemberCardProps {
  member: AppItem;
  roleName: string;
  subDivisionName?: string;
  onClick: () => void;
  compact?: boolean;
}

/** Person in the org chart. Plain hex/rgba colours only: the chart is exported with html2canvas. */
export function OrgMemberCard({ member, roleName, subDivisionName, onClick, compact = false }: OrgMemberCardProps) {
  const [imageError, setImageError] = useState(false);
  return (
    <button type="button" onClick={onClick}
      data-pdf-card className={cn('flex w-full cursor-pointer items-center gap-3 rounded-lg border border-line bg-surface text-left shadow-card transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink',
        compact ? 'p-3' : 'p-4')}>
      <span className={cn('relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-subtle font-display font-semibold text-muted', compact ? 'size-11 text-[0.95rem]' : 'size-14 text-[1.1rem]')}>
        {member.image && !imageError
          ? <img src={member.image} alt="" className="size-full object-cover" onError={() => setImageError(true)} />
          : <span aria-hidden="true">{initials(member.name)}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block break-words text-[0.72rem] font-semibold uppercase leading-snug tracking-[0.1em] text-gold-ink">{roleName || 'Pelayan'}{subDivisionName ? ` · ${subDivisionName}` : ''}</span>
        <span className={cn('block truncate font-display font-semibold text-ink', compact ? 'text-[0.98rem]' : 'text-[1.08rem]')}>{member.name}</span>
        {!compact && member.motto && <span className="block truncate text-[0.82rem] italic text-muted">“{member.motto}”</span>}
      </span>
    </button>
  );
}
