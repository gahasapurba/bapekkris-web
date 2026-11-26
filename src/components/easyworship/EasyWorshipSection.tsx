import { useState } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, ChevronDown, ChevronUp, ExternalLink, Layers, MonitorOff, MonitorSmartphone, Plus, Radio, Save, Sparkles, Trash2, Type } from 'lucide-react';
import { soundFx } from '../../utils/audio';
import { BIBLE_BOOKS } from '../../data/bibleBooks';
import { Badge, Button, Card, Dialog, Field, Input, Select, Tabs, Textarea, cn, useFeedback } from '../../ui';
import type { ProjectorItem, Song } from '../../types/content';
import type { AppItem } from '../../lib/supabase';
import { formatToIndonesianDate, toWibIsoDate } from '../../utils/dateUtils';
import { useEasyWorship } from './useEasyWorship';
import RemoteProjectorDialog from './RemoteProjectorDialog';

/** Projection backgrounds, identical to the projector window (ProjectorDisplay). */
const orderButton = 'cursor-pointer rounded-full border-0 bg-transparent p-2 text-dim hover:bg-subtle hover:text-ink disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent';

const SCREEN_BG: Record<string, string> = {
  heavenly: 'linear-gradient(135deg, #001c3d 0%, #003d79 40%, #ffb800 100%)',
  celestial: 'radial-gradient(circle at center, #003d79 0%, #021226 70%, #010814 100%)',
  minimal: '#000000',
  cathedral: 'linear-gradient(135deg, #040914 0%, #002244 45%, #003d79 80%, #040914 100%)'
};

