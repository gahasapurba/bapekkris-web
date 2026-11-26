import type { ReactNode } from 'react';
import { AlertCircle, Check, CheckCircle2, Clock, Copy, Link2, MessageCircle, QrCode, Search, Send, ShieldCheck, Upload, X } from 'lucide-react';
import type { AppItem } from '../../../lib/supabase';
import { formatDeadlineWib, formatWibEventRange, getDeadlineStatus } from '../../../utils/dateUtils';
import { getUnifiedFormQuota } from '../../../utils/quotaUtils';
import { Badge, Button, Card, Input, Select, Textarea, cn } from '../../../ui';
import { DEFAULT_FILE_ACCEPT, TEXTAREA_MAX_LENGTH, TEXT_MAX_LENGTH } from '../formLimits';
import { useDynamicFormContext } from '../DynamicFormContext';
import { PostSubmissionNotes } from './PostSubmissionNotes';
import RegistrationQr from '../../shared/RegistrationQr';

function Alert({ tone, icon, children }: { tone: 'danger' | 'gold'; icon: ReactNode; children: ReactNode }) {
  return (
    <p role="status" className={cn('flex items-start gap-2.5 rounded-md border px-4 py-3 text-left text-[0.9rem] font-medium',
      tone === 'danger' ? 'border-danger-line bg-danger-tint text-danger' : 'border-gold-line bg-gold-tint text-gold-ink')}>
      <span className="mt-0.5 shrink-0">{icon}</span><span>{children}</span>
    </p>
  );
}

/** Options of a choice field: static, or the tenure's divisions / public events. */
function optionsOf(field: AppItem, form: AppItem, divisions: AppItem[], events: AppItem[]): string[] {
  if (field.source === 'divisions') {
    const tenureId = form?.tenureId;
    const inTenure = tenureId ? divisions.filter((d) => d.tenureId === tenureId) : divisions;
    return (inTenure.length > 0 ? inTenure : divisions).map((d) => d.name);
  }
  if (field.source === 'events') {
    return events.filter((e) => e.isPublic === true).map((e) => {
      const when = formatWibEventRange(e.startDate, e.endDate, e.date);
      return when ? `${e.title} (${when})` : e.title;
    });
  }
  return field.options || [];
}

