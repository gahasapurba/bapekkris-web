import type { ReactNode } from 'react';
import { cn } from './cn';

interface PageHeaderProps {
  /** Small label above the title (section / category). */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}

/** Editorial page heading: serif title, generous whitespace, optional actions. */
export function PageHeader({ eyebrow, title, description, actions, align = 'center', className }: PageHeaderProps) {
  const centered = align === 'center';
  return (
    <header className={cn('flex flex-col gap-4 pb-10 pt-12 md:pb-14 md:pt-16', centered ? 'items-center text-center' : 'items-start', className)}>
      {eyebrow && <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-gold-ink">{eyebrow}</p>}
      <h1 className="font-display text-[clamp(2rem,4.5vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-ink">{title}</h1>
      {description && <div className={cn('max-w-[62ch] text-[1.05rem] leading-relaxed text-muted', centered && 'mx-auto')}>{description}</div>}
      {actions && <div className={cn('mt-2 flex flex-wrap gap-3', centered && 'justify-center')}>{actions}</div>}
    </header>
  );
}
