import type { ReactNode } from 'react';
import { BarChart3, CalendarPlus, CalendarX, Camera, Check, CheckCircle2, ExternalLink, Link2, Lock, MapPin, Send, Share2, Tag, Users, Building2 } from 'lucide-react';
import type { AppItem } from '../../../lib/supabase';
import { formatDeadlineWib, formatWibEventRange, getDeadlineStatus, isEventPassed } from '../../../utils/dateUtils';
import { getUnifiedEventAttendees, isFormConnectedToEvent } from '../../../utils/quotaUtils';
import { Badge, Button, ButtonLink, Dialog, Field, Input, Select } from '../../../ui';
import { downloadIcs, googleCalendarUrl } from '../calendarExport';
import { useProgramSectionContext } from '../ProgramSectionContext';
import RegistrationQr from '../../shared/RegistrationQr';

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-dim" aria-hidden="true">{icon}</span>
      <div><dt className="text-[0.76rem] font-semibold uppercase tracking-[0.1em] text-dim">{label}</dt><dd className="text-[0.95rem] text-ink">{children}</dd></div>
    </div>
  );
}

function Notice({ tone, icon, title, children }: { tone: 'danger' | 'gold'; icon: ReactNode; title: string; children?: ReactNode }) {
  const cls = tone === 'danger' ? 'border-danger-line bg-danger-tint text-danger' : 'border-gold-line bg-gold-tint text-gold-ink';
  return (
    <div role="status" className={`rounded-md border px-4 py-3 ${cls}`}>
      <p className="flex items-center gap-2 font-semibold">{icon}{title}</p>
      {children && <p className="mt-1 text-[0.88rem] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export default function EventDetailModal() {
  const {
    copiedEventId, forms, galleries, handleCloseEventModal, handleCopyEventLink, handleOpenConfirmRsvp, handleShareEventWa,
    isSubmittingRsvp, modalAttendees, navigateTo, onNavigateEventStats, onNavigateForm, onNavigateGallery, onNavigateOprec,
    registrationCounts, rsvpErrors, rsvpModalEvent: evt, rsvpMode, rsvpName, rsvpNotes, rsvpSuccess, lastRsvpCode,
    setRsvpErrors, setRsvpMode, setRsvpName, setRsvpNotes
  } = useProgramSectionContext();
  if (!evt) return null;

  const when = formatWibEventRange(evt.startDate, evt.endDate, evt.date);
  const attendance = getUnifiedEventAttendees(evt, forms, registrationCounts);
  const rsvpCount = Number(registrationCounts?.events?.[evt.id] || 0);
  const connectedForm: AppItem | undefined = forms.find((f) => isFormConnectedToEvent(f, evt.id));
  const gallery: AppItem | undefined = galleries.find((g) => String(g.eventId) === String(evt.id));
  const category = evt.kategori || evt.category || evt.badge;

  const leaveTo = (action: () => void) => { handleCloseEventModal(); action(); };

  let registration: ReactNode;
  if (connectedForm) {
    const formClosed = connectedForm.isOpen === false || Boolean(connectedForm.isClosed) || (connectedForm.deadline ? getDeadlineStatus(connectedForm.deadline).isExpired : false);
    registration = (
      <section aria-label="Pendaftaran" className="flex flex-col gap-4 rounded-lg border border-gold-line bg-gold-tint p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-ink">Pendaftaran melalui formulir resmi</p>
          <Badge tone="gold">Formulir terhubung</Badge>
        </div>
        <div>
          <p className="font-display text-[1.15rem] font-semibold text-ink">{connectedForm.title}</p>
          {connectedForm.subtitle && <p className="mt-1 text-[0.9rem] text-muted">{connectedForm.subtitle}</p>}
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.84rem] text-muted">
            {connectedForm.deadline && <span>Batas: {formatDeadlineWib(connectedForm.deadline)}</span>}
            {attendance.isLimited && attendance.maxQuota > 0 && <span className={attendance.isFull ? 'font-semibold text-danger' : ''}>Kuota {attendance.count}/{attendance.maxQuota} · {attendance.isFull ? 'penuh' : `sisa ${attendance.remaining}`}</span>}
          </p>
        </div>
        {formClosed
          ? <Notice tone="danger" icon={<Lock size={16} aria-hidden="true" />} title="Formulir sudah ditutup oleh pengelola acara." />
          : attendance.isFull && <Notice tone="danger" icon={<Lock size={16} aria-hidden="true" />} title={`Kuota penuh (${attendance.count}/${attendance.maxQuota} peserta).`} />}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="gold" disabled={formClosed} icon={formClosed || attendance.isFull ? <Lock size={16} aria-hidden="true" /> : <ExternalLink size={16} aria-hidden="true" />}
            onClick={() => !formClosed && leaveTo(() => (onNavigateForm ? onNavigateForm(connectedForm.id) : navigateTo(`/?form=${encodeURIComponent(connectedForm.id)}#form`)))}>
            {formClosed ? 'Formulir ditutup' : attendance.isFull ? 'Buka formulir (kuota penuh)' : 'Buka formulir pendaftaran'}
          </Button>
          <Button variant="secondary" icon={<BarChart3 size={16} aria-hidden="true" />}
            onClick={() => leaveTo(() => (onNavigateEventStats ? onNavigateEventStats(evt.id) : navigateTo(`/?stats=${encodeURIComponent(evt.id)}#event-stats`)))}>
            {connectedForm.isLuckyDraw === true ? 'Statistik & undian doorprize' : 'Statistik pendaftaran'}
          </Button>
        </div>
        <p className="text-[0.82rem] text-muted">Total terdaftar saat ini: <strong className="text-ink">{attendance.count} peserta</strong> melalui formulir.</p>
      </section>
    );
  } else {
    const passed = isEventPassed(evt.startDate, evt.endDate) || evt.status === 'Completed';
    const limited = Boolean(evt.isLimited);
    const maxQuota = Number(evt.maxQuota || 0);
    const full = limited && maxQuota > 0 && rsvpCount >= maxQuota;
    registration = (
      <section aria-label="Konfirmasi kehadiran" className="flex flex-col gap-4 rounded-lg border border-line bg-page p-5">
        {passed ? (
          <Notice tone="danger" icon={<CalendarX size={17} aria-hidden="true" />} title="RSVP ditutup — acara sudah selesai">
            Acara ini telah berlangsung pada {when}.
          </Notice>
        ) : full ? (
          <Notice tone="gold" icon={<Lock size={17} aria-hidden="true" />} title="RSVP ditutup — kuota penuh">
            Kuota kehadiran sudah mencapai batas ({rsvpCount}/{maxQuota} peserta).
          </Notice>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-display text-[1.15rem] font-semibold text-ink">Konfirmasi kehadiran</p>
              <Badge tone="info">{rsvpCount}{limited && maxQuota > 0 ? ` / ${maxQuota}` : ''} akan hadir</Badge>
            </div>
            {rsvpSuccess && (
              <p role="status" className="flex items-center gap-2 rounded-md border border-success-line bg-success-tint px-4 py-3 text-[0.9rem] font-semibold text-success">
                <CheckCircle2 size={17} aria-hidden="true" />Kehadiran Anda sudah tercatat.
              </p>
            )}
            {lastRsvpCode && <RegistrationQr code={lastRsvpCode} />}
            <form onSubmit={handleOpenConfirmRsvp} noValidate className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama lengkap" required error={rsvpErrors.rsvpName} className="sm:col-span-2">
                <Input maxLength={120} value={rsvpName} onChange={(e) => { setRsvpName(e.target.value); if (rsvpErrors.rsvpName) setRsvpErrors((prev) => ({ ...prev, rsvpName: undefined })); }} />
              </Field>
              <Field label="Kehadiran">
                <Select value={rsvpMode} onChange={(e) => setRsvpMode(e.target.value)}>
                  <option value="Hadir Onsite">Hadir di lokasi</option>
                  <option value="Hadir Online">Hadir online / Teams</option>
                </Select>
              </Field>
              <Field label="Catatan" hint="Opsional"><Input maxLength={500} value={rsvpNotes} onChange={(e) => setRsvpNotes(e.target.value)} /></Field>
              <div className="sm:col-span-2"><Button type="submit" loading={isSubmittingRsvp} icon={<Send size={16} aria-hidden="true" />}>{isSubmittingRsvp ? 'Menyimpan…' : 'Konfirmasi kehadiran saya'}</Button></div>
            </form>
          </>
        )}
        {modalAttendees.length > 0 && (
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-[0.8rem] font-semibold text-dim">Sudah konfirmasi hadir</p>
            <ul className="flex max-h-24 list-none flex-wrap gap-2 overflow-y-auto">
              {modalAttendees.slice(0, 12).map((r) => (
                <li key={r.id}><Badge tone="success"><Check size={12} aria-hidden="true" />{r.attendeeName}<span className="font-normal opacity-80">· {r.attendanceMode === 'Hadir Online' ? 'online' : 'di lokasi'}</span></Badge></li>
              ))}
            </ul>
          </div>
        )}
      </section>
    );
  }

  return (
    <Dialog
      open
      onClose={handleCloseEventModal}
      size="lg"
      title={evt.title}
      description={when}
      footer={
        <>
          {onNavigateOprec && <Button variant="ghost" onClick={() => leaveTo(onNavigateOprec)}>Ke Hub Formulir</Button>}
          <Button variant="secondary" onClick={handleCloseEventModal}>Selesai & Tutup</Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={<Share2 size={15} aria-hidden="true" />} onClick={() => handleShareEventWa(evt)}>Bagikan ke WhatsApp</Button>
          <Button size="sm" variant="secondary" icon={copiedEventId === evt.id ? <Check size={15} aria-hidden="true" /> : <Link2 size={15} aria-hidden="true" />} onClick={() => handleCopyEventLink(evt)}>
            {copiedEventId === evt.id ? 'Tautan tersalin' : 'Salin tautan'}
          </Button>
          <Button size="sm" variant="secondary" icon={<CalendarPlus size={15} aria-hidden="true" />} onClick={() => downloadIcs(evt)} title="File kalender (.ics) dengan pengingat H-1 dan 1 jam sebelum acara">Ingatkan saya (.ics)</Button>
          <ButtonLink size="sm" variant="secondary" icon={<ExternalLink size={15} aria-hidden="true" />} href={googleCalendarUrl(evt)} target="_blank" rel="noopener noreferrer">Google Calendar</ButtonLink>
        </div>

        {evt.description && <p className="whitespace-pre-line text-[1rem] leading-relaxed text-muted">{evt.description}</p>}

        <dl className="grid gap-4 sm:grid-cols-2">
          {evt.location && <Fact icon={<MapPin size={17} />} label="Lokasi">{evt.location}</Fact>}
          {(evt.peserta || evt.kpi) && <Fact icon={<Users size={17} />} label="Peserta">{evt.peserta || evt.kpi}</Fact>}
          {attendance.isLimited && attendance.maxQuota > 0 && (
            <Fact icon={<Lock size={17} />} label="Kuota">
              <span className={attendance.isFull ? 'font-semibold text-danger' : ''}>{attendance.count} / {attendance.maxQuota} terisi · {attendance.isFull ? 'penuh' : `sisa ${attendance.remaining}`}</span>
            </Fact>
          )}
          {category && <Fact icon={<Tag size={17} />} label="Kategori">{category}</Fact>}
          <Fact icon={<Building2 size={17} />} label="Penyelenggara">{evt.divisionName || 'Bapekkris Bank Mandiri'}</Fact>
        </dl>

        {registration}

        {gallery && (
          <Button variant="secondary" icon={<Camera size={16} aria-hidden="true" />} className="self-start"
            onClick={() => leaveTo(() => (onNavigateGallery ? onNavigateGallery(gallery.id) : navigateTo(`/?gallery=${encodeURIComponent(gallery.id)}#galeri`)))}>
            Lihat galeri foto acara
          </Button>
        )}
      </div>
    </Dialog>
  );
}
