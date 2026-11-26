import { Check, ChevronRight, Copy, MonitorPlay, Music, Search } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { Badge, Button, EmptyState, Input, PageHeader, cn } from '../../ui';
import type { SendToProjector, Song } from '../../types/content';
import { SONG_CATEGORIES } from '../../data/contentOptions';
import { useWorshipSongs } from './useWorshipSongs';

interface WorshipSongSectionProps {
  songs?: Song[];
  onSendToEasyWorship?: SendToProjector;
}

const CATEGORIES = [{ id: 'ALL', label: 'Semua' }, ...SONG_CATEGORIES.map((c) => ({ id: c.value, label: c.short }))];
/** Shown only when it has songs; the built-in hymnal has none in it. */
const OPTIONAL_CATEGORIES = new Set<string>(['Lagu Rohani Lainnya']);

export default function WorshipSongSection(props: WorshipSongSectionProps) {
  const {
    selectedCategory, setSelectedCategory, searchQuery, setSearchQuery, copied, displayLimit, setDisplayLimit, songList,
    activeSong, setActiveSongId, categoryCounts, filteredSongs, handleCopySong, handleSendToProjector, onSendToEasyWorship, isHymnalLoading
  } = useWorshipSongs(props);
  const song = activeSong;

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-24 md:px-6">
      <PageHeader eyebrow="Kidung & Lagu" title="Bernyanyi bagi Tuhan"
        description="Kidung Jemaat, PKJ, NKB, dan Praise & Worship dengan lirik lengkap, nada dasar, dan penayangan ke proyektor EasyWorship." />

      {isHymnalLoading ? (
        <p role="status" className="py-16 text-center text-[0.95rem] text-muted">Memuat kidung…</p>
      ) : songList.length === 0 ? (
        <EmptyState icon={<Music size={22} />} title="Belum ada lagu" description="Daftar pujian akan tampil di sini setelah ditambahkan pengurus." />
      ) : (
        <>
          <div className="mb-8 flex flex-col gap-4 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
            <div role="group" aria-label="Kategori lagu" className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => !OPTIONAL_CATEGORIES.has(c.id) || categoryCounts[c.id]).map((c) => (
                <button key={c.id} type="button" aria-pressed={selectedCategory === c.id} onClick={() => { soundFx.playClick(); setSelectedCategory(c.id); }}
                  className={cn('inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[0.84rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
                    selectedCategory === c.id ? 'border-action bg-action text-on-action' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink')}>
                  {c.label}<span className="tabular-nums">{categoryCounts[c.id] || 0}</span>
                </button>
              ))}
            </div>
            <div className="relative lg:w-80">
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
              <Input type="search" aria-label="Cari lagu" placeholder="Judul, lirik, atau nomor (mis. KJ 1)" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-full pl-10" />
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[360px_minmax(0,1fr)]">
            <nav aria-label="Daftar lagu" className="lg:sticky lg:top-24 lg:self-start">
              <p className="mb-2 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-dim">{filteredSongs.length} lagu</p>
              {filteredSongs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-muted">Tidak ada lagu yang cocok.</p>
              ) : (
                <div className="flex max-h-[420px] flex-col overflow-y-auto rounded-lg border border-line bg-surface lg:max-h-[calc(100vh-11rem)]">
                  <ul className="list-none divide-y divide-line">
                    {filteredSongs.slice(0, displayLimit).map((s) => {
                      const selected = song?.id === s.id;
                      return (
                        <li key={s.id}>
                          <button type="button" aria-current={selected ? 'true' : undefined} onClick={() => { soundFx.playClick(); setActiveSongId(s.id); }}
                            className={cn('flex w-full cursor-pointer items-center gap-3 border-0 px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink',
                              selected ? 'bg-navy-tint' : 'bg-transparent hover:bg-subtle')}>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline gap-2">
                                {s.songNumber && <span className="shrink-0 text-[0.78rem] font-semibold text-gold-ink">{s.songNumber}</span>}
                                <span className={cn('truncate font-display text-[1rem] font-semibold', selected ? 'text-navy-ink' : 'text-ink')}>{s.title}</span>
                              </span>
                              <span className="block truncate text-[0.76rem] text-dim">{s.category}{s.keySignature ? ` · Nada ${s.keySignature}` : ''}</span>
                            </span>
                            <ChevronRight size={15} aria-hidden="true" className={selected ? 'text-gold-ink' : 'text-dim'} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {filteredSongs.length > displayLimit && (
                    <button type="button" onClick={() => setDisplayLimit((n: number) => n + 80)} className="cursor-pointer border-0 border-t border-line bg-page px-4 py-3 text-[0.86rem] font-semibold text-navy-ink hover:bg-subtle">
                      Tampilkan lebih banyak ({Math.min(displayLimit, filteredSongs.length)} dari {filteredSongs.length})
                    </button>
                  )}
                </div>
              )}
            </nav>

            <article aria-labelledby="song-title" className="min-w-0">
              {song ? (
                <>
                  <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {song.songNumber && <Badge tone="gold">{song.songNumber}</Badge>}
                        <Badge tone="navy">{song.category || 'Lagu rohani'}</Badge>
                        {song.keySignature && <Badge>Nada dasar {song.keySignature}</Badge>}
                      </div>
                      <h2 id="song-title" className="mt-3 font-display text-[clamp(1.8rem,3.5vw,2.5rem)] font-semibold leading-tight text-ink">{song.title}</h2>
                      {song.author && <p className="mt-1 text-[0.9rem] text-muted">Syair / lagu: <span className="text-ink">{song.author}</span></p>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" icon={copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} onClick={() => handleCopySong(song)}>{copied ? 'Tersalin' : 'Salin lirik'}</Button>
                      {onSendToEasyWorship && <Button size="sm" icon={<MonitorPlay size={14} aria-hidden="true" />} onClick={() => handleSendToProjector(song)}>Tampilkan di proyektor</Button>}
                    </div>
                  </header>
                  <div className="mt-8 whitespace-pre-line font-display text-[1.15rem] leading-[1.9] text-ink">{song.lyrics}</div>
                </>
              ) : (
                <EmptyState icon={<Music size={22} />} title="Pilih lagu" description="Pilih lagu dari daftar untuk melihat liriknya." />
              )}
            </article>
          </div>
        </>
      )}
    </div>
  );
}
