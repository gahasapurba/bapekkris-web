import { useState, type FormEvent } from 'react';
import { CheckCircle2, HandHeart, Lock, Send, Sparkles } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Skeleton, Textarea, useFeedback } from '../../ui';
import { formatWibTimestamp } from '../../utils/dateUtils';
import {
  PRAYER_NAME_MAX, PRAYER_REQUEST_MAX, PRAYER_REQUEST_MIN,
  loadPrayedIds, prayForRequest, rememberPrayed, submitPrayerRequest, useInvalidatePrayers, usePrayerWall
} from '../../lib/prayers';

/** Pokok Doa: submit a prayer request and pray along with the community's approved requests. */
export default function PrayerWallSection() {
  const { data: wall = [], isLoading, isError } = usePrayerWall();
  const invalidate = useInvalidatePrayers();
  const { toast } = useFeedback();
  const [name, setName] = useState('');
  const [request, setRequest] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedPrivate, setSubmittedPrivate] = useState<boolean | null>(null);
  const [prayedIds, setPrayedIds] = useState(loadPrayedIds);
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const text = request.trim();
    if (text.length < PRAYER_REQUEST_MIN) {
      setError(`Tuliskan permohonan doa minimal ${PRAYER_REQUEST_MIN} karakter.`);
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await submitPrayerRequest({ name, request: text, isAnonymous, isPrivate });
      setSubmittedPrivate(isPrivate);
      setName('');
      setRequest('');
      setIsAnonymous(false);
      setIsPrivate(false);
    } catch (err) {
      setError((err as Error)?.message || 'Permohonan doa gagal dikirim. Periksa koneksi lalu coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const prayFor = async (id: string) => {
    if (prayedIds.has(id)) return;
    try {
      const count = await prayForRequest(id);
      rememberPrayed(id);
      setPrayedIds(loadPrayedIds());
      setLocalCounts((prev) => ({ ...prev, [id]: count }));
      toast('Terima kasih telah turut mendoakan.');
    } catch (err) {
      toast((err as Error)?.message || 'Gagal mencatat doa', 'error');
      invalidate();
    }
  };

  const active = wall.filter((p) => p.status === 'approved');
  const answered = wall.filter((p) => p.status === 'answered');

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 pb-24 md:px-6">
      <PageHeader eyebrow="Saling mendoakan" title="Pokok Doa"
        description="Sampaikan permohonan doa Anda. Pengurus akan meninjau setiap permohonan, dan jemaat dapat turut mendoakan yang ditampilkan di dinding doa." />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <Card padding="none" className="h-fit p-5 md:p-6">
          <h2 className="font-display text-[1.3rem] font-semibold text-ink">Kirim permohonan doa</h2>
          {submittedPrivate !== null ? (
            <div role="status" className="mt-4 flex flex-col items-start gap-3">
              <p className="flex items-start gap-2 rounded-md border border-success-line bg-success-tint px-4 py-3 text-[0.92rem] text-ink">
                <CheckCircle2 size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />
                {submittedPrivate
                  ? 'Permohonan Anda sudah diterima dan hanya dapat dibaca oleh pengurus. Kami akan mendoakannya.'
                  : 'Permohonan Anda sudah diterima. Setelah ditinjau pengurus, permohonan akan tampil di dinding doa.'}
              </p>
              <Button variant="secondary" onClick={() => setSubmittedPrivate(null)}>Kirim permohonan lain</Button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-4">
              <Field label="Nama" hint="Opsional">
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={PRAYER_NAME_MAX} autoComplete="name" />
              </Field>
              <Field label="Permohonan doa" required error={error || undefined} hint={`${request.trim().length}/${PRAYER_REQUEST_MAX} karakter`}>
                <Textarea rows={5} value={request} onChange={(e) => { setRequest(e.target.value); if (error) setError(''); }} maxLength={PRAYER_REQUEST_MAX} />
              </Field>
              <label className="flex cursor-pointer items-start gap-2.5 text-[0.9rem] text-ink">
                <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="mt-1 size-4 accent-[var(--navy-ink)]" />
                <span>Sembunyikan nama saya di dinding doa</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2.5 text-[0.9rem] text-ink">
                <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="mt-1 size-4 accent-[var(--navy-ink)]" />
                <span>Hanya untuk pengurus <span className="text-muted">(tidak ditampilkan di dinding doa)</span></span>
              </label>
              <Button type="submit" loading={isSubmitting} icon={<Send size={16} aria-hidden="true" />}>Kirim permohonan</Button>
              <p className="flex items-start gap-2 text-[0.8rem] text-dim"><Lock size={13} aria-hidden="true" className="mt-0.5 shrink-0" />Permohonan ditinjau pengurus sebelum ditampilkan. Jangan menuliskan data pribadi orang lain.</p>
            </form>
          )}
        </Card>

        <section aria-labelledby="prayer-wall-title" className="min-w-0">
          <h2 id="prayer-wall-title" className="font-display text-[1.5rem] font-semibold text-ink">Dinding doa</h2>
          {isLoading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}</div>
          ) : isError ? (
            <p className="mt-4 text-muted">Dinding doa belum dapat dimuat. Coba lagi beberapa saat lagi.</p>
          ) : wall.length === 0 ? (
            <EmptyState className="mt-4" icon={<HandHeart size={22} />} title="Belum ada pokok doa" description="Pokok doa yang telah ditinjau pengurus akan tampil di sini." />
          ) : (
            <>
              <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2">
                {active.map((p) => {
                  const prayed = prayedIds.has(p.id);
                  const count = localCounts[p.id] ?? p.prayedCount;
                  return (
                    <li key={p.id}>
                      <Card padding="none" className="flex h-full flex-col gap-3 p-5">
                        <p className="whitespace-pre-line text-[0.98rem] leading-relaxed text-ink">{p.request}</p>
                        <p className="text-[0.82rem] text-dim">{p.displayName} · {formatWibTimestamp(p.createdAt).relative}</p>
                        <Button size="sm" variant={prayed ? 'secondary' : 'primary'} className="mt-auto self-start" disabled={prayed}
                          icon={<HandHeart size={15} aria-hidden="true" />} onClick={() => prayFor(p.id)} aria-pressed={prayed}>
                          {prayed ? `Anda turut mendoakan · ${count}` : `Saya turut mendoakan · ${count}`}
                        </Button>
                      </Card>
                    </li>
                  );
                })}
              </ul>
              {answered.length > 0 && (
                <>
                  <h3 className="mt-10 flex items-center gap-2 font-display text-[1.2rem] font-semibold text-ink"><Sparkles size={18} aria-hidden="true" className="text-gold-ink" />Doa yang terjawab</h3>
                  <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2">
                    {answered.map((p) => (
                      <li key={p.id}>
                        <Card padding="none" className="flex h-full flex-col gap-3 border-success-line p-5">
                          <Badge tone="success" className="self-start"><CheckCircle2 size={13} aria-hidden="true" />Terjawab</Badge>
                          <p className="whitespace-pre-line text-[0.98rem] leading-relaxed text-ink">{p.request}</p>
                          <p className="text-[0.82rem] text-dim">{p.displayName} · didoakan {p.prayedCount} kali</p>
                        </Card>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