function SubmittedView() {
  const { copiedSubId, currentForm, handleCopySubId, lastSubmittedId, setFileData, setFormData, setIsSubmitted, setStatusQuery } = useDynamicFormContext();
  const tracked = currentForm?.requiresTracking !== false;
  const reset = () => { setIsSubmitted(false); setFormData({}); setFileData({}); };
  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-success-tint text-success"><CheckCircle2 size={30} aria-hidden="true" /></span>
      <div>
        <h2 className="font-display text-[1.8rem] font-semibold text-ink">Terima kasih, formulir terkirim</h2>
        <p className="mx-auto mt-2 max-w-[52ch] text-muted">Isian Anda untuk <strong className="text-ink">“{currentForm.title}”</strong> sudah tersimpan.</p>
      </div>
      {tracked ? (
        <>
          <div className="flex flex-col items-center gap-2 rounded-lg border border-line bg-page px-6 py-4">
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-dim">ID pendaftaran Anda</span>
            <span className="font-mono text-[1.25rem] font-semibold tracking-wide text-ink">{lastSubmittedId}</span>
            <Button size="sm" variant="secondary" icon={copiedSubId ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} onClick={() => handleCopySubId(lastSubmittedId)}>
              {copiedSubId ? 'Tersalin' : 'Salin ID'}
            </Button>
          </div>
          <p className="max-w-[56ch] text-[0.9rem] text-muted">Simpan ID ini. Anda memerlukannya untuk memantau status seleksi dan catatan panitia di bagian <strong className="text-ink">Cek status pendaftaran</strong>.</p>
          {currentForm?.isEventConnected && lastSubmittedId && <RegistrationQr code={lastSubmittedId} />}
        </>
      ) : (
        <p className="max-w-[56ch] text-[0.9rem] text-muted">Formulir ini tidak memerlukan pelacakan status. Tim kami akan memproses tanggapan Anda sesuai ketentuan.</p>
      )}
      <div className="w-full max-w-xl"><PostSubmissionNotes notes={currentForm?.notes} /></div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={reset}>Kirim formulir lainnya</Button>
        {tracked && lastSubmittedId && (
          <Button icon={<Search size={16} aria-hidden="true" />} onClick={() => { setStatusQuery(lastSubmittedId); document.getElementById('status-tracker-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
            Cek status pendaftaran
          </Button>
        )}
      </div>
    </div>
  );
}

export default function FormPanel() {
  const {
    copiedLink, currentFields, currentForm, divisions, errors, events, fileData, formData, generatingPoster, handleCopyFormLink,
    handleDownloadQrPoster, handleFileUpload, handleInputBlur, handleInputChange, handleShareFormWa, handleSubmit,
    honeypotVal, isSubmitted, registrationCounts, setFileData, setFormData, setHoneypotVal, setPendingFiles, uploadingFieldId
  } = useDynamicFormContext();

  const deadline = getDeadlineStatus(currentForm.deadline);
  const quota = getUnifiedFormQuota(currentForm, events, registrationCounts);
  const removeKey = (key: string) => <T,>(prev: Record<string, T>) => { const copy = { ...prev }; delete copy[key]; return copy; };

  return (
    <section aria-labelledby="form-title" className="mx-auto w-full max-w-[820px]">
      <Card padding="lg">
        {isSubmitted ? <SubmittedView /> : (
          <>
            <header className="flex flex-col items-center gap-3 border-b border-line pb-8 text-center">
              <Badge tone="gold">{currentForm.category || 'Pendaftaran resmi'}</Badge>
              <h2 id="form-title" className="font-display text-[clamp(1.6rem,3.4vw,2.2rem)] font-semibold leading-tight text-ink">{currentForm.title}</h2>
              {currentForm.subtitle && <p className="max-w-[58ch] text-muted">{currentForm.subtitle}</p>}
              <div className="flex flex-wrap items-center justify-center gap-2 text-[0.86rem] text-muted">
                {currentForm.deadline && <span className="inline-flex items-center gap-1.5"><Clock size={15} aria-hidden="true" />Batas: {formatDeadlineWib(currentForm.deadline)}</span>}
                {quota.isLimited && quota.maxQuota > 0 && (
                  <Badge tone={quota.isFull ? 'danger' : 'info'}>{quota.isConnected ? 'Kuota acara' : 'Kuota'} {quota.count}/{quota.maxQuota} · {quota.isFull ? 'penuh' : `sisa ${quota.remaining}`}</Badge>
                )}
                {deadline.isExpired && <Badge tone="danger">Ditutup</Badge>}
              </div>
              <div className="flex w-full flex-col gap-2">
                {quota.isFull && !deadline.isExpired && (
                  <Alert tone="danger" icon={<AlertCircle size={17} aria-hidden="true" />}>
                    {quota.isConnected
                      ? `Kuota acara "${quota.connectedEvent?.title}" sudah penuh (${quota.count}/${quota.maxQuota} peserta). Pendaftaran ditutup.`
                      : `Kuota formulir ini sudah penuh (${quota.count}/${quota.maxQuota} responden). Pendaftaran ditutup.`}
                  </Alert>
                )}
                {deadline.isExpired && <Alert tone="danger" icon={<AlertCircle size={17} aria-hidden="true" />}>Batas waktu pendaftaran berakhir pada {deadline.formatted}. Formulir tidak lagi menerima isian baru.</Alert>}
                {deadline.isToday && <Alert tone="gold" icon={<Clock size={17} aria-hidden="true" />}>Hari ini hari terakhir pendaftaran ({deadline.formatted}). Kirim sebelum pukul 23.59 WIB.</Alert>}
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="secondary" icon={copiedLink ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />} onClick={() => handleCopyFormLink(currentForm)}>{copiedLink ? 'Tautan tersalin' : 'Salin tautan'}</Button>
                <Button size="sm" variant="secondary" icon={<MessageCircle size={14} aria-hidden="true" />} onClick={() => handleShareFormWa(currentForm)}>Bagikan ke WhatsApp</Button>
                <Button size="sm" variant="secondary" loading={generatingPoster} icon={<QrCode size={14} aria-hidden="true" />} onClick={() => handleDownloadQrPoster(currentForm)}>
                  {generatingPoster ? 'Menyiapkan poster…' : 'Unduh poster QR'}
                </Button>
              </div>
            </header>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6 pt-8">
              {/* Honeypot: hidden from people, filled in by bots */}
              <div className="pointer-events-none absolute -z-10 h-0 overflow-hidden opacity-0" aria-hidden="true">
                <input type="text" name="mandiri_corp_security_check" tabIndex={-1} autoComplete="off" value={honeypotVal} onChange={(e) => setHoneypotVal(e.target.value)} />
              </div>

              {currentFields.map((field) => {
                const error: string | undefined = errors[field.id] || undefined;
                const inputId = `field-${field.id}`;
                const errorId = `${inputId}-error`;
                const aria = { id: inputId, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined, 'aria-required': field.required ? true : undefined } as const;
                const options = optionsOf(field, currentForm, divisions, events);
                const label = (
                  <>
                    {field.label}
                    {field.required && <span className="ml-0.5 text-danger" aria-hidden="true">*</span>}
                    {field.isUnique && <span className="ml-2 inline-flex items-center gap-1 text-[0.74rem] font-semibold text-info"><ShieldCheck size={13} aria-hidden="true" />Satu kali per orang</span>}
                  </>
                );
                return (
                  <div key={field.id} className="flex flex-col gap-1.5">
                    {field.type === 'radio' ? (
                      <fieldset aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined} className="m-0 border-0 p-0">
                        <legend className="mb-2 p-0 text-[0.88rem] font-semibold text-muted">{label}</legend>
                        <div className="flex flex-col gap-2">
                          {options.map((opt, i) => {
                            const selected = formData[field.id] === opt;
                            return (
                              <label key={i} className={cn('flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-[0.95rem] transition-colors',
                                selected ? 'border-navy-ink bg-navy-tint font-semibold text-ink' : 'border-field-line bg-field text-ink hover:border-line-strong')}>
                                <input type="radio" name={inputId} value={opt} checked={selected} onChange={() => handleInputChange(field.id, opt)} className="size-4 accent-[var(--mandiri-blue)]" />
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ) : (
                      <label htmlFor={inputId} className="text-[0.88rem] font-semibold text-muted">{label}</label>
                    )}

                    {(field.type === 'text' || field.type === 'email' || field.type === 'number') && (
                      <Input {...aria} type={field.type} placeholder={field.placeholder || ''} maxLength={TEXT_MAX_LENGTH} value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)} onBlur={() => handleInputBlur(field)} />
                    )}
                    {field.type === 'textarea' && (
                      <Textarea {...aria} placeholder={field.placeholder || ''} maxLength={TEXTAREA_MAX_LENGTH} value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)} onBlur={() => handleInputBlur(field)} />
                    )}
                    {field.type === 'select' && (
                      <Select {...aria} value={formData[field.id] || ''} onChange={(e) => handleInputChange(field.id, e.target.value)} onBlur={() => handleInputBlur(field)}>
                        <option value="">Pilih {String(field.label).toLowerCase()}</option>
                        {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </Select>
                    )}
                    {field.type === 'file' && (
                      <div className={cn('flex items-center gap-3 rounded-md border border-dashed px-4 py-3', error ? 'border-danger' : 'border-field-line bg-field')}>
                        <Upload size={18} aria-hidden="true" className="shrink-0 text-gold-ink" />
                        <label className="flex-1 cursor-pointer text-[0.9rem] text-muted">
                          <input {...aria} type="file" accept={field.accept || DEFAULT_FILE_ACCEPT} onChange={(e) => handleFileUpload(field, e)} className="sr-only" />
                          {uploadingFieldId === field.id
                            ? <span className="font-semibold text-gold-ink">Mengunggah berkas…</span>
                            : fileData[field.id]
                              ? <span className="font-semibold text-success">{fileData[field.id].name} ({fileData[field.id].size}) · siap dikirim</span>
                              : <span>Pilih berkas ({field.accept || 'PDF, gambar, dokumen Office, ZIP'}, maks. 20 MB)</span>}
                        </label>
                        {fileData[field.id] && (
                          <button type="button" aria-label={`Batalkan berkas ${fileData[field.id].name}`}
                            onClick={() => { setPendingFiles(removeKey(field.id)); setFileData(removeKey(field.id)); setFormData(removeKey(field.id)); }}
                            className="cursor-pointer rounded-full border-0 bg-transparent p-1.5 text-danger hover:bg-danger-tint">
                            <X size={16} aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    )}
                    {error && <p id={errorId} className="flex items-center gap-1.5 text-[0.82rem] font-semibold text-danger"><AlertCircle size={14} aria-hidden="true" />{error}</p>}
                  </div>
                );
              })}

              <div className="border-t border-line pt-6">
                {deadline.isExpired ? (
                  <Alert tone="danger" icon={<AlertCircle size={17} aria-hidden="true" />}>Pendaftaran ditutup (batas waktu berakhir).</Alert>
                ) : quota.isFull ? (
                  <Alert tone="danger" icon={<AlertCircle size={17} aria-hidden="true" />}>Pendaftaran ditutup ({quota.isConnected ? 'kuota acara penuh' : 'kuota penuh'}: {quota.count}/{quota.maxQuota}).</Alert>
                ) : (
                  <Button type="submit" variant="gold" size="lg" icon={<Send size={18} aria-hidden="true" />} className="w-full sm:w-auto">Kirim pendaftaran</Button>
                )}
              </div>
            </form>
          </>
        )}
      </Card>
    </section>
  );
}
