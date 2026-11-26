import { CalendarDays, Download, Edit2, List, MapPin, Plus, Trash2, Users, Wallet } from 'lucide-react';
import EventCalendarView from '../../components/events/EventCalendarView';
import { formatLastUpdatedWib, formatWibEventRange, formatWibTimestamp, toDatetimeLocalValue, toWibIsoDate } from '../../utils/dateUtils';
import { getUnifiedEventAttendees } from '../../utils/quotaUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea, cn } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, CheckField, FilterSelect, IconButton, ListToolbar, SearchBox, Switch } from '../AdminUi';
import { downloadCsv } from '../csv';
import { useAdminPortal } from '../AdminPortalContext';
import { EVENT_CATEGORIES as CATEGORIES } from '../adminConstants';
import { eventCreateSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';

type EventForm = {
  eventTitle: string; eventTenureId: string; eventDivId: string; eventCategory: string; eventStartDate: string; eventEndDate: string;
  eventLocation: string; eventKpi: string; eventRab: string; eventStatus: string; eventIsLimited: boolean; eventMaxQuota: string;
  eventIsPublic: boolean; eventDesc: string;
};

const EVENTS_PER_PAGE = 8;
const RSVPS_PER_PAGE = 10;
const STATUS_LABEL: Record<string, string> = { Upcoming: 'Akan datang', Ongoing: 'Berjalan', Completed: 'Selesai' };

export default function EventsTab() {
  const {
    activeTenure, adminEventPage, adminEventViewMode, adminRsvpPage, divisions, eventCatFilter, eventDivFilter, eventPublicFilter,
    eventRsvps, eventSearchQuery, eventStatusFilter, eventTenureFilter, events, forms, handleDeleteEventClick, onAddEvent, onDeleteEvent,
    onDeleteEventRsvp, onUpdateEvent, registrationCounts, rsvpEventFilter, rsvpModeFilter, rsvpSearchQuery, setAdminEventPage,
    setAdminEventViewMode, setAdminRsvpPage, setDeleteConfirm, setEditingItem, setEventCatFilter, setEventDivFilter, setEventPublicFilter,
    setEventSearchQuery, setEventStatusFilter, setEventTenureFilter, setRsvpEventFilter, setRsvpModeFilter, setRsvpSearchQuery, showToast, tenures, theme
  } = useAdminPortal();

  const tenureOfEvent = (e: any) => e?.tenureId || divisions.find((d: any) => d.id === e?.divisionId)?.tenureId || '';
  const divisionsOf = (tenureId: string) => divisions.filter((d: any) => d.tenureId === (tenureId || activeTenure?.id || ''));
  const { handleSubmit, field, watch, setValue, setError, clearErrors, resetToDefaults, formState: { errors } } = useAdminDraftForm<EventForm>(
    'event',
    (v) => eventCreateSchema({ divisionIds: divisionsOf(v.eventTenureId).map((d: any) => d.id) }),
    {
      eventTitle: '', eventTenureId: activeTenure?.id || '', eventDivId: '', eventCategory: '', eventStartDate: '', eventEndDate: '',
      eventLocation: '', eventKpi: '', eventRab: '', eventStatus: 'Upcoming', eventIsLimited: false, eventMaxQuota: '', eventIsPublic: false, eventDesc: ''
    }
  );
  const ev = watch();
  const formTenure = ev.eventTenureId || activeTenure?.id || '';
  const divsForTenure = divisionsOf(ev.eventTenureId);

  // Start/end are checked against each other as soon as either changes
  const onStart = (val: string) => {
    setValue('eventStartDate', val);
    const s = toDatetimeLocalValue(val); const e = toDatetimeLocalValue(ev.eventEndDate);
    if (s && e && s > e) setError('eventStartDate', { message: 'Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir' });
    else clearErrors(['eventStartDate', 'eventEndDate']);
  };
  const onEnd = (val: string) => {
    setValue('eventEndDate', val);
    const s = toDatetimeLocalValue(ev.eventStartDate); const e = toDatetimeLocalValue(val);
    if (s && e && e < s) setError('eventEndDate', { message: 'Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai' });
    else clearErrors(['eventEndDate', 'eventStartDate']);
  };

  const createEvent = handleSubmit((f) => {
    const divObj = divisions.find((d: any) => d.id === f.eventDivId);
    const sDate = toDatetimeLocalValue(f.eventStartDate) || toWibIsoDate();
    const eDate = toDatetimeLocalValue(f.eventEndDate) || sDate;
    const category = f.eventCategory.trim();
    onAddEvent?.({
      id: 'evt-' + Date.now(),
      tenureId: formTenure,
      divisionId: f.eventDivId,
      divisionName: divObj?.name || '',
      title: f.eventTitle.trim(),
      date: formatWibEventRange(sDate, eDate),
      startDate: sDate,
      endDate: eDate,
      category,
      kategori: category,
      badge: category,
      location: f.eventLocation.trim(),
      peserta: f.eventKpi.trim(),
      kpi: f.eventKpi.trim(),
      description: f.eventDesc.trim(),
      status: f.eventStatus,
      isPublic: f.eventIsPublic,
      isLimited: f.eventIsLimited,
      maxQuota: f.eventIsLimited ? Number(f.eventMaxQuota || 0) : 0,
      totalRab: Number(f.eventRab)
    });
    // Period, division and status stay selected for the next event, as before.
    resetToDefaults();
    setValue('eventTenureId', f.eventTenureId);
    setValue('eventDivId', f.eventDivId);
    setValue('eventStatus', f.eventStatus);
    showToast(`Event "${f.eventTitle.trim()}" berhasil ditambahkan & disinkronkan!`);
  }, (errs) => showToast(errs.eventStartDate?.message || errs.eventEndDate?.message || 'Mohon lengkapi kolom wajib pada form Event', 'error'));

  // events list
  const q = eventSearchQuery.trim().toLowerCase();
  const filtered = events.filter((evt: any) =>
    (!q || [evt.title, evt.location, evt.description, evt.category || evt.badge].some((v) => String(v || '').toLowerCase().includes(q))) &&
    (eventTenureFilter === 'all' || tenureOfEvent(evt) === eventTenureFilter) &&
    (eventCatFilter === 'all' || (evt.category || evt.badge) === eventCatFilter) &&
    (eventDivFilter === 'all' || evt.divisionId === eventDivFilter) &&
    (eventStatusFilter === 'all' || evt.status === eventStatusFilter) &&
    (eventPublicFilter === 'all' || (eventPublicFilter === 'public' && evt.isPublic === true) || (eventPublicFilter === 'draft' && !evt.isPublic)));
  const pageCount = Math.ceil(filtered.length / EVENTS_PER_PAGE) || 1;
  const page = Math.min(Math.max(1, adminEventPage), pageCount);
  const visible = filtered.slice((page - 1) * EVENTS_PER_PAGE, page * EVENTS_PER_PAGE);

  // RSVPs
  const tenureObj = eventTenureFilter !== 'all' ? tenures.find((t: any) => t.id === eventTenureFilter) : null;
  const rsvpEvents = events.filter((e: any) => eventTenureFilter === 'all' || tenureOfEvent(e) === eventTenureFilter);
  const rq = rsvpSearchQuery.trim().toLowerCase();
  const rsvps = eventRsvps.filter((r: any) => {
    const evt = events.find((e: any) => e.id === r.eventId);
    if (eventTenureFilter !== 'all' && (!evt || tenureOfEvent(evt) !== eventTenureFilter)) return false;
    if (rsvpEventFilter !== 'all' && r.eventId !== rsvpEventFilter) return false;
    const mode = String(r.attendanceMode || '').toLowerCase();
    if (rsvpModeFilter === 'onsite' && !mode.includes('onsite')) return false;
    if (rsvpModeFilter === 'online' && !mode.includes('online')) return false;
    if (rq && ![r.attendeeName, r.notes, evt?.title || r.eventTitle].some((v) => String(v || '').toLowerCase().includes(rq))) return false;
    return true;
  });
  const rPageCount = Math.ceil(rsvps.length / RSVPS_PER_PAGE) || 1;
  const rPage = Math.min(Math.max(1, adminRsvpPage), rPageCount);
  const rVisible = rsvps.slice((rPage - 1) * RSVPS_PER_PAGE, rPage * RSVPS_PER_PAGE);
  const titleOf = (r: any) => events.find((e: any) => e.id === r.eventId)?.title || r.eventTitle || 'Kegiatan';
  const rsvpFiltered = rsvpSearchQuery || rsvpEventFilter !== 'all' || rsvpModeFilter !== 'all';

  const exportRsvp = () => {
    downloadCsv(`daftar_hadir_rsvp_bapekkris_${Date.now()}.csv`, ['ID RSVP', 'ID Event', 'Nama Kegiatan', 'Nama Peserta', 'Mode Kehadiran', 'Catatan', 'Waktu Konfirmasi'],
      rsvps.map((r: any) => [r.id, r.eventId, titleOf(r), r.attendeeName, r.attendanceMode, r.notes || '', formatWibTimestamp(r.createdAt || r.submittedAt).exact || r.submittedAt || r.createdAt || '']));
    showToast(`Berhasil mengunduh ${rsvps.length} data RSVP ke CSV!`);
  };

  return (
    <>
      <AdminPanel title={`Ibadah & acara (${events.length})`} description="Agenda dengan tanggal mulai dan selesai untuk daftar dan kalender acara. Acara baru tersimpan sebagai draf sampai dipublikasikan.">
        <AdminSubsection title="Tambah acara">
          <form onSubmit={createEvent} noValidate className="grid gap-4 md:grid-cols-2">
            <Field label="Nama acara" required error={errors.eventTitle?.message}>
              <Input placeholder="Contoh: Ibadah Natal 2026" {...field('eventTitle')} />
            </Field>
            <Field label="Periode" required>
              <Select value={formTenure} onChange={(e) => { setValue('eventTenureId', e.target.value); setValue('eventDivId', ''); clearErrors('eventDivId'); }}>
                {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
              </Select>
            </Field>
            <Field label="Divisi penyelenggara" required error={errors.eventDivId?.message || (divsForTenure.length === 0 ? 'Belum ada divisi di periode ini. Buat dulu di menu Divisi.' : undefined)}>
              <Select value={ev.eventDivId} disabled={divsForTenure.length === 0} onChange={(e) => { setValue('eventDivId', e.target.value); clearErrors('eventDivId'); }}>
                <option value="">Pilih divisi</option>
                {divsForTenure.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Kategori" required error={errors.eventCategory?.message}>
              <Select {...field('eventCategory')}>
                <option value="">Pilih kategori</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Mulai (WIB)" required error={errors.eventStartDate?.message}>
              <Input type="datetime-local" value={toDatetimeLocalValue(ev.eventStartDate)} max={ev.eventEndDate ? toDatetimeLocalValue(ev.eventEndDate) : undefined} onChange={(e) => onStart(e.target.value)} />
            </Field>
            <Field label="Selesai (WIB)" required error={errors.eventEndDate?.message}>
              <Input type="datetime-local" value={toDatetimeLocalValue(ev.eventEndDate)} min={ev.eventStartDate ? toDatetimeLocalValue(ev.eventStartDate) : undefined} onChange={(e) => onEnd(e.target.value)} />
            </Field>
            <Field label="Lokasi"><Input placeholder="Contoh: Plaza Mandiri Lt. 3 / Zoom" {...field('eventLocation')} /></Field>
            <Field label="Peserta"><Input placeholder="Contoh: 150+ jemaat" {...field('eventKpi')} /></Field>
            <Field label="Estimasi RAB (Rp)" required error={errors.eventRab?.message} hint="Angka tanpa titik.">
              <Input type="number" min={0} inputMode="numeric" placeholder="15000000" {...field('eventRab')} />
            </Field>
            <Field label="Status">
              <Select {...field('eventStatus')}>
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <div className="flex flex-col gap-3">
              <CheckField checked={ev.eventIsLimited} onChange={(on) => setValue('eventIsLimited', on)} label="Batasi kuota RSVP" description="RSVP otomatis tertutup saat kuota terpenuhi." />
              {ev.eventIsLimited && (
                <Field label="Kuota maksimal" required error={errors.eventMaxQuota?.message}>
                  <Input type="number" min={1} placeholder="100" {...field('eventMaxQuota')} />
                </Field>
              )}
            </div>
            <div className="flex items-start justify-between gap-4 rounded-md border border-line bg-surface p-3">
              <span className="text-[0.88rem] leading-snug text-ink"><strong className="font-semibold">Publikasikan di situs</strong><span className="mt-0.5 block text-[0.82rem] text-muted">{ev.eventIsPublic ? 'Langsung tampil untuk publik.' : 'Draf, hanya terlihat oleh pengurus.'}</span></span>
              <Switch checked={Boolean(ev.eventIsPublic)} onChange={(on) => setValue('eventIsPublic', on)} label="Publikasikan acara di situs" />
            </div>
            <div className="md:col-span-2">
              <Field label="Deskripsi" required error={errors.eventDesc?.message}>
                <Textarea rows={3} {...field('eventDesc')} />
              </Field>
            </div>
            <div className="flex justify-end md:col-span-2"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Simpan acara</Button></div>
          </form>
        </AdminSubsection>

        <div className="flex flex-col gap-3">
          <ListToolbar title={
            <span className="flex flex-wrap items-center gap-3">
              <span>Daftar acara <span className="font-normal text-muted">({filtered.length} dari {events.length})</span></span>
              <span role="tablist" aria-label="Tampilan" className="inline-flex gap-1 rounded-full border border-line bg-surface p-0.5">
                {([['list', 'Daftar', List], ['calendar', 'Kalender', CalendarDays]] as const).map(([id, label, Icon]) => (
                  <button key={id} type="button" role="tab" aria-selected={adminEventViewMode === id} onClick={() => setAdminEventViewMode(id)}
                    className={cn('inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border-0 px-3 text-[0.8rem] font-semibold font-sans', adminEventViewMode === id ? 'bg-action text-on-action' : 'bg-transparent text-muted hover:text-ink')}>
                    <Icon size={13} aria-hidden="true" />{label}
                  </button>
                ))}
              </span>
            </span>
          }>
            <SearchBox label="Cari acara" placeholder="Cari nama atau lokasi" value={eventSearchQuery} onChange={(v) => { setEventSearchQuery(v); setAdminEventPage(1); }} />
          </ListToolbar>
          <div className="flex flex-wrap gap-2">
            <FilterSelect label="Saring publikasi" value={eventPublicFilter} onChange={(v) => { setEventPublicFilter(v); setAdminEventPage(1); }}>
              <option value="all">Semua publikasi</option>
              <option value="public">Publik ({events.filter((e: any) => e.isPublic === true).length})</option>
              <option value="draft">Draf ({events.filter((e: any) => !e.isPublic).length})</option>
            </FilterSelect>
            <FilterSelect label="Saring periode" value={eventTenureFilter} onChange={(v) => { setEventTenureFilter(v); setEventDivFilter('all'); setAdminEventPage(1); setAdminRsvpPage(1); }}>
              <option value="all">Semua periode</option>
              {tenures.map((t: any) => <option key={t.id} value={t.id}>Periode {t.code || t.title}</option>)}
            </FilterSelect>
            <FilterSelect label="Saring kategori" value={eventCatFilter} onChange={(v) => { setEventCatFilter(v); setAdminEventPage(1); }}>
              <option value="all">Semua kategori</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </FilterSelect>
            <FilterSelect label="Saring divisi" value={eventDivFilter} onChange={(v) => { setEventDivFilter(v); setAdminEventPage(1); }}>
              <option value="all">Semua divisi</option>
              {(eventTenureFilter === 'all' ? divisions : divisions.filter((d: any) => d.tenureId === eventTenureFilter)).map((d: any) => {
                const t = tenures.find((x: any) => x.id === d.tenureId);
                return <option key={d.id} value={d.id}>{d.name}{t ? ` (${t.code || t.title})` : ''}</option>;
              })}
            </FilterSelect>
            <FilterSelect label="Saring status" value={eventStatusFilter} onChange={(v) => { setEventStatusFilter(v); setAdminEventPage(1); }}>
              <option value="all">Semua status</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </FilterSelect>
          </div>

          {adminEventViewMode === 'calendar' ? (
            <EventCalendarView events={filtered} divisions={divisions} forms={forms} registrationCounts={registrationCounts}
              activeTenure={eventTenureFilter !== 'all' ? tenures.find((t: any) => t.id === eventTenureFilter) : activeTenure}
              onSelectEvent={(evt: any) => setEditingItem({ type: 'event', item: { ...evt } })} onEditEvent={(evt: any) => setEditingItem({ type: 'event', item: { ...evt } })} isAdmin />
          ) : filtered.length === 0 ? <AdminEmpty>{events.length === 0 ? 'Belum ada acara.' : 'Tidak ada acara yang cocok. Coba ubah pencarian atau filter.'}</AdminEmpty> : (
            <ul className="grid list-none gap-3 lg:grid-cols-2">
              {visible.map((evt: any) => {
                const div = divisions.find((d: any) => d.id === evt.divisionId);
                const att = getUnifiedEventAttendees(evt, forms, registrationCounts);
                const draft = evt.isPublic !== true;
                const limited = evt.isLimited && Number(evt.maxQuota) > 0;
                return (
                  <li key={evt.id} className={cn('flex flex-col gap-3 rounded-md border p-4', draft ? 'border-dashed border-line-strong bg-subtle' : 'border-line bg-surface')}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[0.76rem] font-semibold uppercase tracking-wide text-gold-ink">{evt.divisionName || div?.name || 'Divisi'}</p>
                        <p className="font-semibold leading-snug text-ink">{evt.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge tone={draft ? 'neutral' : 'success'}>{draft ? 'Draf' : 'Publik'}</Badge>
                        <Badge tone="gold">{STATUS_LABEL[evt.status] || evt.status}</Badge>
                      </div>
                    </div>
                    <ul className="flex list-none flex-col gap-1 text-[0.84rem] text-muted">
                      <li className="flex items-center gap-2"><CalendarDays size={14} aria-hidden="true" className="shrink-0 text-dim" />{formatWibEventRange(evt.startDate, evt.endDate, evt.date)}</li>
                      {evt.location && <li className="flex items-center gap-2"><MapPin size={14} aria-hidden="true" className="shrink-0 text-dim" />{evt.location}</li>}
                      <li className="flex items-center gap-2"><Wallet size={14} aria-hidden="true" className="shrink-0 text-dim" />Rp {Number(evt.totalRab || 0).toLocaleString('id-ID')}</li>
                      <li className="flex flex-wrap items-center gap-2">
                        <Users size={14} aria-hidden="true" className="shrink-0 text-dim" />
                        <span className={att.isFull ? 'font-semibold text-danger' : ''}>{att.isConnected ? 'Pendaftar' : 'RSVP'}: {att.count}{limited ? ` / ${evt.maxQuota}${att.isFull ? ' (penuh)' : ''}` : ' (tanpa batas)'}</span>
                        <button type="button" onClick={() => { setRsvpEventFilter(evt.id); setAdminRsvpPage(1); showToast(`Filter RSVP disetel ke "${evt.title}"`); document.getElementById('rsvp-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                          className="cursor-pointer border-0 bg-transparent p-0 text-[0.82rem] font-semibold text-navy-ink hover:underline">Lihat RSVP</button>
                      </li>
                    </ul>
                    {evt.category || evt.badge ? <div><Badge tone="info">{evt.category || evt.badge}</Badge></div> : null}
                    <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
                      <span className="flex items-center gap-2 text-[0.84rem] text-ink">
                        <Switch checked={!draft} label={`Publikasikan ${evt.title}`} onChange={() => { onUpdateEvent?.({ ...evt, isPublic: !evt.isPublic }); showToast(`Status "${evt.title}" diubah menjadi ${!evt.isPublic ? 'Publik' : 'Draft / Privat'}`); }} />
                        Publik
                      </span>
                      <span className="flex items-center gap-1">
                        {evt.updatedAt && <span className="hidden text-[0.74rem] text-dim sm:inline">{formatLastUpdatedWib(evt.updatedAt)}</span>}
                        <IconButton label={`Edit ${evt.title}`} onClick={() => setEditingItem({ type: 'event', item: { ...evt } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                        {onDeleteEvent && <IconButton label={`Hapus ${evt.title}`} tone="danger" onClick={() => handleDeleteEventClick(evt)}><Trash2 size={15} aria-hidden="true" /></IconButton>}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {adminEventViewMode !== 'calendar' && <Pagination page={page} pageCount={pageCount} onChange={setAdminEventPage} itemLabel="acara" total={filtered.length} pageSize={EVENTS_PER_PAGE} />}
        </div>
      </AdminPanel>

      <div id="rsvp-panel" className="scroll-mt-24">
        <AdminPanel title={<span className="flex flex-wrap items-center gap-2">Daftar hadir RSVP ({rsvps.length}{eventTenureFilter !== 'all' || rsvpFiltered ? ` dari ${eventRsvps.length}` : ''}){tenureObj && <Badge tone="info">Periode {tenureObj.code || tenureObj.title}</Badge>}</span>}
          description="Konfirmasi kehadiran dari tombol RSVP cepat di kartu acara."
          actions={rsvps.length > 0 && <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={exportRsvp}>Ekspor CSV ({rsvps.length})</Button>}>
          <div className="flex flex-wrap items-center gap-2">
            <SearchBox className="sm:w-72" label="Cari RSVP" placeholder="Cari nama, catatan, acara" value={rsvpSearchQuery} onChange={(v) => { setRsvpSearchQuery(v); setAdminRsvpPage(1); }} />
            <FilterSelect label="Saring acara" value={rsvpEventFilter} onChange={(v) => { setRsvpEventFilter(v); setAdminRsvpPage(1); }} className="max-w-[260px]">
              <option value="all">Semua acara ({rsvpEvents.length})</option>
              {rsvpEvents.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </FilterSelect>
            <FilterSelect label="Saring mode kehadiran" value={rsvpModeFilter} onChange={(v) => { setRsvpModeFilter(v); setAdminRsvpPage(1); }}>
              <option value="all">Semua mode</option>
              <option value="onsite">Hadir di lokasi</option>
              <option value="online">Hadir online</option>
            </FilterSelect>
            {rsvpFiltered && <Button size="sm" variant="ghost" onClick={() => { setRsvpSearchQuery(''); setRsvpEventFilter('all'); setRsvpModeFilter('all'); setAdminRsvpPage(1); }}>Reset filter</Button>}
          </div>
          {rsvps.length === 0 ? (
            <AdminEmpty>{eventTenureFilter !== 'all' ? `Belum ada RSVP pada acara periode ${tenureObj?.code || tenureObj?.title || 'terpilih'}.` : 'Belum ada RSVP.'}</AdminEmpty>
          ) : (
            <ul className="grid list-none gap-2 lg:grid-cols-2">
              {rVisible.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.78rem] font-semibold text-navy-ink">{titleOf(r)}</p>
                    <p className="font-semibold text-ink">{r.attendeeName}</p>
                    <p className="text-[0.8rem] text-muted">{r.attendanceMode}{r.notes ? ` · “${r.notes}”` : ''} · {formatWibTimestamp(r.submittedAt || r.createdAt).exact || r.submittedAt}</p>
                  </div>
                  {onDeleteEventRsvp && <IconButton label={`Hapus RSVP ${r.attendeeName}`} tone="danger" onClick={() => setDeleteConfirm({ type: 'event_rsvp', id: r.id, name: `Data RSVP "${r.attendeeName}"` })}><Trash2 size={15} aria-hidden="true" /></IconButton>}
                </li>
              ))}
            </ul>
          )}
          <Pagination page={rPage} pageCount={rPageCount} onChange={setAdminRsvpPage} itemLabel="RSVP" total={rsvps.length} pageSize={RSVPS_PER_PAGE} />
        </AdminPanel>
      </div>
    </>
  );
}
