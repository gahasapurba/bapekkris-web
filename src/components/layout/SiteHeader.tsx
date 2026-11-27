import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, Moon, Search, Sun, UserPlus } from 'lucide-react';
import { getDeadlineStatus } from '../../utils/dateUtils';
import type { AppItem } from '../../lib/supabase';
import { Sheet, cn } from '../../ui';
import { BrandMark } from './BrandMark';
import { NAV_ITEMS, isActiveTab, isPageShown, type PageVisibility } from './navItems';

interface SiteHeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  tenures?: AppItem[];
  activeTenure?: AppItem | null;
  onSelectTenure?: (tenure: AppItem) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  forms?: AppItem[];
  pageVisibility?: PageVisibility;
  onOpenQuickSearch?: () => void;
}

const iconButton =
  'inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted ' +
  'transition-colors hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink';

/** Open forms of the browsed tenure (shown as a count on the registration link). */
function countOpenForms(forms: AppItem[], activeTenure?: AppItem | null): number {
  return forms.filter((f) => {
    if (f.isOpen === false || getDeadlineStatus(f.deadline).isExpired) return false;
    const tenureId = f.tenureId || '';
    return !activeTenure?.id || !tenureId || tenureId === activeTenure.id;
  }).length;
}

function TenureSelect({ tenures, activeTenure, onSelectTenure, className, onChanged }: Pick<SiteHeaderProps, 'tenures' | 'activeTenure' | 'onSelectTenure'> & { className?: string; onChanged?: () => void }) {
  if (!tenures || tenures.length < 2) return null;
  return (
    <div className={cn('relative', className)}>
      <select
        aria-label="Periode kepengurusan yang ditampilkan"
        value={activeTenure?.id || ''}
        onChange={(e) => {
          const selected = tenures.find((t) => t.id === e.target.value);
          if (selected) onSelectTenure?.(selected);
          onChanged?.();
        }}
        className="h-10 w-full cursor-pointer appearance-none truncate rounded-full border border-line bg-surface pl-4 pr-9 text-[0.84rem] font-semibold text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink"
      >
        {tenures.map((t) => (
          <option key={t.id} value={t.id}>Periode {t.code || t.title}{t.isActive ? ' (Aktif)' : ''}</option>
        ))}
      </select>
      <ChevronDown size={15} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-dim" />
    </div>
  );
}

