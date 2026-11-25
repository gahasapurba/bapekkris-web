import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from './cn';

export type ButtonVariant = 'primary' | 'gold' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold leading-none whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,box-shadow] duration-150 cursor-pointer ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink ' +
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-action text-on-action border border-action hover:brightness-125',
  gold: 'bg-gold text-[#14110a] border border-gold hover:brightness-105',
  secondary: 'bg-surface text-ink border border-line hover:border-line-strong',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-subtle',
  danger: 'bg-surface text-danger border border-danger-line hover:border-danger'
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3.5 text-[0.8rem]',
  md: 'h-10 px-5 text-[0.9rem]',
  lg: 'h-12 px-7 text-[0.98rem]'
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks clicks. */
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function buttonClasses({ variant = 'primary', size = 'md', className }: Pick<CommonProps, 'variant' | 'size' | 'className'> = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, icon, iconRight, className, children, disabled, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, className })}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export type ButtonLinkProps = CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>;

/** A link styled as a button (navigation, downloads). */
export function ButtonLink({ variant = 'primary', size = 'md', icon, iconRight, className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={buttonClasses({ variant, size, className })} {...rest}>
      {icon}
      {children}
      {iconRight}
    </a>
  );
}
