import { Edit2, Link2, MessageCircle, Plus, Trash2 } from 'lucide-react';
import { formatDeadlineWib, formatLastUpdatedWib, formatToIndonesianDate, getDeadlineStatus, toDatetimeLocalSecondsValue } from '../../utils/dateUtils';
import { getPublicBaseUrl } from '../../utils/urlUtils';
import { Badge, Button, Field, Input, Pagination, Select, Textarea } from '../../ui';
import { AdminEmpty, AdminPanel, AdminSubsection, CheckField, FilterSelect, IconButton, ListToolbar, SearchBox, Switch } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';
import { collectFieldErrors, formCreateSchema } from '../validation/schemas';

const PER_PAGE = 6;
const CATEGORIES: [string, string][] = [['Kegiatan & Event', 'Kegiatan & acara'], ['Rekrutmen', 'Rekrutmen & oprec'], ['Ibadah & Kebaktian', 'Ibadah & kebaktian'], ['Pelayanan & Diakonia', 'Pelayanan & diakonia'], ['Workshop & Sharing', 'Workshop & sharing']];
const connectedFormOf = (forms: any[], eventId: string) => (forms || []).find((f) => (f.isEventConnected || f.fields?.[0]?._isEventConnected) && String(f.eventId || f.fields?.[0]?._eventId) === String(eventId));

