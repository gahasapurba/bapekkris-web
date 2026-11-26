import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { BookMarked, BookOpen, Calendar, ChevronRight, ClipboardList, Compass, Download, HelpCircle, Image as ImageIcon, Music, Search, Users, X } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { formatDeadlineWib } from '../../utils/dateUtils';
import { useModalBehavior } from '../../ui/useModalBehavior';
import { setPageIntent } from '../../lib/pageIntent';
import { fold, matchBibleBooks, songNumberKey, type Song } from '../../lib/searchUtils';
import { NAV_ITEMS } from './navItems';

const PAGE_EXTRAS = [{ id: 'form', label: 'Registrasi & Formulir' }];

interface QuickSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  onNavigate: (tab: string, formId?: string | null, eventId?: string | null, galleryId?: string | null) => void;
  isPageVisible: (tab: string) => boolean;
  data: Record<'members' | 'events' | 'forms' | 'galleries' | 'brandAssets' | 'devotions' | 'worshipSongs' | 'faqs' | 'tenureRoles' | 'divisions', AppItem[]>;
}

const has = (v: unknown, q: string) => String(v || '').toLowerCase().includes(q);

/** Ctrl/⌘ + K site search across people, events, forms, albums, assets, devotions, songs and FAQs. */
export default function QuickSearch({ query, onQueryChange, onClose, onNavigate, isPageVisible, data }: QuickSearchProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useModalBehavior(panelRef, true, onClose);
  const q = query.trim().toLowerCase();
  const { members, events, forms, galleries, brandAssets, devotions, worshipSongs, faqs, tenureRoles, divisions } = data;

  // The hymnal (1,000+ songs, ~750 KB) loads only once the visitor starts typing.
  const [hymnal, setHymnal] = useState<Song[] | null>(null);
  useEffect(() => {
    if (q.length < 2 || hymnal) return;
    let cancelled = false;
    import('../../data/hymnalLibrary').then((mod) => { if (!cancelled) setHymnal(mod.BIBLE_SONG_COLLECTION as Song[]); }).catch(() => {});
    return () => { cancelled = true; };
  }, [q, hymnal]);

  const roleOf = (m: AppItem) => {
    const r = tenureRoles.find((x) => x.id === m.roleId) || tenureRoles.find((x) => String(x?.name || '').toLowerCase().trim() === String(m?.role || '').toLowerCase().trim());
    const roleName = r?.name || m.role || 'Anggota';
    const div = divisions.find((d) => d.id === m.divisionId);
    return div?.name && !String(roleName).toLowerCase().includes(String(div.name).toLowerCase()) ? `${roleName} · ${div.name}` : roleName;
  };

  type Item = { key: string; title: string; meta?: string; go: () => void };
  const groups: { label: string; icon: ReactNode; items: Item[] }[] = [];
  const add = (show: boolean, label: string, icon: ReactNode, items: Item[]) => { if (show && items.length) groups.push({ label, icon, items }); };

  if (q) {
    add(true, 'Halaman', <Compass size={14} />, [...NAV_ITEMS, ...PAGE_EXTRAS]
      .filter((p) => isPageVisible(p.id) && fold(p.label).includes(fold(q)))
      .slice(0, 3)
      .map((p) => ({ key: 'p' + p.id, title: p.label, meta: 'Buka halaman', go: () => onNavigate(p.id) })));
  }
  add(isPageVisible('organisasi'), 'Pengurus', <Users size={14} />, (q ? members.filter((m) => has(m.name, q) || has(m.role, q) || has(m.title, q)).slice(0, 5) : members.slice(0, 3))
    .map((m) => ({ key: 'm' + m.id, title: m.name, meta: roleOf(m), go: () => onNavigate('organisasi') })));
  add(isPageVisible('event'), 'Ibadah & acara', <Calendar size={14} />, (q ? events.filter((e) => e.isPublic !== false && (has(e.title, q) || has(e.divisionName, q) || has(e.location, q))).slice(0, 4) : events.filter((e) => e.isPublic !== false).slice(0, 2))
    .map((e) => ({ key: 'e' + e.id, title: e.title, meta: [e.date, e.divisionName].filter(Boolean).join(' · '), go: () => onNavigate('event', null, e.id) })));
  add(isPageVisible('form'), 'Formulir terbuka', <ClipboardList size={14} />, (q ? forms.filter((f) => f.isOpen !== false && (has(f.title, q) || has(f.category, q))).slice(0, 3) : forms.filter((f) => f.isOpen !== false).slice(0, 2))
    .map((f) => ({ key: 'f' + f.id, title: f.title, meta: `${f.category || 'Formulir'} · batas ${formatDeadlineWib(f.deadline)}`, go: () => onNavigate('form', f.id) })));
  if (q) {
    add(isPageVisible('alkitab'), 'Alkitab', <BookMarked size={14} />, matchBibleBooks(q)
      .map(({ book, chapter }) => ({
        key: 'b' + book.id, title: `${book.name} ${chapter}`, meta: `${book.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'} · ${book.chapters} pasal`,
        go: () => { setPageIntent('alkitab', { bookId: book.id, chapter }); onNavigate('alkitab'); }
      })));
    add(isPageVisible('galeri'), 'Galeri', <ImageIcon size={14} />, galleries.filter((g) => has(g.title, q) || has(g.division, q)).slice(0, 3)
      .map((g) => ({ key: 'g' + g.id, title: g.title, meta: [g.date, g.division].filter(Boolean).join(' · '), go: () => onNavigate('galeri', null, null, g.id) })));
    add(isPageVisible('renungan'), 'Renungan', <BookOpen size={14} />, devotions.filter((d) => has(d.title, q) || has(d.scriptureRef, q) || has(d.body, q)).slice(0, 3)
      .map((d) => ({ key: 'd' + d.id, title: d.title, meta: d.scriptureRef || String(d.body || '').slice(0, 70), go: () => { setPageIntent('renungan', { devotionId: d.id }); onNavigate('renungan'); } })));
    const numberKey = songNumberKey(q);
    const songs = [...worshipSongs, ...(hymnal || []).filter((h) => !worshipSongs.some((s) => s.id === h.id))] as Song[];
    add(isPageVisible('lagu'), 'Kidung & lagu', <Music size={14} />, songs
      .filter((s) => songNumberKey(s.songNumber) === numberKey || has(s.title, q) || (q.length >= 4 && has(s.lyrics, q)))
      .sort((a, b) => Number(songNumberKey(b.songNumber) === numberKey) - Number(songNumberKey(a.songNumber) === numberKey))
      .slice(0, 5)
      .map((s) => ({ key: 's' + s.id, title: s.title, meta: [s.songNumber, s.category].filter(Boolean).join(' · '), go: () => { setPageIntent('lagu', { songId: s.id }); onNavigate('lagu'); } })));
    add(isPageVisible('assets'), 'Aset & logo', <Download size={14} />, brandAssets.filter((a) => has(a.title, q) || has(a.category, q)).slice(0, 3)
      .map((a) => ({ key: 'a' + a.id, title: a.title, meta: [a.category, a.fileType].filter(Boolean).join(' · '), go: () => onNavigate('assets') })));
    add(isPageVisible('home'), 'Tanya jawab', <HelpCircle size={14} />, faqs.filter((f) => f.isPublished !== false && (has(f.question, q) || has(f.answer, q) || has(f.category, q))).slice(0, 3)
      .map((f) => ({ key: 'q' + f.id, title: f.question, meta: String(f.answer || '').slice(0, 80), go: () => onNavigate('home') })));
  }
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  const items = () => Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[data-qs-item]') || []);
  const onListKey = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const all = items(); if (!all.length) return;
    const i = all.indexOf(document.activeElement as HTMLButtonElement);
    const next = e.key === 'ArrowDown' ? (i < 0 ? 0 : Math.min(all.length - 1, i + 1)) : i <= 0 ? -1 : i - 1;
    if (next < 0) panelRef.current?.querySelector<HTMLInputElement>('input')?.focus(); else all[next].focus();
  };

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-start justify-center bg-overlay p-3 pt-[10vh]" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label="Pencarian cepat" tabIndex={-1} onKeyDown={onListKey}
        className="flex max-h-[78vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card outline-none">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} aria-hidden="true" className="shrink-0 text-gold-ink" />
          <input autoFocus type="text" role="combobox" aria-expanded={total > 0} aria-controls="qs-results" aria-label="Cari di situs"
            placeholder="Cari halaman, acara, lagu (KJ 1), ayat (Yoh 3), renungan…" value={query} onChange={(e) => onQueryChange(e.target.value)}
            className="h-14 min-w-0 flex-1 border-0 bg-transparent text-[1rem] text-ink outline-none placeholder:text-dim" />
          <button type="button" onClick={onClose} aria-label="Tutup pencarian" className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:bg-subtle hover:text-ink"><X size={18} aria-hidden="true" /></button>
        </div>
        <div id="qs-results" ref={listRef} className="flex-1 overflow-y-auto p-2" aria-live="polite">
          {total === 0 ? (
            <p className="px-4 py-10 text-center text-[0.92rem] text-muted">{q ? <>Tidak ada hasil untuk <strong className="text-ink">“{query}”</strong>.</> : 'Ketik untuk mulai mencari.'}</p>
          ) : groups.map((g) => (
            <section key={g.label} className="py-1.5" aria-label={g.label}>
              <p className="flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-dim"><span className="text-gold-ink" aria-hidden="true">{g.icon}</span>{g.label}</p>
              <ul className="flex list-none flex-col">
                {g.items.map((it) => (
                  <li key={it.key}>
                    <button type="button" data-qs-item onClick={() => { it.go(); onClose(); }}
                      className="group flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border-0 bg-transparent px-3 py-2.5 text-left hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-2 focus-visible:outline-navy-ink">
                      <span className="min-w-0">
                        <span className="block truncate text-[0.92rem] font-semibold text-ink">{it.title}</span>
                        {it.meta && <span className="block truncate text-[0.8rem] text-muted">{it.meta}</span>}
                      </span>
                      <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-dim group-hover:text-ink" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="hidden items-center justify-between border-t border-line bg-subtle px-4 py-2 text-[0.76rem] text-muted sm:flex">
          <span><kbd className="rounded border border-line bg-surface px-1.5 font-sans">↑</kbd> <kbd className="rounded border border-line bg-surface px-1.5 font-sans">↓</kbd> pilih · <kbd className="rounded border border-line bg-surface px-1.5 font-sans">Enter</kbd> buka</span>
          <span><kbd className="rounded border border-line bg-surface px-1.5 font-sans">Ctrl/⌘ K</kbd> · <kbd className="rounded border border-line bg-surface px-1.5 font-sans">Esc</kbd> tutup</span>
        </p>
      </div>
    </div>,
    document.body
  );
}
