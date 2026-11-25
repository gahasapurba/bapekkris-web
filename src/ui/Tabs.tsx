import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Accessible name of the tab list. */
  label: string;
  className?: string;
}

/**
 * Segmented tab list (WAI-ARIA tabs pattern: arrow keys, Home/End). Render the active panel
 * yourself with `tabPanelProps(id)` so it is linked to its tab.
 */
export function Tabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (e: KeyboardEvent, index: number) => {
    const last = items.length - 1;
    const next = e.key === 'ArrowRight' ? (index === last ? 0 : index + 1)
      : e.key === 'ArrowLeft' ? (index === 0 ? last : index - 1)
      : e.key === 'Home' ? 0 : e.key === 'End' ? last : null;
    if (next === null) return;
    e.preventDefault();
    onChange(items[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface p-1', className)}>
      {items.map((item, i) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${baseId}-${item.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => move(e, i)}
            className={cn(
              'inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border-0 px-4 text-[0.86rem] font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
              selected ? 'bg-action text-on-action' : 'bg-transparent text-muted hover:bg-subtle hover:text-ink'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
