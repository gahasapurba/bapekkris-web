import { Edit2, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react';
import { formatLastUpdatedWib, formatWibTimestamp } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Textarea } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

const PER_PAGE = 10;
const CATEGORIES = ['Tentang Bapekkris', 'Kegiatan & Event', 'Pelayanan & Operasional', 'Doa & Pelayanan Kasih', 'Pendaftaran & Oprec', 'Umum'];
const selectClass = 'h-11 cursor-pointer rounded-full border border-line bg-surface pl-4 pr-3 text-[0.86rem] font-medium text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink';

export default function FaqsTab() {
  const {
    adminFaqPage, clearFieldError, faqAnswer, faqCatFilter, faqQuestion, faqSearchQuery, faqs, formErrors, handleCreateFaq, onUpdateFaq,
    setAdminFaqPage, setDeleteConfirm, setEditingItem, setFaqAnswer, setFaqCatFilter, setFaqQuestion, setFaqSearchQuery
  } = useAdminPortal();

  const q = faqSearchQuery.trim().toLowerCase();
  const filtered = faqs.filter((f: any) =>
    (!q || (f.question || '').toLowerCase().includes(q) || (f.answer || '').toLowerCase().includes(q)) &&
    (faqCatFilter === 'all' || f.category === faqCatFilter));
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, adminFaqPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <AdminPanel title={`Panduan & FAQ (${faqs.length})`} description="Pertanyaan umum seputar persekutuan, ibadah, pelayanan kasih, dan pendaftaran kegiatan. Pertanyaan dari pengunjung masuk sebagai draf sampai dijawab.">
      <AdminSubsection title="Tambah pertanyaan">
        <form onSubmit={handleCreateFaq} noValidate className="flex flex-col gap-4">
          <Field label="Pertanyaan" required error={formErrors.faqQuestion}>
            <Input placeholder="Contoh: Bagaimana cara mengikuti persekutuan doa?" value={faqQuestion} onChange={(e) => { setFaqQuestion(e.target.value); clearFieldError('faqQuestion'); }} />
          </Field>
          <Field label="Jawaban" required error={formErrors.faqAnswer}>
            <Textarea rows={4} placeholder="Penjelasan yang jelas dan membantu" value={faqAnswer} onChange={(e) => { setFaqAnswer(e.target.value); clearFieldError('faqAnswer'); }} />
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
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? <AdminEmpty>Tidak ada pertanyaan yang cocok.</AdminEmpty> : (
          <ul className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
            {visible.map((f: any) => {
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