export default function FormsTab() {
  const {
    activeTenure, clearFieldError, divisions, events, formCatFilter, formErrors, formPage, formSearchQuery, formStatusFilter, formTenureFilter, forms,
    handleDeleteFormClick, newFormCategory, newFormDeadline, newFormEventId, newFormIsEventConnected, newFormIsLimited, newFormIsLuckyDraw,
    newFormMaxQuota, newFormNotes, newFormRequiresTracking, newFormShowAnnouncement, newFormSubtitle, newFormTenureId, newFormTitle, onAddForm,
    onUpdateForm, setEditingItem, setFormCatFilter, setFormErrors, setFormPage, setFormSearchQuery, setFormStatusFilter, setFormTenureFilter,
    setNewFormCategory, setNewFormDeadline, setNewFormEventId, setNewFormIsEventConnected, setNewFormIsLimited, setNewFormIsLuckyDraw,
    setNewFormMaxQuota, setNewFormNotes, setNewFormRequiresTracking, setNewFormShowAnnouncement, setNewFormSubtitle, setNewFormTenureId,
    setNewFormTitle, showToast, submissions, tenures
  } = useAdminPortal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = collectFieldErrors(formCreateSchema, {
      newFormTitle,
      newFormCategory,
      newFormDeadline,
      newFormIsLimited,
      newFormMaxQuota,
      newFormIsEventConnected,
      newFormEventId
    });
    if (Object.keys(errs).length > 0) {
      setFormErrors((prev: any) => ({ ...prev, ...errs }));
      showToast('Mohon lengkapi kolom wajib pada form Formulir', 'error');
      return;
    }

    const targetTenureId = newFormTenureId || activeTenure?.id || tenures[0]?.id || '';
    const newForm = {
      id: 'form-' + Date.now(),
      title: newFormTitle.trim(),
      subtitle: newFormSubtitle.trim() || '',
      notes: newFormNotes.trim() || '',
      category: newFormCategory.trim(),
      deadline: toDatetimeLocalSecondsValue(newFormDeadline.trim()) || '',
      isOpen: true,
      requiresTracking: newFormRequiresTracking,
      showAnnouncement: newFormShowAnnouncement,
      isLimited: newFormIsLimited,
      maxQuota: newFormIsLimited ? (parseInt(newFormMaxQuota, 10) || 0) : 0,
      tenureId: targetTenureId,
      isEventConnected: newFormIsEventConnected,
      eventId: newFormIsEventConnected ? newFormEventId : '',
      isLuckyDraw: newFormIsEventConnected && newFormIsLuckyDraw,
      fields: newFormRequiresTracking ? [
        { id: 'f-name', label: 'Nama Lengkap (HCM Mandiri)', type: 'text', placeholder: 'Nama sesuai HCM Mandiri', required: true, isSearchIndex: false, isUnique: false },
        { id: 'f-nip', label: 'NIP / Employee ID', type: 'text', placeholder: 'NIP Mandiri', required: true, isSearchIndex: true, isUnique: true },
        { id: 'f-unit', label: 'Unit Kerja / Cabang Mandiri', type: 'text', placeholder: 'Contoh: Corporate Banking / Region IV', required: true, isSearchIndex: false, isUnique: false },
        { id: 'f-wa', label: 'Nomor WhatsApp Aktif', type: 'text', placeholder: '0812xxxxxxxx', required: true, isSearchIndex: false, isUnique: false },
        { id: 'f-divisi', label: 'Pilihan Divisi Terkait', type: 'select', source: 'divisions', required: true, isSearchIndex: false, isUnique: false },
        { id: 'f-notes', label: 'Catatan / Alasan Pendaftaran', type: 'textarea', placeholder: 'Tuliskan keterangan pendukung...', required: true, isSearchIndex: false, isUnique: false },
        { id: 'f-doc', label: 'Upload Dokumen / File Pendukung', type: 'file', accept: '.pdf,.png,.jpg,.jpeg', required: false, isSearchIndex: false, isUnique: false }
      ] : [
        { id: 'f-name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama pengisi formulir', required: true, isSearchIndex: false, isUnique: false },
        { id: 'f-unit', label: 'Unit Kerja / Cabang Mandiri', type: 'text', placeholder: 'Contoh: Corporate Banking / Region IV', required: true, isSearchIndex: false, isUnique: false },
        { id: 'f-feedback', label: 'Tanggapan / Isian', type: 'textarea', placeholder: 'Tuliskan respon Anda...', required: true, isSearchIndex: false, isUnique: false }
      ]
    };

    if (onAddForm) onAddForm(newForm);
    setNewFormTitle('');
    setNewFormSubtitle('');
    setNewFormNotes('');
    setNewFormDeadline('');
    setNewFormCategory('');
    setNewFormRequiresTracking(true);
    setNewFormShowAnnouncement(false);
    setNewFormIsLimited(false);
    setNewFormMaxQuota('');
    setNewFormIsEventConnected(false);
    setNewFormEventId('');
    setNewFormIsLuckyDraw(false);
    showToast(`Formulir "${newForm.title}" berhasil dibuat & dipublikasikan!`);
  };

  const formTenure = newFormTenureId || activeTenure?.id || tenures[0]?.id || '';
  const eventsForTenure = (events || []).filter((evt: any) => {
    const t = evt.tenureId || divisions.find((d: any) => d.id === evt.divisionId)?.tenureId;
    return !formTenure || !t || t === formTenure;
  });
  const conflict = newFormEventId ? connectedFormOf(forms, newFormEventId) : null;

  const q = formSearchQuery.trim().toLowerCase();
  const filtered = forms.filter((f: any) => {
    const fTenure = f.tenureId || f.tenure_id || f.fields?.[0]?._tenureId || '';
    return (!q || [f.title, f.subtitle, f.category].some((v) => String(v || '').toLowerCase().includes(q))) &&
      (formTenureFilter === 'all' || fTenure === formTenureFilter) && (formCatFilter === 'all' || f.category === formCatFilter) &&
      (formStatusFilter === 'all' || (formStatusFilter === 'open' && Boolean(f.isOpen)) || (formStatusFilter === 'closed' && !f.isOpen));
  });
  const pageCount = Math.ceil(filtered.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, formPage), pageCount);
  const visible = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const linkOf = (f: any) => `${getPublicBaseUrl()}/?form=${encodeURIComponent(f.id)}#form`;

  return (
    <AdminPanel title={`Formulir (${forms.length})`} description="Buat formulir pendaftaran, atur batas waktu dan kuota, hubungkan ke acara, dan buka atau tutup formulir di situs.">
      <AdminSubsection title="Buat formulir">
        <form noValidate onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Field label="Judul" required error={formErrors.newFormTitle}>
            <Input placeholder="Contoh: Pendaftaran Retreat 2026" value={newFormTitle} onChange={(e) => { setNewFormTitle(e.target.value); clearFieldError('newFormTitle'); }} />
          </Field>
          <Field label="Periode" required>
            <Select value={formTenure} onChange={(e) => {
              const t = e.target.value;
              setNewFormTenureId(t);
              if (newFormEventId) {
                const ev = (events || []).find((x: any) => x.id === newFormEventId);
                const evT = ev?.tenureId || divisions.find((d: any) => d.id === ev?.divisionId)?.tenureId;
                if (evT && evT !== t) { setNewFormEventId(''); showToast('Periode form diubah. Pilihan acara di-reset agar sesuai periode baru.', 'info'); }
              }
            }}>
              {tenures.map((t: any) => <option key={t.id} value={t.id}>{t.title || `Kepengurusan ${t.code}`}{t.id === activeTenure?.id ? ' (aktif)' : ''}</option>)}
            </Select>
          </Field>
          <Field label="Kategori" required error={formErrors.newFormCategory}>
            <Select value={newFormCategory} onChange={(e) => { setNewFormCategory(e.target.value); clearFieldError('newFormCategory'); }}>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Batas waktu (WIB)" required error={formErrors.newFormDeadline} hint={newFormDeadline ? `Tampil di situs: ${formatDeadlineWib(newFormDeadline)}` : undefined}>
            <Input type="datetime-local" step={1} value={toDatetimeLocalSecondsValue(newFormDeadline)} onChange={(e) => { setNewFormDeadline(e.target.value); setFormErrors((prev: any) => ({ ...prev, newFormDeadline: undefined })); }} />
          </Field>
          <div className="md:col-span-2"><Field label="Subjudul"><Input placeholder="Tujuan pendaftaran secara singkat" value={newFormSubtitle} onChange={(e) => setNewFormSubtitle(e.target.value)} /></Field></div>
          <div className="md:col-span-2">
            <Field label="Pesan setelah mengirim" hint="Tampil ke pendaftar setelah formulir terkirim, mis. tautan grup WhatsApp. Tautan otomatis bisa diklik.">
              <Textarea rows={3} value={newFormNotes} onChange={(e) => setNewFormNotes(e.target.value)} />
            </Field>
          </div>

          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <CheckField checked={newFormRequiresTracking} onChange={setNewFormRequiresTracking} label="Pendaftar bisa melacak status"
              description={newFormRequiresTracking ? 'Pendaftar mendapat ID dan bisa memantau status seleksi di situs.' : 'Formulir biasa (survei, absensi) tanpa pelacakan status.'} />
            <CheckField checked={newFormShowAnnouncement} onChange={setNewFormShowAnnouncement} label="Umumkan peserta yang diterima"
              description={newFormShowAnnouncement ? 'Daftar pendaftar berstatus Diterima tampil di halaman formulir.' : 'Hasil seleksi tidak dipublikasikan.'} />
            <div className="flex flex-col gap-3">
              <CheckField checked={newFormIsLimited} onChange={(v) => { setNewFormIsLimited(v); if (!v) { setNewFormMaxQuota(''); clearFieldError('newFormMaxQuota'); } }} label="Batasi kuota"
                description={newFormIsLimited ? 'Formulir otomatis tertutup saat kuota terpenuhi.' : 'Tanpa batas kuota, hanya dibatasi batas waktu.'} />
              {newFormIsLimited && (
                <Field label="Kuota maksimal" required error={formErrors.newFormMaxQuota}>
                  <Input type="number" min={1} placeholder="Contoh: 100" value={newFormMaxQuota} onChange={(e) => { setNewFormMaxQuota(e.target.value); clearFieldError('newFormMaxQuota'); }} />
                </Field>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <CheckField checked={newFormIsEventConnected} onChange={(v) => { setNewFormIsEventConnected(v); if (!v) { setNewFormEventId(''); clearFieldError('newFormEventId'); } }} label="Hubungkan ke acara"
                description={newFormIsEventConnected ? 'Menggantikan RSVP standar di acara tersebut; pendaftar masuk ke statistik dan undian acara.' : 'Formulir mandiri.'} />
              {newFormIsEventConnected && (
                <>
                  <Field label="Acara" required error={formErrors.newFormEventId || (eventsForTenure.length === 0 ? 'Belum ada acara di periode ini.' : undefined)}>
                    <Select value={newFormEventId} disabled={eventsForTenure.length === 0} onChange={(e) => { setNewFormEventId(e.target.value); clearFieldError('newFormEventId'); }}>
                      <option value="">Pilih acara</option>
                      {eventsForTenure.map((evt: any) => {
                        const existing = connectedFormOf(forms, evt.id);
                        return <option key={evt.id} value={evt.id}>{evt.title} ({evt.startDate ? formatToIndonesianDate(evt.startDate.split('T')[0]) : (evt.date || 'tanpa tanggal')}){existing ? ` · terhubung ke "${existing.title}"` : ''}</option>;
                      })}
                    </Select>
                  </Field>
                  {conflict && (
                    <p role="note" className="rounded-md border border-gold-line bg-gold-tint px-3 py-2 text-[0.84rem] text-ink">
                      Acara ini sedang terhubung ke <strong>“{conflict.title}”</strong>. Menyimpan formulir ini akan memindahkan koneksi ke formulir baru; formulir lama tetap ada beserta datanya.
                    </p>
                  )}
                  <CheckField checked={newFormIsLuckyDraw} onChange={setNewFormIsLuckyDraw} label="Ada undian doorprize"
                    description={newFormIsLuckyDraw ? 'Halaman statistik acara menampilkan modul undian.' : 'Hanya statistik pendaftar.'} />
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end md:col-span-2"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Terbitkan formulir</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <ListToolbar title={<>Daftar formulir <span className="font-normal text-muted">({filtered.length} dari {forms.length})</span></>}>
          <SearchBox label="Cari formulir" placeholder="Cari formulir" value={formSearchQuery} onChange={(v) => { setFormSearchQuery(v); setFormPage(1); }} />
          <FilterSelect label="Saring periode" value={formTenureFilter} onChange={(v) => { setFormTenureFilter(v); setFormPage(1); }}>
            <option value="all">Semua periode</option>
            {tenures.map((t: any) => <option key={t.id} value={t.id}>Periode {t.code || t.title}{t.isActive ? ' (aktif)' : ''}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring kategori" value={formCatFilter} onChange={(v) => { setFormCatFilter(v); setFormPage(1); }}>
            <option value="all">Semua kategori</option>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </FilterSelect>
          <FilterSelect label="Saring status" value={formStatusFilter} onChange={(v) => { setFormStatusFilter(v); setFormPage(1); }}>
            <option value="all">Semua status</option>
            <option value="open">Dibuka</option>
            <option value="closed">Ditutup</option>
          </FilterSelect>
        </ListToolbar>

        {filtered.length === 0 ? <AdminEmpty>{forms.length === 0 ? 'Belum ada formulir.' : 'Tidak ada formulir yang cocok.'}</AdminEmpty> : (
          <ul className="flex list-none flex-col gap-3">
            {visible.map((f: any) => {
              const subCount = submissions.filter((s: any) => s.formId === f.id).length;
              const tenure = tenures.find((t: any) => t.id === f.tenureId);
              const uniqueCount = (f.fields || []).filter((fld: any) => fld.isUnique).length;
              const dl = getDeadlineStatus(f.deadline);
              const full = f.isLimited && subCount >= (f.maxQuota || 0);
              return (
                <li key={f.id} className="flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug text-ink">{f.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone="info">{f.category || 'Formulir'}</Badge>
                        {tenure && <Badge>{tenure.code || tenure.title}</Badge>}
                        <Badge tone={f.requiresTracking !== false ? 'gold' : 'neutral'}>{f.requiresTracking !== false ? 'Dengan pelacakan' : 'Formulir biasa'}</Badge>
                        {uniqueCount > 0 && <Badge tone="navy" title="Pertanyaan dengan validasi anti-duplikat">{uniqueCount} unik</Badge>}
                        {f.isLimited && <Badge tone={full ? 'danger' : 'info'}>{full ? 'Kuota penuh' : 'Kuota'} {subCount}/{f.maxQuota}</Badge>}
                        {dl.isExpired && <Badge tone="danger">Lewat batas waktu</Badge>}
                        {!dl.isExpired && dl.isToday && <Badge tone="gold">Hari terakhir</Badge>}
                      </div>
                      <p className="mt-1.5 text-[0.84rem] text-muted">Batas: {f.deadline ? formatDeadlineWib(f.deadline) : 'tanpa batas waktu'} · {f.fields?.length || 0} pertanyaan · <strong className="text-ink">{subCount} pengisian</strong></p>
                      {f.updatedAt && <p className="mt-0.5 text-[0.76rem] text-dim">{formatLastUpdatedWib(f.updatedAt)}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <IconButton label="Salin tautan formulir" onClick={() => { navigator.clipboard?.writeText(linkOf(f)); showToast(`Link langsung formulir "${f.title}" berhasil disalin!`); }}><Link2 size={15} aria-hidden="true" /></IconButton>
                      <IconButton label="Bagikan ke WhatsApp" onClick={() => {
                        const text = `📋 *Formulir Registrasi Bapekkris Bank Mandiri*\n*${f.title}*\n⏳ Batas Pengisian: ${f.deadline ? formatDeadlineWib(f.deadline) : 'Tanpa batas waktu'}\n\nSilakan isi formulir melalui tautan resmi berikut:\n${linkOf(f)}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                      }}><MessageCircle size={15} aria-hidden="true" /></IconButton>
                      <IconButton label={`Edit ${f.title}`} onClick={() => setEditingItem({ type: 'form', item: { ...f } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                      <IconButton label={`Hapus ${f.title}`} tone="danger" onClick={() => handleDeleteFormClick(f)}><Trash2 size={15} aria-hidden="true" /></IconButton>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-3 text-[0.86rem] text-ink">
                    <span className="flex items-center gap-2"><Switch checked={Boolean(f.isOpen)} label={`Buka formulir ${f.title}`} onChange={(v) => onUpdateForm?.({ ...f, isOpen: v })} />{f.isOpen ? 'Dibuka di situs' : 'Ditutup'}</span>
                    <span className="flex items-center gap-2"><Switch checked={Boolean(f.showAnnouncement)} label={`Umumkan peserta diterima untuk ${f.title}`} onChange={(v) => {
                      onUpdateForm?.({ ...f, showAnnouncement: v });
                      showToast(v ? `Papan pengumuman terpilih untuk "${f.title}" diaktifkan!` : `Papan pengumuman terpilih untuk "${f.title}" disembunyikan.`);
                    }} />Pengumuman peserta diterima</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setFormPage} itemLabel="formulir" total={filtered.length} pageSize={PER_PAGE} />
      </div>
    </AdminPanel>
  );
}
