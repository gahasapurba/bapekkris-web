import { useEffect, useRef, type RefObject } from 'react';

/** Open modal panels, top-most last: only the top one reacts to Escape / Tab. */
const openPanels: HTMLElement[] = [];

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Shared behaviour of modal surfaces (Dialog, Sheet): focuses the first control (or one marked
 * data-autofocus), keeps Tab inside, closes on Escape (only the top-most of stacked modals), locks page scroll, and restores focus to
 * the element that opened it.
 */
export function useModalBehavior(panelRef: RefObject<HTMLElement | null>, open: boolean, onClose: () => void, dismissible = true): void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    if (panel) openPanels.push(panel);
    (panel?.querySelector<HTMLElement>('[data-autofocus]') ?? panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (panel && openPanels[openPanels.length - 1] !== panel) return;
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab' && panel) {
        const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (panel) openPanels.splice(openPanels.indexOf(panel), 1);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, dismissible, panelRef]);
}
