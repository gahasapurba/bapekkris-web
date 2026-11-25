import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from './cn';
import { Button } from './Button';
import { Dialog } from './Dialog';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: ReactNode;
}

interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. */
  danger?: boolean;
}

interface FeedbackApi {
  toast: (message: ReactNode, tone?: ToastTone) => void;
  /** Accessible replacement for window.confirm(); resolves true when confirmed. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackApi | null>(null);
const TOAST_MS = 4500;

const toneStyle: Record<ToastTone, { icon: ReactNode; className: string }> = {
  success: { icon: <CheckCircle2 size={18} aria-hidden="true" />, className: 'border-success-line text-success' },
  error: { icon: <AlertCircle size={18} aria-hidden="true" />, className: 'border-danger-line text-danger' },
  info: { icon: <Info size={18} aria-hidden="true" />, className: 'border-info-line text-info' }
};

/** Provides toasts (replacing alert()) and confirmation dialogs (replacing confirm()). */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const toast = useCallback((message: ReactNode, tone: ToastTone = 'info') => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, tone, message }]);
    window.setTimeout(() => dismiss(id), TOAST_MS);
  }, [dismiss]);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })), []);
  const settle = (ok: boolean) => { pending?.resolve(ok); setPending(null); };

  const api = useMemo(() => ({ toast, confirm }), [toast, confirm]);
  return (
    <FeedbackContext.Provider value={api}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-[100001] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => (
          <div key={t.id} className={cn('pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-surface px-4 py-3 shadow-card', toneStyle[t.tone].className)}>
            <span className="mt-0.5 shrink-0">{toneStyle[t.tone].icon}</span>
            <div className="flex-1 whitespace-pre-line text-[0.9rem] font-medium text-ink">{t.message}</div>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi" className="shrink-0 cursor-pointer rounded border-0 bg-transparent p-0.5 text-dim hover:text-ink">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
      <Dialog
        open={pending !== null}
        onClose={() => settle(false)}
        title={pending?.title ?? ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>{pending?.cancelLabel ?? 'Batal'}</Button>
            <Button variant={pending?.danger ? 'danger' : 'primary'} onClick={() => settle(true)} data-autofocus>
              {pending?.confirmLabel ?? 'Ya, lanjutkan'}
            </Button>
          </>
        }
      >
        {pending?.message && <div className="text-[0.95rem] leading-relaxed text-muted">{pending.message}</div>}
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const api = useContext(FeedbackContext);
  if (!api) throw new Error('useFeedback must be used inside FeedbackProvider');
  return api;
}
