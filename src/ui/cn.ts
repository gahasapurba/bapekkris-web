import { clsx, type ClassValue } from 'clsx';

/**
 * Joins class names, skipping falsy values.
 *
 * Note for src/ui: Tailwind's preflight reset is not loaded, so <button> keeps the browser's
 * default border and background unless a class sets them (border-0 / bg-transparent), and it
 * does not inherit the font: add [font:inherit] to a button wrapping heading text.
 */
export function cn(...values: ClassValue[]): string {
  return clsx(values);
}
