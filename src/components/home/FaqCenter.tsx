import { useId, useState, type FormEvent } from 'react';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Search, Send } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { Button, Dialog, Field, Input, Select, cn } from '../../ui';
import { Container, Section, SectionHeading } from './shared';

const FAQS_PER_PAGE = 6;
const TOPICS = [
  { value: 'Kegiatan & Event', label: 'Ibadah & kegiatan' },
  { value: 'Pelayanan & Operasional', label: 'Pelayanan & musik' },
  { value: 'Pendaftaran & Oprec', label: 'Pendaftaran & retret' },
  { value: 'Doa & Pelayanan Kasih', label: 'Pokok doa & permohonan' },
  { value: 'Tentang Bapekkris', label: 'Tentang Bapekkris Bank Mandiri' }
];

interface FaqCenterProps {
  faqs: AppItem[];
  onSubmitQuestion?: (faq: AppItem) => Promise<unknown> | void;
}

function newFaqId(): string {
  return 'faq-user-' + (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
}

export function FaqCenter({ faqs, onSubmitQuestion }: FaqCenterProps) {
  const published = faqs.filter((f) => f.isPublished !== false)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  const [openId, setOpenId] = useState<string | null>('faq-1');
  const [category, setCategory] = useState('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [askName, setAskName] = useState('');
  const [askTopic, setAskTopic] = useState(TOPICS[0].value);
  const [askText, setAskText] = useState('');
  const [askError, setAskError] = useState('');
  const [askSuccess, setAskSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const baseId = useId();

  if (published.length === 0) return null;

  const categories = ['Semua', ...Array.from(new Set(published.map((f) => f.category || 'Umum')))];
  const query = search.trim().toLowerCase();
  const filtered = published.filter((f) => {
    const inCategory = category === 'Semua' || (f.category || 'Umum') === category;
    const matches = !query || [f.question, f.answer, f.category].some((v) => String(v || '').toLowerCase().includes(query));
    return inCategory && matches;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / FAQS_PER_PAGE));
  const current = Math.min(Math.max(1, page), totalPages);
  const visible = filtered.slice((current - 1) * FAQS_PER_PAGE, current * FAQS_PER_PAGE);

  const openConfirm = (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (askText.trim().length < 8) {
      setAskError('Mohon tuliskan pertanyaan Anda minimal 8 karakter');
      return;
    }
    setAskError('');
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (submitting) return;
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      await onSubmitQuestion?.({
        id: newFaqId(),
        category: askTopic || 'Umum',
        question: askText.trim(),
        answer: 'Menunggu jawaban & penjelasan resmi dari Pengurus Bapekkris Bank Mandiri.',
        askedBy: askName.trim() || 'Insan Mandiri',
        createdAt: new Date().toISOString(),
        isPublished: false
      });
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setAskError('Pertanyaan gagal dikirim ke server. Silakan periksa koneksi lalu coba lagi.');
      return;
    }
    setAskSuccess(true);
    setAskName('');
    setAskText('');
    setTimeout(() => setSubmitting(false), 500);
    setTimeout(() => setAskSuccess(false), 5000);
  };

  return (
    <Section labelledBy="faq-title">
      <Container className="max-w-[880px]">
        <SectionHeading
          id="faq-title"
          align="center"
          eyebrow="Tanya Jawab"
          title="Pertanyaan seputar kegiatan & pelayanan"
          description="Jadwal kebaktian, keikutsertaan retret, Paskah dan Natal, permohonan doa, hingga pelayanan kasih jemaat."
        />

        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-dim" />
            <Input type="search" aria-label="Cari pertanyaan" placeholder="Cari: ibadah, jadwal, retret…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="rounded-full pl-11" />
          </div>
          <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Kategori pertanyaan">
            {categories.map((cat) => (
              <button key={cat} type="button" aria-pressed={category === cat} onClick={() => { setCategory(cat); setPage(1); }}
                className={cn('h-8 cursor-pointer rounded-full border px-3.5 text-[0.82rem] font-semibold transition-colors',
                  category === cat ? 'border-action bg-action text-on-action' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink')}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-muted">
            Tidak ditemukan pertanyaan yang cocok dengan “{search}”.
          </p>
        ) : (
          <div className="divide-y divide-line rounded-lg border border-line bg-surface">
            {visible.map((item) => {
              const open = openId === item.id;
              const panelId = `${baseId}-${item.id}`;
              return (
                <div key={item.id}>
                  <h3>
                    <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpenId(open ? null : item.id)}
                      className="flex w-full cursor-pointer items-start justify-between gap-4 border-0 bg-transparent px-6 py-5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink">
                      <span className="flex flex-col gap-1">
                        <span className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-gold-ink">{item.category || 'Umum'}</span>
                        <span className="font-display text-[1.1rem] font-semibold leading-snug text-ink">{item.question}</span>
                      </span>
                      <ChevronDown size={20} aria-hidden="true" className={cn('mt-5 shrink-0 text-dim transition-transform', open && 'rotate-180')} />
                    </button>
                  </h3>
                  {open && <div id={panelId} className="whitespace-pre-line px-6 pb-6 text-[0.98rem] leading-relaxed text-muted">{item.answer}</div>}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <nav aria-label="Halaman pertanyaan" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[0.84rem] text-muted">
            <span>{(current - 1) * FAQS_PER_PAGE + 1}–{Math.min(current * FAQS_PER_PAGE, filtered.length)} dari {filtered.length} pertanyaan</span>
            <span className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" disabled={current === 1} onClick={() => setPage(current - 1)} icon={<ChevronLeft size={15} aria-hidden="true" />}>Sebelumnya</Button>
              <Button size="sm" variant="secondary" disabled={current === totalPages} onClick={() => setPage(current + 1)} iconRight={<ChevronRight size={15} aria-hidden="true" />}>Berikutnya</Button>
            </span>
          </nav>
        )}

        {onSubmitQuestion && (
          <div className="mt-12 rounded-lg border border-line bg-subtle p-6 md:p-8">
            <h3 className="font-display text-[1.3rem] font-semibold text-ink">Punya pertanyaan lain?</h3>
            <p className="mt-1 text-[0.92rem] text-muted">Kirimkan langsung ke pengurus. Pertanyaan yang sudah dijawab akan ditampilkan di daftar di atas.</p>
            {askSuccess && (
              <p role="status" className="mt-4 flex items-center gap-2 rounded-md border border-success-line bg-success-tint px-4 py-3 text-[0.9rem] font-semibold text-success">
                <CheckCircle2 size={17} aria-hidden="true" />Pertanyaan Anda terkirim ke pengurus Bapekkris.
              </p>
            )}
            <form onSubmit={openConfirm} noValidate className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label="Nama / unit kerja" hint="Opsional"><Input maxLength={120} value={askName} onChange={(e) => setAskName(e.target.value)} /></Field>
              <Field label="Topik">
                <Select value={askTopic} onChange={(e) => setAskTopic(e.target.value)}>
                  {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="Pertanyaan" required error={askError} className="md:col-span-2">
                <Input maxLength={1000} value={askText} onChange={(e) => { setAskText(e.target.value); if (askError) setAskError(''); }} />
              </Field>
              <div className="md:col-span-2">
                <Button type="submit" loading={submitting} icon={<Send size={16} aria-hidden="true" />}>{submitting ? 'Mengirim…' : 'Ajukan pertanyaan'}</Button>
              </div>
            </form>
          </div>
        )}
      </Container>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Kirim pertanyaan ini?" description="Pastikan pertanyaan Anda sudah jelas sebelum dikirim ke pengurus."
        footer={<><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Ubah lagi</Button><Button onClick={submit} data-autofocus>Kirim pertanyaan</Button></>}>
        <dl className="grid gap-3 text-[0.92rem]">
          <div><dt className="text-dim">Pengirim</dt><dd className="font-semibold text-ink">{askName.trim() || 'Anonim / Insan Mandiri'}</dd></div>
          <div><dt className="text-dim">Topik</dt><dd className="text-ink">{TOPICS.find((t) => t.value === askTopic)?.label || askTopic}</dd></div>
          <div><dt className="text-dim">Pertanyaan</dt><dd className="whitespace-pre-line leading-relaxed text-ink">{askText.trim()}</dd></div>
        </dl>
      </Dialog>
    </Section>
  );
}
