import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModalBehavior } from './useModalBehavior';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Side panel sliding in from the right (mobile navigation, filters). */
export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useModalBehavior(panelRef, open, onClose);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100000] flex justify-end bg-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}
        className="flex h-full w-[min(360px,88vw)] flex-col border-l border-line bg-surface shadow-card outline-none">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-display text-lg font-semibold text-ink">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="-mr-2 cursor-pointer rounded-full border-0 bg-transparent p-2 text-muted hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-navy-ink">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">{children}</div>
        {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
