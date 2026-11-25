import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './cn';

interface PaginationProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
  /** e.g. "acara" → "1–8 dari 20 acara". */
  itemLabel: string;
  total: number;
  pageSize: number;
  className?: string;
}

/** Numbered pagination with ellipses for long ranges. Renders nothing for a single page. */
export function Pagination({ page, pageCount, onChange, itemLabel, total, pageSize, className }: PaginationProps) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => pageCount <= 7 || p === 1 || p === pageCount || Math.abs(p - page) <= 1
  );
  const btn = 'inline-flex h-9 min-w-9 cursor-pointer items-center justify-center gap-1 rounded-full border px-3 text-[0.84rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink';
  return (
    <nav aria-label={`Halaman ${itemLabel}`} className={cn('flex flex-wrap items-center justify-between gap-3 text-[0.84rem] text-muted', className)}>
      <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} dari {total} {itemLabel}</span>
      <span className="flex flex-wrap items-center gap-1.5">
        <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)} className={cn(btn, 'border-line bg-surface text-ink hover:border-line-strong')}>
          <ChevronLeft size={15} aria-hidden="true" /><span className="max-sm:sr-only">Sebelumnya</span>
        </button>
        {pages.map((p, i) => (
          <span key={p} className="flex items-center gap-1.5">
            {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-dim" aria-hidden="true">…</span>}
            <button type="button" onClick={() => onChange(p)} aria-current={p === page ? 'page' : undefined}
              className={cn(btn, p === page ? 'border-action bg-action text-on-action' : 'border-line bg-surface text-ink hover:border-line-strong')}>
              {p}
            </button>
          </span>
        ))}
        <button type="button" disabled={page === pageCount} onClick={() => onChange(page + 1)} className={cn(btn, 'border-line bg-surface text-ink hover:border-line-strong')}>
          <span className="max-sm:sr-only">Berikutnya</span><ChevronRight size={15} aria-hidden="true" />
        </button>
      </span>
    </nav>
  );
}
