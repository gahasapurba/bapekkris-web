import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lifts on hover; use for cards that are clickable as a whole. */
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

export function Card({ interactive = false, padding = 'md', className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-line bg-surface shadow-card',
        interactive && 'transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-line-strong',
        paddings[padding],
        className
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, children, as: Tag = 'h3' }: { className?: string; children: ReactNode; as?: 'h2' | 'h3' | 'h4' }) {
  return <Tag className={cn('font-display text-xl font-semibold text-ink', className)}>{children}</Tag>;
}
