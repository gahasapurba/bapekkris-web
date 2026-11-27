import { Lock, Search, X } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { getFormFields } from '../../../utils/formMeta';
import { Badge, Card, Input } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';
import { submissionStatus } from '../submissionStatus';
import RegistrationQr from '../../shared/RegistrationQr';

export default function StatusTracker() {
  const { dynamicSearchKeysString, forms, hasConfiguredIndex, isTracking, matchedSubmissions, setStatusQuery, statusQuery, trackingActiveForms, trimmedStatusQuery } = useDynamicFormContext();
  const keyLabel = hasConfiguredIndex ? `${dynamicSearchKeysString} lengkap atau ID pendaftaran (sub-…)` : 'ID pendaftaran (sub-…)';
  return (
    <section id="status-tracker-section" aria-labelledby="tracker-title" className="mx-auto w-full max-w-[820px] scroll-mt-24">
      <Card padding="lg" className="flex flex-col gap-5">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-gold-ink">Transparansi seleksi</p>
          <h2 id="tracker-title" className="mt-2 font-display text-[1.6rem] font-semibold text-ink">Cek status pendaftaran</h2>
          <p className="mt-2 text-muted">Sudah mengisi formulir? Masukkan <strong className="text-ink">{keyLabel}</strong> untuk melihat progres seleksi dan catatan panitia.</p>
          <p className="mt-3 flex items-start gap-2 text-[0.86rem] text-muted"><Lock size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-dim" />Demi privasi, pencarian hanya mencocokkan nilai yang persis sama; pencarian sebagian atau nama umum tidak didukung.</p>
          {trackingActiveForms.length > 0 && (
            <ul className="mt-4 flex list-none flex-col gap-1.5 rounded-md border border-line bg-page px-4 py-3 text-[0.86rem]">
              {trackingActiveForms.map((f) => {
                const keys = getFormFields(f).filter((fld) => Boolean(fld.isSearchIndex)).map((fld) => fld.label || 'Indeks pencarian');
                return (
                  <li key={f.id} className="text-ink">
                    <strong>{f.title}</strong> <span className="text-muted">— cari dengan {keys.length > 0 ? `${keys.join(', ')} atau ID pendaftaran` : 'ID pendaftaran'}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="relative">
          <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
          <Input type="search" aria-label="Kunci pencarian status pendaftaran" value={statusQuery} onChange={(e) => setStatusQuery(e.target.value)}
            placeholder={hasConfiguredIndex ? `Ketik ${dynamicSearchKeysString} atau ID pendaftaran` : 'Ketik ID pendaftaran, mis. sub-1731…'} className="h-12 pl-11 pr-11" />
          {statusQuery && (
            <button type="button" onClick={() => setStatusQuery('')} aria-label="Hapus pencarian" className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full border-0 bg-transparent p-1.5 text-dim hover:bg-subtle hover:text-ink">
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </div>

        <div aria-live="polite" className="flex flex-col gap-3">
          {statusQuery.trim().length > 0 && statusQuery.trim().length < 3 && <p className="text-center text-[0.86rem] text-dim">Ketik minimal 3 karakter…</p>}
          {trimmedStatusQuery.length >= 3 && !isTracking && (matchedSubmissions.length === 0 ? (
            <p className="rounded-md border border-dashed border-line px-4 py-6 text-center text-[0.92rem] text-muted">
              Tidak ditemukan pendaftaran dengan kunci “{statusQuery}”. Pastikan Anda memasukkan {keyLabel} persis seperti saat mendaftar.
            </p>
          ) : matchedSubmissions.map((sub) => {
            const status = submissionStatus(sub.status);
            const parentForm = forms.find((f) => f.id === sub.formId);
            const identity = [sub.participantName, sub.participantDetail].filter(Boolean).join(' · ');
            return (
              <div key={sub.id} className="flex flex-col gap-3 rounded-lg border border-line bg-page p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[0.78rem] text-dim">{sub.id} · {formatWibTimestamp(sub.createdAt).exact || sub.createdAt}</p>
                    <h3 className="mt-1 font-display text-[1.15rem] font-semibold text-ink">{parentForm?.title || 'Formulir'}</h3>
                  </div>
                  <Badge tone={status.tone}>Status: {status.label}</Badge>
                </div>
                {identity && <p className="text-[0.9rem] text-muted">Pendaftar: <span className="text-ink">{identity}</span></p>}
                {sub.adminNotes
                  ? <div className="rounded-md border border-info-line bg-info-tint px-4 py-3"><p className="text-[0.76rem] font-semibold uppercase tracking-[0.1em] text-info">Catatan panitia</p><p className="mt-1 whitespace-pre-line text-ink">{sub.adminNotes}</p></div>
                  : <p className="text-[0.86rem] italic text-dim">Belum ada catatan dari panitia. Silakan cek kembali secara berkala.</p>}
                {parentForm?.isEventConnected && !['Rejected', 'Ditolak'].includes(sub.status) && (
                  <details className="group">
                    <summary className="cursor-pointer text-[0.88rem] font-semibold text-navy-ink">Tampilkan QR check-in acara</summary>
                    <div className="mt-3 flex justify-center"><RegistrationQr code={sub.id} /></div>
                  </details>
                )}
              </div>
            );
          }))}
        </div>
      </Card>
    </section>
  );
}
