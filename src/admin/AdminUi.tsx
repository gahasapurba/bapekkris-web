import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../ui';

/** Building blocks for admin tabs (concept B "Corporate Bento"). */

export function AdminPanel({ title, description, actions, children, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn('flex flex-col gap-5 rounded-lg border border-line bg-surface p-5 shadow-card md:p-6', className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[1.3rem] font-semibold leading-snug text-ink">{title}</h2>
          {description && <p className="mt-1 max-w-[70ch] text-[0.88rem] leading-relaxed text-muted">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

/** Inset block inside a panel, e.g. a create form. */
export function AdminSubsection({ title, children, className }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-md border border-line bg-subtle p-4 md:p-5', className)}>
      {title && <h3 className="text-[0.98rem] font-semibold text-ink">{title}</h3>}
      {children}
    </div>
  );
}

export function AdminList({ children, label }: { children: ReactNode; label?: string }) {
  return <ul aria-label={label} className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">{children}</ul>;
}

export function AdminListRow({ meta, title, subtitle, actions }: { meta?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3 bg-surface px-4 py-3 hover:bg-surface-hover">
      <div className="min-w-0">
        {meta && <div className="mb-1 flex flex-wrap items-center gap-2 text-[0.78rem] text-muted">{meta}</div>}
        <p className="font-semibold leading-snug text-ink">{title}</p>
        {subtitle && <p className="mt-0.5 text-[0.84rem] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </li>
  );
}

export function AdminEmpty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed border-line px-6 py-10 text-center text-[0.9rem] text-muted">{children}</p>;
}

export function IconButton({ label, tone = 'neutral', className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'neutral' | 'danger' }) {
  return (
    <button type="button" aria-label={label} title={label} {...rest}
      className={cn('inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink disabled:cursor-not-allowed disabled:opacity-50',
        tone === 'danger' ? 'text-danger hover:bg-danger-tint' : 'text-muted hover:bg-subtle hover:text-ink', className)}>
      {children}
    </button>
  );
}

/** Accessible on/off switch. */
export function Switch({ checked, onChange, label, className }: { checked: boolean; onChange: (next: boolean) => void; label: string; className?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-0 p-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink',
        checked ? 'bg-success' : 'bg-line-strong', className)}>
      <span className={cn('block size-5 rounded-full bg-white shadow-card transition-transform', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}
