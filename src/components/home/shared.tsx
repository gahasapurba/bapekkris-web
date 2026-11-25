import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../../ui';

/** Width and padding of a home page section. */
export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-[1120px] px-4 md:px-6', className)}>{children}</div>;
}

/** Vertical rhythm of the home page; `tone="subtle"` alternates the background. */
export function Section({ tone = 'page', className, children, labelledBy }: { tone?: 'page' | 'subtle'; className?: string; children: ReactNode; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={cn('py-16 md:py-24', tone === 'subtle' && 'border-y border-line bg-subtle', className)}>
      {children}
    </section>
  );
}

interface SectionHeadingProps {
  id?: string;
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: { label: string; onClick: () => void };
  align?: 'left' | 'center';
}

export function SectionHeading({ id, eyebrow, title, description, action, align = 'left' }: SectionHeadingProps) {
  const centered = align === 'center';
  return (
    <div className={cn('mb-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4', centered && 'flex-col items-center text-center')}>
      <div className={cn('flex max-w-[60ch] flex-col gap-3', centered && 'items-center')}>
        <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-gold-ink">{eyebrow}</p>
        <h2 id={id} className="font-display text-[clamp(1.7rem,3.4vw,2.4rem)] font-semibold leading-[1.12] text-ink">{title}</h2>
        {description && <p className="text-[1rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {action && (
        <button type="button" onClick={action.onClick} className="group inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[0.92rem] font-semibold text-navy-ink hover:underline">
          {action.label}
          <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

/** Two-letter initials for people without a photo. */
export function initials(name: string): string {
  return String(name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function truncate(text: string | undefined, max: number): string {
  const value = text || '';
  return value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;
}
