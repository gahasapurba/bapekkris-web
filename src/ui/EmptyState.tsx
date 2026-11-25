import type { ReactNode } from 'react';
import { cn } from './cn';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-lg border border-dashed border-line px-6 py-12 text-center', className)}>
      {icon && <div className="flex size-12 items-center justify-center rounded-full bg-subtle text-muted" aria-hidden="true">{icon}</div>}
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      {description && <div className="max-w-md text-[0.92rem] text-muted">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
