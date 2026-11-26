import { BookOpen, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Loader2, MessageCircle, MonitorPlay, Minus, Plus, Search } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { Button, EmptyState, Input, PageHeader, cn } from '../../ui';
import type { SendToProjector } from '../../types/content';
import { BIBLE_VERSIONS, useBible } from './useBible';

const TESTAMENTS = [{ id: 'ALL', label: 'Semua' }, { id: 'PL', label: 'PL · 39' }, { id: 'PB', label: 'PB · 27' }];

export default function BibleSection(props: { onSendToEasyWorship?: SendToProjector }) {
  const {
    selectedBook, setSelectedBook, selectedChapter, setSelectedChapter, selectedVersion, setSelectedVersion, searchBookQuery, setSearchBookQuery,
    testamentFilter, setTestamentFilter, copiedVerse, fontSize, setFontSize, isLoadingVerses, filteredBooks, currentVerses,
    handleCopyVerse, handleShareWa, handleSendVerseToEasyWorship, onSendToEasyWorship
  } = useBible(props);
  const book = selectedBook;
  const pill = (active: boolean) => cn('h-8 cursor-pointer rounded-full border-0 px-3 text-[0.8rem] font-semibold transition-colors',
    active ? 'bg-action text-on-action' : 'bg-transparent text-muted hover:bg-subtle hover:text-ink');
  const verseAction = 'inline-flex h-7 cursor-pointer items-center gap-1 rounded-full border border-line bg-surface px-2.5 text-[0.74rem] font-semibold text-muted hover:border-line-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-navy-ink';

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-24 md:px-6">
      <PageHeader
        eyebrow="Alkitab Digital"
        title="Firman Tuhan, setiap saat"
        description="66 kitab Perjanjian Lama dan Baru dalam Terjemahan Baru (LAI), terhubung dengan penayangan ibadah EasyWorship."
        actions={
          <a href="https://bible-api.alkitab.or.id" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[0.86rem] font-semibold text-navy-ink hover:underline">
            Sumber: Lembaga Alkitab Indonesia <ExternalLink size={13} aria-hidden="true" />
          </a>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[260px_200px_minmax(0,1fr)]">
        <nav aria-label="Daftar kitab" className="flex flex-col gap-3 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start">
          <div role="group" aria-label="Perjanjian" className="inline-flex gap-1 self-start rounded-full border border-line bg-surface p-1">
            {TESTAMENTS.map((t) => <button key={t.id} type="button" aria-pressed={testamentFilter === t.id} onClick={() => setTestamentFilter(t.id)} className={pill(testamentFilter === t.id)}>{t.label}</button>)}
          </div>
          <div className="relative">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <Input type="search" aria-label="Cari kitab" placeholder="Cari kitab" value={searchBookQuery} onChange={(e) => setSearchBookQuery(e.target.value)} className="pl-10" />
          </div>
          <ul className="flex max-h-64 list-none flex-col overflow-y-auto rounded-lg border border-line bg-surface lg:max-h-none lg:flex-1">
            {filteredBooks.map((b) => {
              const selected = book.id === b.id;
              return (
                <li key={b.id}>
                  <button type="button" aria-current={selected ? 'true' : undefined} onClick={() => { soundFx.playClick(); setSelectedBook(b); setSelectedChapter(1); }}
                    className={cn('flex w-full cursor-pointer items-center justify-between gap-2 border-0 px-4 py-2.5 text-left text-[0.92rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink',
                      selected ? 'bg-navy-tint font-semibold text-navy-ink' : 'bg-transparent text-ink hover:bg-subtle')}>
                    {b.name}<span className="text-[0.74rem] text-dim">{b.chapters} pasal</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <nav aria-label={`Pasal ${book.name}`} className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-3 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-dim">{book.name} · {book.chapters} pasal</p>
          <div className="grid max-h-56 grid-cols-6 gap-1.5 overflow-y-auto lg:max-h-[calc(100vh-10rem)] lg:grid-cols-4">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((ch) => (
              <button key={ch} type="button" aria-current={selectedChapter === ch ? 'true' : undefined} onClick={() => { soundFx.playClick(); setSelectedChapter(ch); }}
                className={cn('h-9 cursor-pointer rounded-md border text-[0.84rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-navy-ink',
                  selectedChapter === ch ? 'border-action bg-action text-on-action' : 'border-line bg-surface text-ink hover:border-line-strong')}>
                {ch}
              </button>
            ))}
          </div>
        </nav>

        <article aria-labelledby="bible-chapter-title" className="min-w-0">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <h2 id="bible-chapter-title" className="font-display text-[clamp(1.8rem,3.5vw,2.4rem)] font-semibold leading-tight text-ink">{book.name} {selectedChapter}</h2>
              <p className="mt-1 text-[0.86rem] text-gold-ink">{BIBLE_VERSIONS.find((v) => v.id === selectedVersion)?.name || selectedVersion} · {book.category}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div role="group" aria-label="Versi terjemahan" className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
                {BIBLE_VERSIONS.map((v: { id: string; short: string; name: string }) => (
                  <button key={v.id} type="button" title={v.name} aria-pressed={selectedVersion === v.id} onClick={() => { soundFx.playClick(); setSelectedVersion(v.id); }} className={pill(selectedVersion === v.id)}>{v.short}</button>
                ))}
              </div>
              <div role="group" aria-label="Ukuran teks" className="inline-flex items-center gap-1 rounded-full border border-line bg-surface p-1">
                <button type="button" aria-label="Perkecil teks" onClick={() => setFontSize((f: number) => Math.max(14, f - 2))} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:bg-subtle hover:text-ink"><Minus size={15} aria-hidden="true" /></button>
                <span className="min-w-8 text-center text-[0.8rem] font-semibold text-ink" aria-live="polite">{fontSize}</span>
                <button type="button" aria-label="Perbesar teks" onClick={() => setFontSize((f: number) => Math.min(26, f + 2))} className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:bg-subtle hover:text-ink"><Plus size={15} aria-hidden="true" /></button>
              </div>
            </div>
          </header>

          {isLoadingVerses ? (
            <p role="status" className="flex items-center justify-center gap-2 py-20 text-muted"><Loader2 size={18} className="animate-spin" aria-hidden="true" />Memuat firman…</p>
          ) : currentVerses.length === 0 ? (
            <EmptyState className="mt-8" icon={<BookOpen size={22} />} title="Ayat belum dapat dimuat" description="Periksa koneksi internet, atau coba versi terjemahan lain." />
          ) : (
            <ol className="mt-6 flex max-w-[72ch] list-none flex-col gap-2">
              {currentVerses.map((v) => (
                <li key={v.verse} className="group relative flex gap-4 rounded-md px-2 py-1.5 hover:bg-surface focus-within:bg-surface">
                  <span className="w-7 shrink-0 pt-1 text-right font-display text-[0.9rem] font-semibold text-gold-ink" aria-label={`Ayat ${v.verse}`}>{v.verse}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-display leading-[1.75] text-ink" style={{ fontSize: `${fontSize + 2}px` }}>{v.text}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 md:pointer-events-none md:absolute md:-top-3 md:right-2 md:mt-0 md:rounded-full md:border md:border-line md:bg-surface md:p-1 md:opacity-0 md:shadow-card md:transition-opacity md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100">
                      <button type="button" onClick={() => handleCopyVerse(v)} className={verseAction}>{copiedVerse === v.verse ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}{copiedVerse === v.verse ? 'Tersalin' : 'Salin'}</button>
                      <button type="button" onClick={() => handleShareWa(v)} className={verseAction}><MessageCircle size={12} aria-hidden="true" />WhatsApp</button>
                      {onSendToEasyWorship && <button type="button" onClick={() => handleSendVerseToEasyWorship(v)} className={verseAction}><MonitorPlay size={12} aria-hidden="true" />EasyWorship</button>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          <nav aria-label="Pasal sebelumnya dan berikutnya" className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="secondary" disabled={selectedChapter <= 1} onClick={() => setSelectedChapter((c) => Math.max(1, c - 1))} icon={<ChevronLeft size={16} aria-hidden="true" />}>Sebelumnya</Button>
            <span className="text-[0.86rem] font-semibold text-gold-ink">{book.name} {selectedChapter} / {book.chapters}</span>
            <Button variant="secondary" disabled={selectedChapter >= book.chapters} onClick={() => setSelectedChapter((c) => Math.min(book.chapters, c + 1))} iconRight={<ChevronRight size={16} aria-hidden="true" />}>Berikutnya</Button>
          </nav>
        </article>
      </div>
    </div>
  );
}
