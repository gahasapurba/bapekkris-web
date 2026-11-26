import { useMemo, useState, type FormEvent } from 'react';
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Download, RotateCcw, ScanLine, Search, XCircle } from 'lucide-react';
import { checkInRegistration, undoCheckIn, type CheckInResult } from '../../../lib/supabase';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { Badge, Button, Card, Field, Input, useFeedback, cn } from '../../../ui';
import { downloadCsv } from '../../../utils/csv';
import { useRegistrationStats } from '../RegistrationStatsContext';
import QrScanner from './QrScanner';

const REJECTED = ['Rejected', 'Ditolak'];

interface Attendee {
  id: string;
  name: string;
  checkedInAt: string | null;
}

interface LastResult extends CheckInResult {
  code: string;
  name: string | null;
}

/**
 * Venue check-in: scan a participant's QR (registration ID) or type the ID / search-index value
 * (e.g. NIP). Marks attendance through the check_in_registration RPC and shows live progress.
 */
export default function CheckInView() {
  const { event, connectedForm, formSubmissions, initialRsvps, extractParticipantName } = useRegistrationStats();
  const { toast } = useFeedback();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [search, setSearch] = useState('');
  // Check-ins done in this session, applied on top of the data until realtime refreshes it
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});

  // Form registrations when the event has a connected form, otherwise direct RSVPs
  const attendees: Attendee[] = useMemo(() => {
    const source = connectedForm
      ? (formSubmissions || []).filter((s) => !REJECTED.includes(s.status)).map((s) => ({ id: s.id, name: extractParticipantName(s), checkedInAt: s.checkedInAt || null }))
      : (initialRsvps || []).map((r) => ({ id: r.id, name: r.attendeeName || 'Peserta', checkedInAt: r.checkedInAt || null }));
    return source.map((a: Attendee) => (a.id in overrides ? { ...a, checkedInAt: overrides[a.id] } : a));
  }, [connectedForm, formSubmissions, initialRsvps, extractParticipantName, overrides]);

  const presentCount = attendees.filter((a) => a.checkedInAt).length;
  const percent = attendees.length > 0 ? Math.round((presentCount / attendees.length) * 100) : 0;
  const nameOf = (id: string | null) => (id ? attendees.find((a) => a.id === id)?.name ?? null : null);

  const runCheckIn = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code || isBusy) return;
    setIsBusy(true);
    try {
      const result = await checkInRegistration(event.id, code);
      setLastResult({ ...result, code, name: nameOf(result.registrationId) });
      if (result.registrationId && result.checkedInAt) {
        setOverrides((prev) => ({ ...prev, [result.registrationId as string]: result.checkedInAt }));
      }
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(result.status === 'checked_in' ? 80 : [60, 60, 60]);
    } catch (err) {
      toast((err as Error)?.message || 'Check-in gagal diproses', 'error');
    } finally {
      setIsBusy(false);
    }
  };

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    runCheckIn(manualCode);
    setManualCode('');
  };

  const undo = async (id: string) => {
    try {
      await undoCheckIn(event.id, id);
      setOverrides((prev) => ({ ...prev, [id]: null }));
      if (lastResult?.registrationId === id) setLastResult(null);
      toast('Check-in dibatalkan');
    } catch (err) {
      toast((err as Error)?.message || 'Gagal membatalkan check-in', 'error');
    }
  };

  const exportAttendance = () => {
    downloadCsv(
      `Kehadiran_${String(event.title || 'acara').replace(/[^\w-]+/g, '_')}.csv`,
      ['ID Pendaftaran', 'Nama', 'Status', 'Waktu Check-in (WIB)'],
      attendees.map((a) => [a.id, a.name, a.checkedInAt ? 'Hadir' : 'Belum hadir', a.checkedInAt ? formatWibTimestamp(a.checkedInAt).exact : ''])
    );
  };

  const q = search.trim().toLowerCase();
  const visible = (q ? attendees.filter((a) => a.name.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)) : attendees)
    .slice()
    .sort((a, b) => (b.checkedInAt || '').localeCompare(a.checkedInAt || '') || a.name.localeCompare(b.name));

  const resultCard = lastResult && (() => {
    const tone = lastResult.status === 'checked_in' ? 'success' : lastResult.status === 'already' ? 'gold' : 'danger';
    const Icon = lastResult.status === 'checked_in' ? CheckCircle2 : lastResult.status === 'already' ? AlertTriangle : XCircle;
    const title = lastResult.status === 'checked_in' ? 'Check-in berhasil'
      : lastResult.status === 'already' ? 'Sudah check-in sebelumnya'
      : 'Pendaftaran tidak ditemukan';
    const detail = lastResult.status === 'not_found'
      ? `Kode “${lastResult.code}” tidak cocok dengan pendaftar acara ini. Periksa kembali ID atau NIP.`
      : `${lastResult.name || lastResult.registrationId}${lastResult.checkedInAt ? ` · ${formatWibTimestamp(lastResult.checkedInAt).exact}` : ''}`;
    return (
      <div role="status" aria-live="assertive" className={cn('flex items-start gap-3 rounded-lg border px-5 py-4',
        tone === 'success' && 'border-success-line bg-success-tint', tone === 'gold' && 'border-gold-line bg-gold-tint', tone === 'danger' && 'border-danger-line bg-danger-tint')}>
        <Icon size={26} aria-hidden="true" className={cn('mt-0.5 shrink-0', tone === 'success' && 'text-success', tone === 'gold' && 'text-gold-ink', tone === 'danger' && 'text-danger')} />
        <div className="min-w-0">
          <p className="font-display text-[1.2rem] font-semibold text-ink">{title}</p>
          <p className="mt-0.5 break-words text-[0.92rem] text-muted">{detail}</p>
        </div>
      </div>
    );
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <Card padding="none" className="flex flex-col gap-5 p-5 md:p-6">
        <div>
          <h2 className="font-display text-[1.35rem] font-semibold text-ink">Check-in peserta</h2>
          <p className="mt-1 text-[0.9rem] text-muted">Pindai QR dari halaman pendaftaran peserta, atau ketik ID pendaftaran / NIP.</p>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[0.78rem] font-semibold uppercase tracking-wide text-dim">Sudah hadir</p>
            <p className="font-display text-[1.6rem] font-semibold leading-none text-ink">{presentCount}<span className="text-[1rem] text-muted"> / {attendees.length}</span></p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-label="Persentase kehadiran" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>

        {isCameraOpen && <QrScanner onDetected={runCheckIn} paused={isBusy} />}
        <Button variant={isCameraOpen ? 'secondary' : 'primary'} icon={isCameraOpen ? <CameraOff size={16} aria-hidden="true" /> : <Camera size={16} aria-hidden="true" />}
          onClick={() => setIsCameraOpen((v) => !v)}>
          {isCameraOpen ? 'Tutup kamera' : 'Buka kamera pemindai'}
        </Button>

        <form onSubmit={submitManual} className="flex items-end gap-2">
          <Field label="ID pendaftaran atau NIP" className="flex-1">
            <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} placeholder="sub-… / rsvp-… / NIP" autoComplete="off" maxLength={120} />
          </Field>
          <Button type="submit" loading={isBusy} disabled={!manualCode.trim()} icon={<ScanLine size={16} aria-hidden="true" />}>Check-in</Button>
        </form>

        {resultCard}
      </Card>

      <Card padding="none" className="flex min-w-0 flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[1.2rem] font-semibold text-ink">Daftar kehadiran</h2>
          <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={exportAttendance} disabled={attendees.length === 0}>Ekspor CSV</Button>
        </div>
        <div className="relative">
          <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <Input type="search" aria-label="Cari peserta" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau ID" className="pl-10" />
        </div>
        {attendees.length === 0 ? (
          <p className="rounded-md border border-dashed border-line px-4 py-8 text-center text-[0.92rem] text-muted">Belum ada pendaftar untuk acara ini.</p>
        ) : (
          <ul className="m-0 flex max-h-[520px] list-none flex-col divide-y divide-line overflow-y-auto p-0">
            {visible.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{a.name}</p>
                  <p className="truncate font-mono text-[0.76rem] text-dim">{a.id}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {a.checkedInAt ? (
                    <>
                      <Badge tone="success" title={formatWibTimestamp(a.checkedInAt).exact}>Hadir · {formatWibTimestamp(a.checkedInAt).exact.split(' - ')[1] || ''}</Badge>
                      <Button size="sm" variant="ghost" icon={<RotateCcw size={14} aria-hidden="true" />} onClick={() => undo(a.id)} aria-label={`Batalkan check-in ${a.name}`}>Batal</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => runCheckIn(a.id)} disabled={isBusy}>Tandai hadir</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
