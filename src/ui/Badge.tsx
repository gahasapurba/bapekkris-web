import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type BadgeTone = 'neutral' | 'navy' | 'gold' | 'info' | 'success' | 'danger';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-subtle text-muted border-line',
  navy: 'bg-navy-tint text-navy-ink border-navy-line',
  gold: 'bg-gold-tint text-gold-ink border-gold-line',
  info: 'bg-info-tint text-info border-info-line',
  success: 'bg-success-tint text-success border-success-line',
  danger: 'bg-danger-tint text-danger border-danger-line'
};

export function Badge({ tone = 'neutral', className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.74rem] font-semibold leading-5', tones[tone], className)}
      {...rest}
    />
  );
}
