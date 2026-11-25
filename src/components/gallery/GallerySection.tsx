import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Camera, Check, ChevronLeft, ChevronRight, Download, ExternalLink, Filter, FolderDown, Link2, Maximize2, MessageCircle, Search, X } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { formatWibDateTime } from '../../utils/dateUtils';
import { Badge, Button, EmptyState, Input, PageHeader, Pagination, cn } from '../../ui';
import { useModalBehavior } from '../../ui/useModalBehavior';
import { useGallery } from './useGallery';

const PER_PAGE = 6;
const overlayBtn = 'inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.25)] bg-[rgba(10,14,24,0.6)] px-3 text-[0.8rem] font-semibold text-white hover:bg-[rgba(10,14,24,0.85)] focus-visible:outline-2 focus-visible:outline-white';
const arrowBtn = 'absolute top-1/2 -translate-y-1/2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-0 bg-[rgba(10,14,24,0.55)] text-white hover:bg-[rgba(10,14,24,0.85)] focus-visible:outline-2 focus-visible:outline-white';

function Lightbox({ state }: { state: Record<string, any> }) {
  const { activeEvent: album, copiedGalleryId, currentPhotoUrl, eventPhotos, getDownloadPhotoUrl, handleCopyGalleryLink, handleShareGalleryWa, nextPhoto, prevPhoto, safePhotoIdx, setIsLightboxOpen } = state;
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setIsLightboxOpen(false);
  useModalBehavior(panelRef, true, close);
  return createPortal(
    <div ref={panelRef} role="dialog" aria-modal="true" aria-label={`Foto ${album.title}`} tabIndex={-1} onClick={close} className="fixed inset-0 z-[100000] flex flex-col bg-[rgba(3,6,12,0.94)] outline-none">
      <div onClick={(e) => e.stopPropagation()} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-white md:px-6">
        <div>
          <p className="font-display text-[1.05rem] font-semibold">{album.title}</p>
          <p className="text-[0.8rem] text-[rgba(255,255,255,0.7)]">Foto {safePhotoIdx + 1} dari {eventPhotos.length} · {formatWibDateTime(album.date)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={(e) => handleCopyGalleryLink(album, e)} className={overlayBtn}>{copiedGalleryId === album.id ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}{copiedGalleryId === album.id ? 'Tersalin' : 'Salin tautan'}</button>
          <button type="button" onClick={(e) => handleShareGalleryWa(album, e)} className={overlayBtn}><MessageCircle size={14} aria-hidden="true" />WhatsApp</button>
          <a href={getDownloadPhotoUrl(currentPhotoUrl)} download={`${String(album.title || 'dokumentasi').replace(/\s+/g, '_')}_${safePhotoIdx + 1}.jpg`} target="_blank" rel="noopener noreferrer" className={overlayBtn}><Download size={14} aria-hidden="true" />Unduh</a>
          <button type="button" onClick={close} aria-label="Tutup" className={cn(overlayBtn, 'px-2')}><X size={18} aria-hidden="true" /></button>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} className="relative flex flex-1 items-center justify-center px-4 pb-6 md:px-16">
        {eventPhotos.length > 1 && <button type="button" onClick={prevPhoto} aria-label="Foto sebelumnya" className={cn(arrowBtn, 'left-3 md:left-6')}><ChevronLeft size={24} aria-hidden="true" /></button>}
        <img src={currentPhotoUrl} alt={`${album.title} — foto ${safePhotoIdx + 1}`} className="max-h-[80vh] max-w-full rounded-md object-contain" />
        {eventPhotos.length > 1 && <button type="button" onClick={nextPhoto} aria-label="Foto berikutnya" className={cn(arrowBtn, 'right-3 md:right-6')}><ChevronRight size={24} aria-hidden="true" /></button>}
      </div>
    </div>,
    document.body
  );
}

