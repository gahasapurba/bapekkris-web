import { ArrowDown, ArrowUp, Edit2, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib, formatWibTimestamp } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea } from '../../ui';
import { faqCreateSchema } from '../validation/schemas';
import { useAdminDraftForm } from '../useAdminDraftForm';
import { AdminEmpty, AdminPanel, AdminSubsection, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';
import type { AppItem } from '../../lib/supabase';

const PER_PAGE = 10;
export const FAQ_CATEGORIES = ['Tentang Bapekkris', 'Kegiatan & Event', 'Pelayanan & Operasional', 'Doa & Pelayanan Kasih', 'Pendaftaran & Oprec', 'Umum'];
type FaqForm = { faqCategory: string; faqQuestion: string; faqAnswer: string };

const selectClass = 'h-11 cursor-pointer rounded-full border border-line bg-surface pl-4 pr-3 text-[0.86rem] font-medium text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink';

export default function FaqsTab() {
  const {
    adminFaqPage, faqCatFilter, faqSearchQuery, faqs, onAddFaq, onUpdateFaq, showToast,
    setAdminFaqPage, setDeleteConfirm, setEditingItem, setFaqCatFilter, setFaqSearchQuery
  } = useAdminPortal();
  const { handleSubmit, field, resetToDefaults, formState: { errors } } = useAdminDraftForm<FaqForm>('faq', faqCreateSchema,
    { faqCategory: '', faqQuestion: '', faqAnswer: '' });
  const createFaq = handleSubmit(({ faqCategory, faqQuestion, faqAnswer }) => {
    onAddFaq?.({ id: 'faq-' + Date.now(), category: faqCategory.trim(), question: faqQuestion.trim(), answer: faqAnswer.trim(), isPublished: true, sortOrder: nextSortOrder });
    resetToDefaults();
    showToast('Pertanyaan FAQ baru berhasil ditambahkan & disinkronkan!');
  }, () => showToast('Mohon lengkapi seluruh kolom wajib pada form FAQ', 'error'));

  // Display order (sort_order, then oldest first) is the order on the public page
  const ordered = [...faqs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  const nextSortOrder = ordered.reduce((max, f) => Math.max(max, Number(f.sortOrder) || 0), 0) + 10;
  const q = faqSearchQuery.trim().toLowerCase();
  const filtered = ordered.filter((f) =>
    (!q || (f.question || '').toLowerCase().includes(q) || (f.answer || '').toLowerCase().includes(q)) &&
    (faqCatFilter === 'all' || f.category === faqCatFilter));
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;

  /** Swaps a question with its neighbour in the visible list; positions are renumbered 10, 20, ... */
  const move = (faq: AppItem, direction: -1 | 1) => {
    const neighbour = filtered[filtered.indexOf(faq) + direction];
    if (!neighbour) return;
    const next = [...ordered];
    const a = next.indexOf(faq);
    const b = next.indexOf(neighbour);
    [next[a], next[b]] = [next[b], next[a]];
    next.forEach((f, i) => { if ((f.sortOrder ?? 0) !== (i + 1) * 10) onUpdateFaq?.({ ...f, sortOrder: (i + 1) * 10 }); });
  };
  const page = Math.min(Math.max(1, adminFaqPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminPanel title={`Panduan & FAQ (${faqs.length})`} description="Pertanyaan umum seputar persekutuan, ibadah, pelayanan kasih, dan pendaftaran kegiatan. Pertanyaan dari pengunjung masuk sebagai draf sampai dijawab.">
      <AdminSubsection title="Tambah pertanyaan">
        <form onSubmit={createFaq} noValidate className="flex flex-col gap-4">
          <Field label="Kategori" required error={errors.faqCategory?.message}>
            <Select {...field('faqCategory')}>
              <option value="">Pilih kategori</option>
              {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Pertanyaan" required error={errors.faqQuestion?.message}>
            <Input placeholder="Contoh: Bagaimana cara mengikuti persekutuan doa?" {...field('faqQuestion')} />
          </Field>
          <Field label="Jawaban" required error={errors.faqAnswer?.message}>
            <Textarea rows={4} placeholder="Penjelasan yang jelas dan membantu" {...field('faqAnswer')} />
          </Field>
          <div className="flex justify-end"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Tambah pertanyaan</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[0.98rem] font-semibold text-ink">Daftar pertanyaan <span className="font-normal text-muted">({filtered.length} dari {faqs.length})</span></h3>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
              <Input type="search" aria-label="Cari FAQ" placeholder="Cari pertanyaan atau jawaban" value={faqSearchQuery} onChange={(e) => { setFaqSearchQuery(e.target.value); setAdminFaqPage(1); }} className="w-full rounded-full pl-10" />
            </div>
            <select aria-label="Saring kategori" value={faqCatFilter} onChange={(e) => { setFaqCatFilter(e.target.value); setAdminFaqPage(1); }} className={selectClass}>
              <option value="all">Semua kategori</option>
              {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? <AdminEmpty>Tidak ada pertanyaan yang cocok.</AdminEmpty> : (
          <ul className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
            {visible.map((f) => {
              const published = f.isPublished !== false;
              const askedAt = f.createdAt || f.submittedAt;
              return (
                <li key={f.id} className="flex flex-col gap-3 bg-surface p-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-muted">
                      <Badge tone="info">{f.category || 'Umum'}</Badge>
                      <Badge tone={published ? 'success' : 'gold'}>{published ? 'Tampil di publik' : 'Draf / menunggu jawaban'}</Badge>
                      {f.askedBy && f.askedBy !== 'Admin Bapekkris' && <span>Ditanyakan oleh {f.askedBy}{askedAt ? ` · ${formatWibTimestamp(askedAt).exact || askedAt}` : ''}</span>}
                    </div>
                    <p className="font-semibold leading-snug text-ink">{f.question}</p>
                    <p className="mt-1 whitespace-pre-line text-[0.88rem] leading-relaxed text-muted">{f.answer || <em>Belum dijawab</em>}</p>
                    {f.updatedAt && <p className="mt-1.5 text-[0.76rem] text-dim">{formatLastUpdatedWib(f.updatedAt)}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton label={`Naikkan urutan: ${f.question}`} disabled={filtered.indexOf(f) === 0} onClick={() => move(f, -1)}><ArrowUp size={15} aria-hidden="true" /></IconButton>
                    <IconButton label={`Turunkan urutan: ${f.question}`} disabled={filtered.indexOf(f) === filtered.length - 1} onClick={() => move(f, 1)}><ArrowDown size={15} aria-hidden="true" /></IconButton>
                    <Button size="sm" variant="secondary" icon={published ? <EyeOff size={14} aria-hidden="true" /> : <Eye size={14} aria-hidden="true" />} onClick={() => onUpdateFaq?.({ ...f, isPublished: !published })}>
                      {published ? 'Sembunyikan' : 'Tampilkan'}
                    </Button>
                    <IconButton label="Edit pertanyaan" onClick={() => setEditingItem({ type: 'faq', item: { ...f } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                    <IconButton label="Hapus pertanyaan" tone="danger" onClick={() => setDeleteConfirm({ type: 'faq', id: f.id, name: f.question })}><Trash2 size={15} aria-hidden="true" /></IconButton>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setAdminFaqPage} itemLabel="pertanyaan" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