export default function EasyWorshipSection(props: { songs?: Song[]; initialItem?: ProjectorItem | null; schedules?: AppItem[]; onSaveSchedule?: (schedule: AppItem) => unknown }) {
  const {
    playlist, setPlaylist, activeItem, setActiveItemId, slides, activeSlideIndex, setActiveSlideIndex, liveState, isAddModalOpen, setIsAddModalOpen,
    addTab, setAddTab, songSearchQuery, setSongSearchQuery, selectedBibleBook, setSelectedBibleBook, selectedBibleChapter, setSelectedBibleChapter,
    selectedBibleVerse, setSelectedBibleVerse, customTitle, setCustomTitle, customText, setCustomText, toastMsg, filteredAvailableSongs,
    broadcastLiveState, handleGoLive, handleToggleBlackout, handleToggleClearText, handleToggleLogo, handleOpenProjectorWindow, handleSavePlaylist, handleAddItemToPlaylist,
    roomCode, connectedScreens, startRemoteRoom, stopRemoteRoom, schedules, loadSchedule, saveSchedule
  } = useEasyWorship(props);
  const [isRemoteOpen, setIsRemoteOpen] = useState(false);
  const { confirm, toast } = useFeedback();
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [saveOpen, setSaveOpen] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDate, setScheduleDate] = useState(toWibIsoDate());
  const scheduleLabel = (s: AppItem) => `${s.title}${s.serviceDate ? ` · ${formatToIndonesianDate(s.serviceDate)}` : ''}`;

  const openSchedule = async () => {
    const schedule = schedules.find((s) => s.id === selectedScheduleId);
    if (!schedule) return;
    if (playlist.length > 0 && !(await confirm({ title: `Muat "${schedule.title}"?`, message: 'Tata ibadah yang sedang disusun akan diganti dengan jadwal ini.', confirmLabel: 'Muat jadwal' }))) return;
    loadSchedule(schedule);
    toast(`Jadwal "${schedule.title}" dimuat`);
  };
  const submitSchedule = async () => {
    if (!saveSchedule || !scheduleTitle.trim()) return;
    await saveSchedule(scheduleTitle.trim(), scheduleDate);
    setSaveOpen(false);
    setScheduleTitle('');
    toast('Jadwal tersimpan dan dapat dimuat operator lain');
  };

  const goSlide = (index: number) => { setActiveSlideIndex(index); handleGoLive(activeItem, index); };
  const status = liveState.isBlackout ? 'Layar padam' : liveState.isLogo ? 'Layar logo' : 'Live';
  const screenBg = liveState.isBlackout ? '#000000' : SCREEN_BG[liveState.bgTheme] || SCREEN_BG.cathedral;
  const movePlaylistItem = (index: number, delta: number) => setPlaylist((prev) => {
    const target = index + delta;
    if (target < 0 || target >= prev.length) return prev;
    const next = [...prev];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const toggle = (on: boolean) => cn('flex h-10 cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 text-[0.82rem] font-semibold leading-tight transition-colors focus-visible:outline-2 focus-visible:outline-navy-ink',
    on ? 'border-action bg-action text-on-action' : 'border-line bg-surface text-ink hover:border-line-strong');

  return (
    <div className="mx-auto w-full max-w-[1480px] px-4 pb-20 pt-10 md:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="inline-flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-gold-ink"><Radio size={14} aria-hidden="true" />Multimedia Live</p>
          <h1 className="mt-2 font-display text-[clamp(1.8rem,3.4vw,2.4rem)] font-semibold leading-tight text-ink">Konsol presentasi ibadah</h1>
          <p className="mt-1 text-muted">Susun tata ibadah, pilih slide, dan tayangkan ke proyektor. Pintasan: ↓/spasi berikutnya, ↑ sebelumnya, F5 layar hitam.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon={<Save size={16} aria-hidden="true" />} onClick={handleSavePlaylist}>{toastMsg ? 'Tersimpan' : 'Simpan tata ibadah'}</Button>
          <Button variant="secondary" icon={<MonitorSmartphone size={16} aria-hidden="true" />} onClick={() => { startRemoteRoom(); setIsRemoteOpen(true); }}>
            {roomCode ? `Perangkat lain (${connectedScreens})` : 'Sambungkan perangkat lain'}
          </Button>
          <Button icon={<ExternalLink size={16} aria-hidden="true" />} onClick={handleOpenProjectorWindow}>Buka layar proyektor</Button>
        </div>
        {(schedules.length > 0 || saveSchedule) && (
          <div className="flex w-full flex-wrap items-center gap-2 rounded-md border border-line bg-surface p-3">
            <span className="flex items-center gap-1.5 text-[0.86rem] font-semibold text-ink"><CalendarDays size={15} aria-hidden="true" className="text-gold-ink" />Jadwal tersimpan</span>
            {schedules.length > 0 ? (
              <>
                <Select aria-label="Pilih jadwal tersimpan" className="min-w-0 flex-1 sm:max-w-sm" value={selectedScheduleId} onChange={(e) => setSelectedScheduleId(e.target.value)}>
                  <option value="">Pilih jadwal</option>
                  {schedules.map((s) => <option key={s.id} value={s.id}>{scheduleLabel(s)}</option>)}
                </Select>
                <Button size="sm" variant="secondary" disabled={!selectedScheduleId} onClick={openSchedule}>Muat ke konsol</Button>
              </>
            ) : <span className="text-[0.86rem] text-muted">Belum ada jadwal.</span>}
            {saveSchedule && (
              <Button size="sm" variant="secondary" icon={<Save size={14} aria-hidden="true" />} disabled={playlist.length === 0} onClick={() => setSaveOpen(true)} className="sm:ml-auto">Simpan sebagai jadwal</Button>
            )}
          </div>
        )}
      </header>
      {saveOpen && (
        <Dialog open onClose={() => setSaveOpen(false)} size="sm" title="Simpan sebagai jadwal" description={`${playlist.length} tayangan dalam tata ibadah ini akan disimpan.`}
          footer={<><Button variant="secondary" onClick={() => setSaveOpen(false)}>Batal</Button><Button disabled={!scheduleTitle.trim()} onClick={submitSchedule}>Simpan jadwal</Button></>}>
          <div className="flex flex-col gap-4">
            <Field label="Nama jadwal" required><Input placeholder="Contoh: Ibadah Jumat Bapekkris" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} /></Field>
            <Field label="Tanggal ibadah"><Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} /></Field>
          </div>
        </Dialog>
      )}
      <RemoteProjectorDialog open={isRemoteOpen} onClose={() => setIsRemoteOpen(false)} roomCode={roomCode} connectedScreens={connectedScreens} onStop={stopRemoteRoom} />

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_420px]">
        <Card padding="none" className="flex max-h-[720px] flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-ink"><Layers size={16} aria-hidden="true" className="text-gold-ink" />Tata ibadah ({playlist.length})</h2>
            <Button size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />} onClick={() => setIsAddModalOpen(true)}>Tambah</Button>
          </div>
          {playlist.length === 0 ? (
            <p className="px-4 py-10 text-center text-[0.9rem] text-muted">Tata ibadah masih kosong. Tambahkan item, atau kirim lagu/ayat dari halaman Kidung dan Alkitab.</p>
          ) : (
            <ol className="flex-1 list-none overflow-y-auto">
              {playlist.map((item, i) => {
                const selected = activeItem?.id === item.id;
                return (
                  <li key={item.id} className={cn('flex items-center gap-2 border-b border-line pr-2', selected ? 'bg-navy-tint' : 'hover:bg-subtle')}>
                    <button type="button" aria-current={selected ? 'true' : undefined} onClick={() => { soundFx.playClick(); setActiveItemId(item.id); setActiveSlideIndex(0); }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink">
                      <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full text-[0.74rem] font-semibold', selected ? 'bg-action text-on-action' : 'bg-subtle text-muted')}>{i + 1}</span>
                      <span className="min-w-0">
                        <span className={cn('block truncate text-[0.9rem] font-semibold', selected ? 'text-navy-ink' : 'text-ink')}>{item.title}</span>
                        <span className="block truncate text-[0.76rem] text-dim">{item.subtitle || item.type}</span>
                      </span>
                    </button>
                    <span className="flex shrink-0 items-center">
                      <button type="button" aria-label={`Naikkan ${item.title}`} disabled={i === 0} onClick={() => movePlaylistItem(i, -1)} className={orderButton}><ArrowUp size={14} aria-hidden="true" /></button>
                      <button type="button" aria-label={`Turunkan ${item.title}`} disabled={i === playlist.length - 1} onClick={() => movePlaylistItem(i, 1)} className={orderButton}><ArrowDown size={14} aria-hidden="true" /></button>
                      <button type="button" aria-label={`Hapus ${item.title} dari tata ibadah`} onClick={() => setPlaylist((prev) => prev.filter((p) => p.id !== item.id))}
                        className="cursor-pointer rounded-full border-0 bg-transparent p-2 text-dim hover:bg-danger-tint hover:text-danger"><Trash2 size={14} aria-hidden="true" /></button>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <Card padding="none" className="flex max-h-[720px] flex-col">
          <div className="border-b border-line px-4 py-3">
            <h2 className="truncate font-display text-[1.05rem] font-semibold text-ink">{activeItem?.title || 'Pilih item'}</h2>
            <p className="text-[0.8rem] text-dim">Klik slide untuk langsung menayangkannya.</p>
          </div>
          <ol className="flex flex-1 list-none flex-col gap-2 overflow-y-auto p-3">
            {slides.map((s, i) => {
              const live = activeSlideIndex === i;
              return (
                <li key={i}>
                  <button type="button" aria-current={live ? 'true' : undefined} onClick={() => goSlide(i)}
                    className={cn('w-full cursor-pointer rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-navy-ink',
                      live ? 'border-success bg-success-tint' : 'border-line bg-page hover:border-line-strong')}>
                    <span className="mb-1 flex items-center justify-between text-[0.74rem] font-semibold uppercase tracking-[0.1em]">
                      <span className="text-gold-ink">{s.label}</span>{live && <span className="text-success">● Tayang</span>}
                    </span>
                    <span className="block whitespace-pre-line text-[0.92rem] leading-relaxed text-ink">{s.text}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="flex gap-2 border-t border-line p-3">
            <Button variant="secondary" className="flex-1" disabled={activeSlideIndex <= 0} icon={<ChevronUp size={16} aria-hidden="true" />} onClick={() => goSlide(Math.max(0, activeSlideIndex - 1))}>Sebelumnya</Button>
            <Button className="flex-1" disabled={activeSlideIndex >= slides.length - 1} icon={<ChevronDown size={16} aria-hidden="true" />} onClick={() => goSlide(Math.min(slides.length - 1, activeSlideIndex + 1))}>Berikutnya</Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <section aria-label="Pratinjau layar live" className="overflow-hidden rounded-lg border border-line bg-[#05080f] p-3">
            <div className="mb-2 flex items-center justify-between text-[0.76rem]">
              <span className="inline-flex items-center gap-2 font-semibold text-white">
                <span className={cn('size-2 rounded-full', liveState.isBlackout ? 'bg-[#64748b]' : 'bg-[#ef4444]')} aria-hidden="true" />{status}
              </span>
              <span className="text-[#94a3b8]">16:9</span>
            </div>
            <div className="relative flex aspect-video flex-col items-center overflow-hidden rounded-md text-center text-white" style={{ background: screenBg, justifyContent: liveState.isLowerThird ? 'flex-end' : 'center' }}>
              {liveState.isLogo && !liveState.isClearText && (
                <div className="px-6">
                  <p className="font-display text-[1.4rem] font-semibold">Bapekkris Bank Mandiri</p>
                  <p className="text-[0.8rem] text-[#ffb800]">Badan Pembinaan Kerohanian Kristen</p>
                </div>
              )}
              {!liveState.isLogo && !liveState.isClearText && !liveState.isBlackout && (
                <div className={cn('w-full px-6', liveState.isLowerThird && 'border-t-2 border-[#ffb800] bg-[rgba(0,20,45,0.9)] py-3')}>
                  {liveState.title && <p className="mb-2 text-[0.8rem] font-semibold text-[#ffb800]">{liveState.title}</p>}
                  <p className={cn('whitespace-pre-line font-semibold leading-snug [text-shadow:0_2px_8px_rgba(0,0,0,0.6)]', liveState.isLowerThird ? 'text-[0.9rem]' : 'text-[1.1rem]')}>{liveState.text}</p>
                </div>
              )}
            </div>
          </section>

          <Card className="flex flex-col gap-4">
            <h2 className="font-display text-[1.05rem] font-semibold text-ink">Kontrol operator</h2>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" aria-pressed={!!liveState.isBlackout} onClick={handleToggleBlackout} className={cn(toggle(!!liveState.isBlackout), 'h-16 flex-col')}><MonitorOff size={15} aria-hidden="true" />Layar hitam</button>
              <button type="button" aria-pressed={!!liveState.isClearText} onClick={handleToggleClearText} className={cn(toggle(!!liveState.isClearText), 'h-16 flex-col')}><Type size={15} aria-hidden="true" />{liveState.isClearText ? 'Tampilkan teks' : 'Tanpa teks'}</button>
              <button type="button" aria-pressed={!!liveState.isLogo} onClick={handleToggleLogo} className={cn(toggle(!!liveState.isLogo), 'h-16 flex-col')}><Sparkles size={15} aria-hidden="true" />Logo</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Latar layar">
                <Select value={liveState.bgTheme || 'cathedral'} onChange={(e) => broadcastLiveState({ ...liveState, bgTheme: e.target.value })}>
                  <option value="cathedral">Cathedral (bawaan)</option>
                  <option value="heavenly">Heavenly Golden Dawn</option>
                  <option value="celestial">Celestial Deep Navy</option>
                  <option value="minimal">Hitam polos</option>
                </Select>
              </Field>
              <div className="flex flex-col gap-1.5">
                <span className="text-[0.84rem] font-semibold text-muted">Tampilan</span>
                <button type="button" aria-pressed={!!liveState.isLowerThird} onClick={() => broadcastLiveState({ ...liveState, isLowerThird: !liveState.isLowerThird })} className={cn(toggle(!!liveState.isLowerThird), 'h-11')}>
                  {liveState.isLowerThird ? 'Lower-third (OBS)' : 'Layar penuh'}
                </button>
              </div>
            </div>
            <Badge tone="info" className="self-start">Tayangan disinkronkan ke jendela proyektor yang terbuka</Badge>
          </Card>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Tambah ke tata ibadah" size="md">
        <Tabs label="Jenis item" value={addTab} onChange={setAddTab} items={[{ id: 'song', label: 'Lagu' }, { id: 'bible', label: 'Ayat' }, { id: 'custom', label: 'Teks bebas' }]} />
        <div className="mt-5">
          {addTab === 'song' && (
            <div className="flex flex-col gap-3">
              <Input type="search" aria-label="Cari lagu" placeholder="Judul atau nomor, mis. KJ 001" value={songSearchQuery} onChange={(e) => setSongSearchQuery(e.target.value)} data-autofocus />
              <ul className="flex max-h-64 list-none flex-col divide-y divide-line overflow-y-auto rounded-md border border-line">
                {filteredAvailableSongs.length === 0 && <li className="px-4 py-6 text-center text-[0.88rem] text-muted">Tidak ada lagu yang cocok. Gunakan tab Teks bebas.</li>}
                {filteredAvailableSongs.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => handleAddItemToPlaylist({ id: `ew-${Date.now()}`, type: 'song', title: `${s.songNumber ? `${s.songNumber} - ` : ''}${s.title}`, subtitle: s.category || 'Lagu Pujian', text: s.lyrics || '' })}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-4 py-2.5 text-left hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink">
                      <span className="text-[0.9rem] text-ink">{s.songNumber && <span className="mr-2 font-semibold text-gold-ink">{s.songNumber}</span>}{s.title}</span>
                      <span className="shrink-0 text-[0.74rem] text-dim">{s.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {addTab === 'bible' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-3">
                <Field label="Kitab"><Select value={selectedBibleBook.id} onChange={(e) => setSelectedBibleBook(BIBLE_BOOKS.find((b) => b.id === e.target.value) || BIBLE_BOOKS[0])}>{BIBLE_BOOKS.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
                <Field label="Pasal"><Input type="number" min={1} value={selectedBibleChapter} onChange={(e) => setSelectedBibleChapter(Number(e.target.value) || 1)} /></Field>
                <Field label="Ayat"><Input placeholder="mis. 1-3" value={selectedBibleVerse} onChange={(e) => setSelectedBibleVerse(e.target.value)} /></Field>
              </div>
              <Button icon={<Plus size={16} aria-hidden="true" />} className="self-start"
                onClick={() => handleAddItemToPlaylist({ id: `ew-${Date.now()}`, type: 'bible', title: `${selectedBibleBook.name} ${selectedBibleChapter}:${selectedBibleVerse}`, subtitle: 'Pembacaan Alkitab', text: `${selectedBibleBook.name} ${selectedBibleChapter}:${selectedBibleVerse}` })}>
                Tambahkan ayat
              </Button>
            </div>
          )}
          {addTab === 'custom' && (
            <div className="flex flex-col gap-4">
              <Field label="Judul slide" required><Input placeholder="mis. Warta jemaat / Tema khotbah" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} /></Field>
              <Field label="Isi teks"><Textarea placeholder="Teks atau pengumuman yang ditampilkan di layar" value={customText} onChange={(e) => setCustomText(e.target.value)} /></Field>
              <Button icon={<Plus size={16} aria-hidden="true" />} className="self-start" disabled={!customTitle.trim()}
                onClick={() => { handleAddItemToPlaylist({ id: `ew-${Date.now()}`, type: 'custom', title: customTitle, subtitle: 'Pengumuman / Liturgi', text: customText }); setCustomTitle(''); setCustomText(''); }}>
                Tambahkan slide
              </Button>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