export default function SiteHeader({
  currentTab, setCurrentTab, tenures = [], activeTenure, onSelectTenure, theme, onToggleTheme, forms = [], pageVisibility = {}, onOpenQuickSearch
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  const items = NAV_ITEMS.filter((item) => isPageShown(item.id, pageVisibility));
  const primary = items.filter((item) => !item.secondary);
  const secondary = items.filter((item) => item.secondary);
  const formShown = isPageShown('form', pageVisibility);
  const formActive = isActiveTab('form', currentTab);
  const openForms = countOpenForms(forms, activeTenure);
  const moreActive = secondary.some((item) => item.id === currentTab);
  // The period picker lives in "Lainnya" (desktop) and the menu sheet (mobile): the header row has no room for it.
  const hasTenureChoice = tenures.length > 1;

  useEffect(() => {
    if (!moreOpen) return;
    const onPointer = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMoreOpen(false); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey); };
  }, [moreOpen]);

  const go = (tab: string) => {
    setCurrentTab(tab);
    setMenuOpen(false);
    setMoreOpen(false);
  };
  const goHome = () => {
    if (pageVisibility.home !== false) go('home');
    else if (items[0]) go(items[0].id);
    else if (formShown) go('form');
  };

  const navLink = (active: boolean) => cn(
    'relative inline-flex h-10 cursor-pointer items-center gap-1 whitespace-nowrap border-0 bg-transparent px-1 text-[0.9rem] transition-colors',
    'after:absolute after:inset-x-1 after:bottom-1.5 after:h-0.5 after:rounded-full after:transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink',
    active ? 'font-semibold text-ink after:bg-gold' : 'font-medium text-muted hover:text-ink after:bg-transparent'
  );

  return (
    <header className="sticky top-0 z-[100] border-b border-line bg-[var(--bg-nav)]">
      <div className="mx-auto flex h-[72px] max-w-[1260px] items-center gap-4 px-4 md:px-6">
        <button type="button" onClick={goHome} className="min-w-0 shrink cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-ink">
          <BrandMark isDark={isDark} />
          <span className="sr-only">, ke beranda</span>
        </button>

        <nav aria-label="Navigasi utama" className="ml-4 hidden items-center gap-5 xl:flex">
          {primary.map((item) => {
            const active = isActiveTab(item.id, currentTab);
            return (
              <button key={item.id} type="button" onClick={() => go(item.id)} aria-current={active ? 'page' : undefined} className={navLink(active)}>
                {item.label}
              </button>
            );
          })}
          {(secondary.length > 0 || hasTenureChoice) && (
            <div ref={moreRef} className="relative">
              <button type="button" onClick={() => setMoreOpen((o) => !o)} aria-haspopup="true" aria-expanded={moreOpen} className={navLink(moreActive)}>
                Lainnya <ChevronDown size={15} aria-hidden="true" className={cn('transition-transform', moreOpen && 'rotate-180')} />
              </button>
              {moreOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-lg border border-line bg-surface p-1.5 shadow-card">
                  {secondary.length > 0 && (
                  <div role="menu" aria-label="Halaman lainnya">
                  {secondary.map((item) => {
                    const Icon = item.icon;
                    const active = item.id === currentTab;
                    return (
                      <button key={item.id} type="button" role="menuitem" onClick={() => go(item.id)} aria-current={active ? 'page' : undefined}
                        className={cn('flex w-full cursor-pointer items-center gap-3 rounded-md border-0 px-3 py-2.5 text-left text-[0.9rem]',
                          active ? 'bg-navy-tint font-semibold text-navy-ink' : 'bg-transparent text-ink hover:bg-subtle')}>
                        <Icon size={17} aria-hidden="true" className={active ? 'text-gold-ink' : 'text-dim'} />
                        {item.label}
                      </button>
                    );
                  })}
                  </div>
                  )}
                  {hasTenureChoice && (
                    <div className={cn('px-1.5 pb-1.5', secondary.length > 0 && 'mt-1.5 border-t border-line pt-3')}>
                      <p className="mb-2 px-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-dim">Periode kepengurusan</p>
                      <TenureSelect tenures={tenures} activeTenure={activeTenure} onSelectTenure={onSelectTenure} onChanged={() => setMoreOpen(false)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {formShown && (
            <button type="button" onClick={() => go('form')} aria-current={formActive ? 'page' : undefined}
              className={cn('hidden h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-[0.86rem] font-semibold transition-colors sm:inline-flex',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink',
                openForms > 0 ? 'border-gold bg-gold text-[#14110a] hover:brightness-105' : 'border-line bg-surface text-ink hover:border-line-strong')}>
              <UserPlus size={16} aria-hidden="true" />
              Registrasi
              {openForms > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[#14110a] px-1.5 text-[0.72rem] font-bold leading-5 text-white" aria-label={`${openForms} formulir dibuka`}>
                  {openForms}
                </span>
              )}
            </button>
          )}
          {onOpenQuickSearch && (
            <button type="button" onClick={onOpenQuickSearch} aria-label="Cari (Ctrl+K)" className={cn(iconButton, 'lg:w-auto lg:gap-2 lg:px-3.5')}>
              <Search size={17} aria-hidden="true" />
              <span className="hidden text-[0.84rem] font-medium lg:inline">Cari</span>
              <kbd className="hidden rounded border border-line bg-subtle px-1.5 text-[0.68rem] font-semibold text-dim lg:inline">⌘K</kbd>
            </button>
          )}
          <button type="button" onClick={onToggleTheme} aria-label={isDark ? 'Gunakan tema terang' : 'Gunakan tema gelap'} className={iconButton}>
            {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="Buka menu navigasi" aria-expanded={menuOpen} className={cn(iconButton, 'xl:hidden')}>
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Menu"
        footer={
          <div className="flex items-center justify-between gap-3 text-[0.8rem] text-dim">
            <span>Badan Pembinaan Kerohanian Kristen</span>
            <button type="button" onClick={() => go('admin')} className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-navy-ink hover:underline">
              Admin Portal →
            </button>
          </div>
        }
      >
        <nav aria-label="Navigasi utama (seluler)" className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActiveTab(item.id, currentTab);
            return (
              <button key={item.id} type="button" onClick={() => go(item.id)} aria-current={active ? 'page' : undefined}
                className={cn('flex w-full cursor-pointer items-center gap-3 rounded-md border-0 px-3 py-3 text-left text-[0.98rem]',
                  active ? 'bg-navy-tint font-semibold text-navy-ink' : 'bg-transparent text-ink hover:bg-subtle')}>
                <Icon size={19} aria-hidden="true" className={active ? 'text-gold-ink' : 'text-dim'} />
                {item.label}
              </button>
            );
          })}
          {formShown && (
            <button type="button" onClick={() => go('form')} aria-current={formActive ? 'page' : undefined}
              className="mt-2 flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-gold-line bg-gold-tint px-3 py-3 text-left text-[0.98rem] font-semibold text-ink">
              <span className="flex items-center gap-3"><UserPlus size={19} aria-hidden="true" className="text-gold-ink" />Registrasi & Formulir</span>
              {openForms > 0 && <span className="text-[0.8rem] font-semibold text-gold-ink">{openForms} dibuka</span>}
            </button>
          )}
        </nav>
        {hasTenureChoice && (
          <div className="mt-5 border-t border-line px-2 pt-5">
            <p className="mb-2 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-dim">Periode kepengurusan</p>
            <TenureSelect tenures={tenures} activeTenure={activeTenure} onSelectTenure={onSelectTenure} onChanged={() => setMenuOpen(false)} />
          </div>
        )}
      </Sheet>
    </header>
  );
}
