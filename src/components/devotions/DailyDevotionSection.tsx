import { useRef } from 'react';
import { BookOpen, CalendarClock, Check, Copy, Download, MessageCircle, MonitorPlay, Search } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { soundFx } from '../../utils/audio';
import { INDONESIAN_MONTHS, formatToIndonesianDate } from '../../utils/dateUtils';
import { Badge, Button, EmptyState, Input, PageHeader, Select, cn } from '../../ui';
import type { SendToProjector } from '../../types/content';
import { DEFAULT_DEVOTION_THEME } from '../../data/contentOptions';
import { useDevotions } from './useDevotions';

export default function DailyDevotionSection(props: { devotions?: AppItem[]; onSendToEasyWorship?: SendToProjector }) {
  const {
    activeDevotion, copied, filteredDevotions, handleCopyText, handleDownloadCard, handleShareWhatsApp, isGeneratingCard,
    onSendToEasyWorship, searchQuery, selectedTheme, selectDevotion, setSearchQuery, setSelectedTheme, sortedDevotions, themesList,
    selectedMonth, setSelectedMonth, monthsList, missingDate, pickDate, today
  } = useDevotions(props);
  const articleRef = useRef<HTMLElement>(null);
  const d = missingDate ? null : activeDevotion;
  // Archive grouped by month, newest first
  const groups: { month: string; items: AppItem[] }[] = [];
  filteredDevotions.forEach((dev) => {
    const key = String(dev.devotionDate || '').slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.month === key) last.items.push(dev);
    else groups.push({ month: key, items: [dev] });
  });
  const monthLabel = (key: string) => (/^\d{4}-\d{2}$/.test(key) ? `${INDONESIAN_MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}` : 'Tanpa tanggal');

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 md:px-6">
      <PageHeader eyebrow="Santapan Rohani Harian" title="Renungan Harian"
        description="Awali hari bersama firman Tuhan: refleksi dan doa bersama bagi seluruh insan Kristen Bank Mandiri." />

      {sortedDevotions.length === 0 ? (
        <EmptyState icon={<BookOpen size={22} />} title="Belum ada renungan" description="Renungan harian akan tampil di sini setelah dipublikasikan pengurus." />
      ) : (
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          {missingDate && (
            <section ref={articleRef} aria-live="polite" className="scroll-mt-24">
              <EmptyState icon={<CalendarClock size={22} />} title="Renungan sedang dipersiapkan"
                description={`Renungan untuk ${formatToIndonesianDate(missingDate)} belum tersedia. Silakan baca renungan lain di arsip.`}
                action={<Button variant="secondary" onClick={() => selectDevotion(sortedDevotions[0].id)}>Baca renungan terbaru</Button>} />
            </section>
          )}
          {d && (
            <article ref={articleRef} aria-labelledby="devotion-title" className="scroll-mt-24">
              <div className="flex flex-wrap items-center gap-3 text-[0.86rem]">
                <span className="font-semibold text-gold-ink">{formatToIndonesianDate(d.devotionDate)}</span>
                <Badge tone="gold">{d.theme || DEFAULT_DEVOTION_THEME}</Badge>
              </div>
              <h2 id="devotion-title" className="mt-4 font-display text-[clamp(1.9rem,4vw,2.8rem)] font-semibold leading-[1.1] text-ink">{d.title}</h2>

              <figure className="mt-8 border-l-2 border-gold pl-6">
                {d.scriptureText && <blockquote className="font-display text-[clamp(1.2rem,2.2vw,1.5rem)] italic leading-relaxed text-ink">“{d.scriptureText}”</blockquote>}
                <figcaption className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-gold-ink"><BookOpen size={16} aria-hidden="true" />{d.scriptureRef}</span>
                  {onSendToEasyWorship && (
                    <Button size="sm" variant="ghost" icon={<MonitorPlay size={14} aria-hidden="true" />}
                      onClick={() => onSendToEasyWorship({ type: 'bible', title: d.scriptureRef, text: d.scriptureText || '' })}>
                      Tampilkan di EasyWorship
                    </Button>
                  )}
                </figcaption>
              </figure>

              <div className="mt-8 max-w-[68ch] whitespace-pre-line text-[1.08rem] leading-[1.85] text-ink">{d.body}</div>

              {d.prayer && (
                <section aria-label="Doa penutup" className="mt-10 max-w-[68ch] rounded-lg bg-subtle px-6 py-5">
                  <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-gold-ink">Doa penutup</p>
                  <p className="mt-2 font-display text-[1.12rem] italic leading-relaxed text-ink">“{d.prayer}”</p>
                </section>
              )}

              <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
                <p className="text-[0.9rem] text-muted">Oleh <strong className="text-ink">{d.author || 'Bapekkris Bank Mandiri'}</strong></p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" icon={copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} onClick={() => handleCopyText(d)}>{copied ? 'Tersalin' : 'Salin teks'}</Button>
                  <Button size="sm" variant="secondary" icon={<MessageCircle size={14} aria-hidden="true" />} onClick={() => handleShareWhatsApp(d)}>Bagikan ke WhatsApp</Button>
                  <Button size="sm" variant="secondary" loading={isGeneratingCard} icon={<Download size={14} aria-hidden="true" />} onClick={() => handleDownloadCard(d)}>{isGeneratingCard ? 'Membuat gambar…' : 'Unduh gambar'}</Button>
                </div>
              </footer>
            </article>
          )}

          <aside aria-label="Arsip renungan" className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <h2 className="font-display text-[1.2rem] font-semibold text-ink">Arsip ({filteredDevotions.length})</h2>
            <div className="relative">
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
              <Input type="search" aria-label="Cari renungan" placeholder="Cari judul, ayat, atau penulis" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select aria-label="Bulan" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                <option value="all">Semua bulan</option>
                {monthsList.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </Select>
              <Select aria-label="Tema renungan" value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
                <option value="all">Semua tema</option>
                {themesList.map((t: string) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <label className="flex flex-col gap-1.5 text-[0.84rem] font-semibold text-ink">
              Buka renungan tanggal
              <Input type="date" max={today} value={missingDate || d?.devotionDate || ''}
                onChange={(e) => { pickDate(e.target.value); articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} />
            </label>
            <div className="flex max-h-[640px] flex-col overflow-y-auto rounded-lg border border-line bg-surface">
              {filteredDevotions.length === 0 && <p className="px-4 py-6 text-center text-[0.9rem] text-muted">Tidak ada renungan yang cocok.</p>}
              {groups.map((g) => (
                <section key={g.month} aria-label={monthLabel(g.month)}>
                  <h3 className="sticky top-0 z-[1] border-b border-line bg-subtle px-4 py-1.5 text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-dim">{monthLabel(g.month)}</h3>
                  <ul className="m-0 flex list-none flex-col divide-y divide-line p-0">
                    {g.items.map((dev) => {
                      const selected = d?.id === dev.id;
                      return (
                        <li key={dev.id}>
                          <button type="button" aria-current={selected ? 'true' : undefined}
                            onClick={() => { soundFx.playClick(); selectDevotion(dev.id); articleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                            className={cn('flex w-full cursor-pointer flex-col gap-1 border-0 px-4 py-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink',
                              selected ? 'bg-navy-tint' : 'bg-transparent hover:bg-subtle')}>
                            <span className="flex items-center justify-between gap-2 text-[0.76rem]">
                              <span className="font-semibold text-gold-ink">{formatToIndonesianDate(dev.devotionDate)}</span>
                              <span className="text-dim">{dev.scriptureRef}</span>
                            </span>
                            <span className={cn('font-display text-[1rem] font-semibold leading-snug', selected ? 'text-navy-ink' : 'text-ink')}>{dev.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
