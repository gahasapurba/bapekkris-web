import { clsx, type ClassValue } from 'clsx';

/**
 * Joins class names, skipping falsy values.
 *
 * Note for src/ui: Tailwind's preflight reset is not loaded, so <button> keeps the browser's
 * default border and background unless a class sets them (border-0 / bg-transparent).
 */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