export default function GallerySection(props: any) {
  const state = useGallery(props) as Record<string, any>;
  const {
    galleries, divisions, events, activeTenure, tenures, onNavigateEvent, onSelectGalleryUrl, navigateTo, copiedGalleryId, setCurrentPhotoIdx, searchQuery, setSearchQuery,
    divFilter, setDivFilter, tenureFilter, setTenureFilter, isLightboxOpen, setIsLightboxOpen, galleryPage, setGalleryPage, galleryNotFound, setGalleryNotFound,
    scopedGalleries, scopedDivisions, uniqueDivisions, filteredGalleries, activeEvent: album, eventPhotos, nextPhoto, prevPhoto, safePhotoIdx, currentPhotoUrl,
    getDownloadPhotoUrl, handleCopyGalleryLink, handleShareGalleryWa, handleSelectGallery
  } = state;

  const connectedEvent = (g: AppItem): AppItem | undefined => g.eventId ? events.find((e: AppItem) => String(e.id) === String(g.eventId) && e.isPublic === true) : undefined;
  const openEvent = (evt: AppItem) => (onNavigateEvent ? onNavigateEvent(evt.id) : navigateTo(`/?event=${encodeURIComponent(evt.id)}#event`));
  const resetPaging = () => { setCurrentPhotoIdx(0); setGalleryPage(1); };
  const pill = (active: boolean) => cn('inline-flex h-9 cursor-pointer items-center rounded-full border-0 px-4 text-[0.84rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
    active ? 'bg-action text-on-action' : 'bg-transparent text-muted hover:bg-subtle hover:text-ink');

  const divisionOptions = (() => {
    if (tenureFilter === 'active') {
      return scopedDivisions.length > 0
        ? scopedDivisions.map((d: AppItem) => <option key={d.id} value={d.id}>{d.name}</option>)
        : uniqueDivisions.map((name: string) => <option key={name} value={name}>{name}</option>);
    }
    const seen = new Set<string>();
    const groups = tenures.map((t: AppItem) => {
      const inTenure = divisions.filter((d: AppItem) => d.tenureId === t.id);
      inTenure.forEach((d: AppItem) => seen.add(d.id));
      return inTenure.length === 0 ? null : (
        <optgroup key={t.id} label={`Periode ${t.code} (${t.title || 'Kepengurusan'})`}>{inTenure.map((d: AppItem) => <option key={d.id} value={d.id}>{d.name} ({t.code})</option>)}</optgroup>
      );
    }).filter(Boolean);
    const rest = divisions.filter((d: AppItem) => !seen.has(d.id));
    return <>{groups}{rest.length > 0 && <optgroup label="Divisi lainnya">{rest.map((d: AppItem) => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>}</>;
  })();

  const pageCount = Math.ceil(filteredGalleries.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, galleryPage), pageCount);
  const visible: AppItem[] = filteredGalleries.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const albumEvent = album ? connectedEvent(album) : undefined;
  const docLinks: { url: string; text: string }[] = Array.isArray(album?.docLinks) ? album.docLinks : [];

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-24 md:px-6">
      <PageHeader eyebrow="Galeri" title="Momen persekutuan kita" description="Dokumentasi ibadah syukur, persekutuan, dan pelayanan kasih keluarga besar Bapekkris PT Bank Mandiri (Persero) Tbk." />

      {galleryNotFound && (
        <div className="mb-10">
          <EmptyState className="border-danger-line bg-danger-tint" icon={<Camera size={22} />} title="Album tidak ditemukan" description="Tautan album yang Anda tuju tidak ditemukan atau sudah dihapus pengelola."
            action={<div className="flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => { setGalleryNotFound(false); onSelectGalleryUrl?.(null); navigateTo('/#home'); }}>Kembali ke Beranda</Button>
              <Button onClick={() => { setGalleryNotFound(false); onSelectGalleryUrl?.(null); }}>Lihat semua album</Button>
            </div>} />
        </div>
      )}

      {!album || filteredGalleries.length === 0 ? (
        <EmptyState icon={<Camera size={22} />} title="Belum ada dokumentasi"
          description={scopedGalleries.length === 0 ? `Belum ada foto kegiatan untuk periode ${activeTenure?.title || activeTenure?.code || 'ini'}.` : 'Tidak ada album yang cocok dengan filter atau pencarian.'}
          action={scopedGalleries.length > 0 && (divFilter !== 'all' || searchQuery.trim() !== '') ? <Button variant="secondary" onClick={() => { setDivFilter('all'); setSearchQuery(''); setGalleryPage(1); }}>Tampilkan semua album</Button> : undefined} />
      ) : (
        <article aria-labelledby="album-title" className="mb-16">
          <div className="relative overflow-hidden rounded-xl bg-[#0b1220]">
            <button type="button" onClick={() => setIsLightboxOpen(true)} aria-label="Perbesar foto" className="block w-full cursor-zoom-in border-0 bg-transparent p-0">
              <img src={currentPhotoUrl} alt={`${album.title} — foto ${safePhotoIdx + 1}`} className="mx-auto aspect-[16/9] w-full object-contain" />
            </button>
            <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setIsLightboxOpen(true)} className={overlayBtn}><Maximize2 size={14} aria-hidden="true" />Layar penuh</button>
              <a href={getDownloadPhotoUrl(currentPhotoUrl)} download={`${String(album.title || 'dokumentasi').replace(/\s+/g, '_')}_${safePhotoIdx + 1}.jpg`} target="_blank" rel="noopener noreferrer" className={overlayBtn}><Download size={14} aria-hidden="true" />Unduh</a>
            </div>
            {eventPhotos.length > 1 && <>
              <button type="button" onClick={prevPhoto} aria-label="Foto sebelumnya" className={cn(arrowBtn, 'left-3')}><ChevronLeft size={22} aria-hidden="true" /></button>
              <button type="button" onClick={nextPhoto} aria-label="Foto berikutnya" className={cn(arrowBtn, 'right-3')}><ChevronRight size={22} aria-hidden="true" /></button>
            </>}
            {eventPhotos.length > 0 && <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[rgba(10,14,24,0.6)] px-3 py-1 text-[0.78rem] font-semibold text-white" aria-live="polite">{safePhotoIdx + 1} / {eventPhotos.length}</span>}
          </div>

          {eventPhotos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Pilih foto">
              {eventPhotos.map((photo: string, i: number) => (
                <button key={i} type="button" onClick={() => setCurrentPhotoIdx(i)} aria-label={`Foto ${i + 1}`} aria-current={i === safePhotoIdx ? 'true' : undefined}
                  className={cn('h-16 w-24 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 p-0', i === safePhotoIdx ? 'border-gold' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <img src={photo} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3 text-[0.86rem] text-muted">
              <span className="inline-flex items-center gap-1.5 font-semibold text-gold-ink"><Calendar size={15} aria-hidden="true" />{formatWibDateTime(album.date) || '—'}</span>
              <span>{album.divisionName || album.division || 'Bapekkris Bank Mandiri'}</span>
              {albumEvent && <button type="button" onClick={() => openEvent(albumEvent)} className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 font-semibold text-navy-ink hover:underline">Acara: {albumEvent.title}<ExternalLink size={13} aria-hidden="true" /></button>}
            </div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h2 id="album-title" className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight text-ink">{album.title}</h2>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={copiedGalleryId === album.id ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />} onClick={(e) => handleCopyGalleryLink(album, e)}>{copiedGalleryId === album.id ? 'Tautan tersalin' : 'Salin tautan'}</Button>
                <Button size="sm" variant="secondary" icon={<MessageCircle size={14} aria-hidden="true" />} onClick={(e) => handleShareGalleryWa(album, e)}>Bagikan ke WhatsApp</Button>
              </div>
            </div>
            {album.description && <p className="max-w-[70ch] whitespace-pre-line leading-relaxed text-muted">{album.description}</p>}
            {docLinks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {docLinks.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-navy-line bg-navy-tint px-4 py-2 text-[0.86rem] font-semibold text-navy-ink hover:border-navy-ink">
                    <FolderDown size={15} aria-hidden="true" />{doc.text}<ExternalLink size={13} aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </article>
      )}

      {scopedGalleries.length > 0 && (
        <section aria-label="Arsip dokumentasi">
          <div className="mb-5 flex flex-col gap-3 border-y border-line py-4 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="font-display text-[1.3rem] font-semibold text-ink">Arsip album ({filteredGalleries.length})</h2>
            <div className="flex flex-wrap items-center gap-2">
              {activeTenure && (
                <div role="group" aria-label="Periode" className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
                  <button type="button" aria-pressed={tenureFilter === 'active'} onClick={() => { setTenureFilter('active'); resetPaging(); }} className={pill(tenureFilter === 'active')}>Periode {activeTenure?.code || activeTenure?.title || ''}</button>
                  <button type="button" aria-pressed={tenureFilter === 'all'} onClick={() => { setTenureFilter('all'); resetPaging(); }} className={pill(tenureFilter === 'all')}>Semua ({galleries.length})</button>
                </div>
              )}
              <div className="relative">
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
                <Input type="search" aria-label="Cari album" placeholder="Cari album" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); resetPaging(); }} className="w-52 rounded-full pl-10" />
              </div>
              <label className="relative inline-flex items-center">
                <span className="sr-only">Filter divisi</span>
                <Filter size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 text-dim" />
                <select value={divFilter} onChange={(e) => { setDivFilter(e.target.value); resetPaging(); }}
                  className="h-11 cursor-pointer appearance-none rounded-full border border-line bg-surface pl-9 pr-6 text-[0.86rem] font-semibold text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink">
                  <option value="all">Semua divisi</option>
                  {divisionOptions}
                </select>
              </label>
            </div>
          </div>
          {filteredGalleries.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-muted">Tidak ada album yang cocok.</p>
          ) : (
            <div className="flex flex-col gap-6">
              <ul className="grid list-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((g) => {
                  const selected = album?.id === g.id;
                  const evt = connectedEvent(g);
                  const cover = Array.isArray(g.photos) && g.photos[0];
                  return (
                    <li key={g.id}>
                      <div className={cn('relative flex h-full flex-col overflow-hidden rounded-lg border bg-surface shadow-card transition-[border-color,transform] hover:-translate-y-0.5', selected ? 'border-navy-ink' : 'border-line hover:border-line-strong')}>
                        <div className="aspect-[16/10] bg-subtle">{cover ? <img src={cover} alt="" loading="lazy" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center text-dim"><Camera size={26} aria-hidden="true" /></span>}</div>
                        <div className="flex flex-1 flex-col gap-1.5 p-4">
                          <span className="text-[0.78rem] font-semibold text-gold-ink">{formatWibDateTime(g.date) || '—'}</span>
                          <h3 className="font-display text-[1.08rem] font-semibold leading-snug text-ink">
                            <button type="button" onClick={() => { handleSelectGallery(g.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-current={selected ? 'true' : undefined}
                              className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] [color:inherit] after:absolute after:inset-0 focus-visible:outline-none [&:focus-visible]:after:outline-2 [&:focus-visible]:after:outline-navy-ink">
                              {g.title}
                            </button>
                          </h3>
                          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                            {(g.divisionName || g.division) && <Badge>{g.divisionName || g.division}</Badge>}
                            {evt && <button type="button" onClick={() => openEvent(evt)} className="relative z-10 cursor-pointer border-0 bg-transparent p-0"><Badge tone="navy">Acara: {evt.title}</Badge></button>}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Pagination page={page} pageCount={pageCount} onChange={setGalleryPage} itemLabel="album" total={filteredGalleries.length} pageSize={PER_PAGE} />
            </div>
          )}
        </section>
      )}

      {isLightboxOpen && album && <Lightbox state={state} />}
    </div>
  );
}
