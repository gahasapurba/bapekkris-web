import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from './cn';

const control =
  'w-full rounded-md border bg-field px-3.5 text-[0.95rem] text-ink placeholder:text-dim ' +
  'transition-[border-color,box-shadow] duration-150 ' +
  'focus:outline-none focus-visible:border-navy-ink focus-visible:shadow-[0_0_0_3px_var(--navy-tint)] ' +
  'disabled:cursor-not-allowed disabled:opacity-60';
const controlBorder = (invalid?: boolean) => (invalid ? 'border-danger' : 'border-field-line hover:border-line-strong');

interface FieldProps {
  label: ReactNode;
  /** Shown below the control; replaced by `error` when present. */
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  /** A single Input / Select / Textarea; id and ARIA wiring are added automatically. */
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string; required?: boolean }>;
}

/** Label + control + hint/error, wired for screen readers. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const message = error || hint;
  const control = isValidElement(children)
    ? cloneElement(children, {
        id: children.props.id ?? id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': message ? messageId : undefined,
        required
      })
    : children;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={children.props.id ?? id} className="text-[0.84rem] font-semibold text-muted">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
      </label>
      {control}
      {message && (
        <p id={messageId} className={cn('flex items-center gap-1.5 text-[0.8rem]', error ? 'font-semibold text-danger' : 'text-dim')}>
          {error && <AlertCircle size={14} aria-hidden="true" />}
          {message}
        </p>
      )}
    </div>
  );
}

type InvalidProp = { invalid?: boolean };

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & InvalidProp>(function Input(
  { className, invalid, ...rest },
  ref
) {
  return <input ref={ref} className={cn(control, 'h-11', controlBorder(invalid || rest['aria-invalid'] === true), className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & InvalidProp>(function Textarea(
  { className, invalid, rows = 4, ...rest },
  ref
) {
  return <textarea ref={ref} rows={rows} className={cn(control, 'py-2.5 leading-relaxed', controlBorder(invalid || rest['aria-invalid'] === true), className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & InvalidProp>(function Select(
  { className, invalid, ...rest },
  ref
) {
  return <select ref={ref} className={cn(control, 'h-11 pr-8', controlBorder(invalid || rest['aria-invalid'] === true), className)} {...rest} />;
});
