import { ChevronRight, Megaphone, X } from 'lucide-react';

interface AnnouncementBarProps {
  bar: { badge?: string; message?: string; text?: string; ctaText?: string; ctaLabel?: string; ctaTab?: string };
  onCta: (tab: string) => void;
  onDismiss: () => void;
}

/** Thin site-wide notice above the header, managed from Admin → Visibilitas menu. */
export default function AnnouncementBar({ bar, onCta, onDismiss }: AnnouncementBarProps) {
  const cta = bar.ctaText || bar.ctaLabel;
  return (
    <div role="region" aria-label="Pengumuman" className="relative z-[60] bg-navy text-white">
      <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-4 py-2 md:px-6">
        <Megaphone size={16} aria-hidden="true" className="hidden shrink-0 text-[#e3b341] sm:block" />
        {bar.badge && <span className="shrink-0 rounded-full bg-[#e3b341] px-2.5 py-0.5 text-[0.72rem] font-bold uppercase tracking-wide text-[#14110a]">{bar.badge}</span>}
        <p className="line-clamp-2 min-w-0 flex-1 text-[0.86rem] leading-snug sm:line-clamp-1 sm:text-[0.88rem]" title={bar.message || bar.text}>{bar.message || bar.text}</p>
        {cta && bar.ctaTab && (
          <button type="button" onClick={() => onCta(bar.ctaTab!)}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[rgba(255,255,255,0.35)] bg-transparent px-3 py-1 text-[0.82rem] font-semibold text-white hover:bg-[rgba(255,255,255,0.12)] focus-visible:outline-2 focus-visible:outline-white">
            {cta}<ChevronRight size={14} aria-hidden="true" />
          </button>
        )}
        <button type="button" onClick={onDismiss} aria-label="Tutup pengumuman"
          className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-white hover:bg-[rgba(255,255,255,0.12)] focus-visible:outline-2 focus-visible:outline-white">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
