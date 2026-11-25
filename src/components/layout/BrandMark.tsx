import { cn } from '../../ui';

const LOGO_LIGHT = '/assets/mandiri-club-bapekkris-original.png';
const LOGO_DARK = '/assets/mandiri-club-bapekkris-white.png';

/** Mandiri Club logo + "Bapekkris" wordmark. */
export function BrandMark({ isDark, compact = false, className }: { isDark: boolean; compact?: boolean; className?: string }) {
  return (
    <span className={cn('flex min-w-0 items-center gap-3', className)}>
      <img
        src={isDark ? LOGO_DARK : LOGO_LIGHT}
        alt=""
        className="h-9 w-auto shrink-0 object-contain"
        onError={(e) => { e.currentTarget.src = LOGO_LIGHT; }}
      />
      <span className="h-7 w-px shrink-0 bg-line" aria-hidden="true" />
      <span className="flex min-w-0 flex-col leading-none">
        <span className="font-display text-[1.15rem] font-semibold tracking-[-0.01em] text-ink">Bapekkris</span>
        {!compact && <span className="mt-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-dim">Bank Mandiri</span>}
      </span>
    </span>
  );
}
