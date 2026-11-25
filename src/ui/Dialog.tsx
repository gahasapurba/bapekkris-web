import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';
import { useModalBehavior } from './useModalBehavior';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  /** Buttons row at the bottom. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Prevents closing with Escape / backdrop while something is in progress. */
  dismissible?: boolean;
}

const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

/**
 * Modal dialog: rendered in a portal, labelled for screen readers, keeps keyboard focus inside,
 * closes on Escape and backdrop click, and returns focus to where it was opened from.
 */
export function Dialog({ open, onClose, title, description, children, footer, size = 'md', dismissible = true }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useModalBehavior(panelRef, open, onClose, dismissible);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && dismissible) onClose(); }}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-xl border border-line bg-surface shadow-card outline-none sm:rounded-lg', widths[size])}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="font-display text-xl font-semibold text-ink">{title}</h2>
            {description && <p id={descriptionId} className="text-[0.9rem] text-muted">{description}</p>}
          </div>
          {dismissible && (
            <button type="button" onClick={onClose} aria-label="Tutup" className="-mr-2 cursor-pointer rounded-full border-0 bg-transparent p-2 text-muted hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-navy-ink">
              <X size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        {children && <div className="overflow-y-auto px-6 py-5 text-ink">{children}</div>}
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line bg-page px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
