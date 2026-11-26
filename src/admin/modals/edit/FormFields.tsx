import { ArrowDown, ArrowUp, GripVertical, Layers, Plus, Trash2 } from 'lucide-react';
import { formatDeadlineWib, formatToIndonesianDate, toDatetimeLocalSecondsValue } from '../../../utils/dateUtils';
import { Button, Field, Input, Select, Textarea, cn, useFeedback } from '../../../ui';
import type { FormField } from '../../../types/content';
import { getFormFields } from '../../../utils/formMeta';
import { isFormConnectedToEvent } from '../../../utils/quotaUtils';
import { FORM_CATEGORIES } from '../../tabs/FormsTab';
import { CheckField, IconButton } from '../../AdminUi';
import { useEditBinding } from './useEditBinding';

const FIELD_TYPES: [string, string][] = [
  ['text', 'Teks singkat'], ['textarea', 'Paragraf'], ['radio', 'Pilihan ganda (1 jawaban)'], ['select', 'Dropdown (opsi manual)'],
  ['select_division', 'Dropdown divisi (otomatis)'], ['email', 'Email'], ['number', 'Angka'], ['file', 'Unggah berkas']
];
const DEFAULT_OPTIONS: Record<string, string[]> = { radio: ['Pilihan 1', 'Pilihan 2', 'Pilihan 3'], select: ['Opsi 1', 'Opsi 2', 'Opsi 3'] };
const chip = (active: boolean) => cn('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[0.78rem] font-semibold',
  active ? 'border-gold-line bg-gold-tint text-gold-ink' : 'border-line bg-surface text-muted hover:text-ink');

/** Fields of the edit dialog for `form` items: settings and the question editor. */
export default function FormFields() {
  const {
    activeTenure, bind, divisions, dragOverFieldIndex, draggedFieldIndex, events, forms, handleMoveField, item, set,
    setDragOverFieldIndex, setDraggedFieldIndex, showToast, submissions, tenures
  } = useEditBinding();
  const { toast, confirm } = useFeedback();
  const fields = getFormFields(item);
  const tenureId = item.tenureId || activeTenure?.id || tenures[0]?.id || '';
  const eventTenure = (eventId: string) => {
    const evt = events.find((ev) => ev.id === eventId);
    return evt ? (evt.tenureId || divisions.find((d) => d.id === evt.divisionId)?.tenureId) : null;
  };
  const selectableEvents = events.filter((evt) => {
    const t = eventTenure(evt.id);
    return !t || t === tenureId || evt.id === item.eventId;
  });
  const takeoverForm = item.eventId ? forms.find((f) => f.id !== item.id && isFormConnectedToEvent(f, item.eventId)) : undefined;
  const submissionCount = submissions.filter((s) => s.formId === item.id).length;
  const tenure = tenures.find((t) => t.id === tenureId) || activeTenure;
  const tenureDivisionCount = divisions.filter((d) => !tenureId || d.tenureId === tenureId).length;

  const setFields = (next: FormField[]) => set({ fields: next });
  const updateField = (index: number, patch: Partial<FormField>) => setFields(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  const changeType = (index: number, value: string) => {
    const current = fields[index];
    if (value === 'select_division') return updateField(index, { type: 'select', source: 'divisions', options: [], rawOptions: undefined });
    const needsOptions = DEFAULT_OPTIONS[value] && !(current.options && current.options.length > 0);
    updateField(index, {
      type: value, source: undefined,
      ...(needsOptions ? { options: DEFAULT_OPTIONS[value], rawOptions: DEFAULT_OPTIONS[value].join(', ') } : {})
    });
  };

  const toggleUnique = (index: number, next: boolean) => {
    const field = fields[index];
    if (next) {
      // Existing answers must already be unique before the rule can be switched on
      const counts: Record<string, number> = {};
      submissions.filter((s) => s.formId === item.id).forEach((s) => {
        const raw = s.data?.[field.id];
        if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
          const key = String(raw).trim().toLowerCase();
          counts[key] = (counts[key] || 0) + 1;
        }
      });
      const duplicates = Object.entries(counts).filter(([, count]) => count > 1);
      if (duplicates.length > 0) {
        toast(`Validasi unik untuk "${field.label}" belum bisa diaktifkan: ${duplicates.length} jawaban sudah dipakai lebih dari satu pendaftar `
          + `(${duplicates.slice(0, 5).map(([v, c]) => `"${v}" ×${c}`).join(', ')}${duplicates.length > 5 ? ', …' : ''}). Hapus data ganda di tab Data pendaftaran terlebih dahulu.`, 'error');
        return;
      }
    }
    updateField(index, { isUnique: next });
  };

  const removeField = async (index: number) => {
    const field = fields[index];
    if (submissionCount > 0) {
      const ok = await confirm({
        title: `Hapus pertanyaan "${field.label}"?`,
        message: `Formulir ini sudah memiliki ${submissionCount} pendaftar. Jawaban yang sudah ada tetap tersimpan, tetapi pertanyaan ini tidak muncul lagi bagi pendaftar baru.`,
        confirmLabel: 'Hapus pertanyaan',
        danger: true
      });
      if (!ok) return;
    }
    setFields(fields.filter((_, i) => i !== index));
  };

  const endDrag = () => { setDraggedFieldIndex(null); setDragOverFieldIndex(null); };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Judul" required><Input {...bind('title')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kategori" required>
          <Select value={item.category || 'Kegiatan & Event'} onChange={(e) => set({ category: e.target.value })}>
            {FORM_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
        <Field label="Batas waktu (WIB)" required
          hint={item.deadline ? `Tampil di web: ${formatDeadlineWib(item.deadline)}` : 'Pilih tanggal dan jam batas akhir.'}>
          <Input type="datetime-local" step="1" value={toDatetimeLocalSecondsValue(item.deadline || '')} onChange={(e) => set({ deadline: e.target.value })} />
        </Field>
      </div>
      <Field label="Subjudul"><Textarea rows={2} {...bind('subtitle')} /></Field>
      <Field label="Pesan setelah mengirim" hint="Ditampilkan kepada peserta setelah berhasil mengirim formulir, misalnya tautan grup WhatsApp. Tautan dapat diklik.">
        <Textarea rows={3} placeholder="Contoh: Terima kasih! Silakan bergabung ke grup peserta: https://chat.whatsapp.com/…" {...bind('notes')} />
      </Field>
      <Field label="Periode" required hint='Pertanyaan "Dropdown divisi" menampilkan divisi dari periode ini.'>
        <Select value={tenureId} onChange={(e) => {
          const next = e.target.value;
          const keepEvent = Boolean(item.eventId) && eventTenure(item.eventId) === next;
          set({ tenureId: next, eventId: keepEvent ? item.eventId : '', isEventConnected: keepEvent ? Boolean(item.isEventConnected) : false });
          if (!keepEvent && item.eventId) showToast('Periode formulir diubah, jadi hubungan ke acara lama dilepas.', 'info');
        }}>
          {tenures.map((t) => <option key={t.id} value={t.id}>{t.title || `Kepengurusan ${t.code}`}{t.id === activeTenure?.id ? ' (aktif)' : ''}</option>)}
        </Select>
      </Field>

      <CheckField checked={item.requiresTracking !== false} onChange={(checked) => set({ requiresTracking: checked })}
        label="Pendaftar bisa melacak status"
        description={item.requiresTracking !== false ? 'Pendaftar mencari status lewat ID pendaftaran atau pertanyaan yang ditandai sebagai indeks pencarian.' : 'Formulir biasa tanpa pelacakan status.'} />
      <CheckField checked={Boolean(item.showAnnouncement)} onChange={(checked) => set({ showAnnouncement: checked })}
        label="Umumkan peserta yang diterima"
        description={item.showAnnouncement ? 'Nama pendaftar berstatus "Diterima" tampil di halaman formulir.' : 'Hasil seleksi tidak diumumkan ke publik.'} />
      <CheckField checked={Boolean(item.isLimited)} onChange={(checked) => set({ isLimited: checked, maxQuota: checked ? (item.maxQuota || 50) : 0 })}
        label="Batasi kuota"
        description={item.isLimited ? 'Formulir tertutup otomatis saat jumlah pendaftar mencapai kuota.' : 'Tanpa batas kuota (hanya dibatasi batas akhir).'} />
      {item.isLimited && (
        <Field label="Kuota maksimal" required className="ml-6 max-w-xs">
          <Input type="number" min="1" placeholder="Contoh: 100" value={item.maxQuota || ''}
            onChange={(e) => set({ maxQuota: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0 })} />
        </Field>
      )}
      <CheckField checked={Boolean(item.isEventConnected)} onChange={(checked) => set({ isEventConnected: checked, eventId: checked ? (item.eventId || '') : '' })}
        label="Hubungkan ke acara"
        description={item.isEventConnected ? 'Formulir ini menggantikan RSVP pada acara terkait, dan pendaftarnya masuk statistik serta undian acara.' : 'Formulir mandiri yang tidak terikat ke acara.'} />
      {item.isEventConnected && (
        <div className="ml-6 flex flex-col gap-3">
          <Field label="Acara" required error={selectableEvents.length === 0 ? 'Belum ada acara pada periode ini.' : undefined}>
            <Select value={item.eventId || ''} onChange={(e) => set({ eventId: e.target.value })}>
              <option value="">Pilih acara</option>
              {selectableEvents.map((evt) => {
                const linked = forms.find((f) => f.id !== item.id && isFormConnectedToEvent(f, evt.id));
                const when = evt.startDate ? formatToIndonesianDate(String(evt.startDate).split('T')[0]) : (evt.date || 'tanpa tanggal');
                return <option key={evt.id} value={evt.id}>{evt.title} ({when}){linked ? ` · terhubung ke "${linked.title}"` : ''}</option>;
              })}
            </Select>
          </Field>
          {takeoverForm && (
            <p className="m-0 rounded-md border border-gold-line bg-gold-tint px-3.5 py-2.5 text-[0.84rem] leading-relaxed text-ink">
              <strong>Pengalihan hubungan acara.</strong> Acara ini sedang terhubung ke formulir <strong>“{takeoverForm.title}”</strong>. Saat disimpan,
              hubungannya pindah ke formulir ini dan “{takeoverForm.title}” menjadi formulir mandiri; data pendaftarnya tidak terhapus.
            </p>
          )}
          <CheckField checked={item.isLuckyDraw === true} onChange={(checked) => set({ isLuckyDraw: checked })}
            label="Ada undian doorprize"
            description={item.isLuckyDraw ? 'Halaman statistik acara menampilkan modul undian doorprize.' : 'Halaman statistik hanya menampilkan analitik pendaftar.'} />
        </div>
      )}

      <section aria-label="Pertanyaan formulir" className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-[0.95rem] font-semibold text-ink">Pertanyaan ({fields.length})</h3>
            <p className="m-0 text-[0.8rem] text-dim">Seret pegangan atau gunakan tombol panah untuk mengatur urutan.</p>
          </div>
          <Button size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />}
            onClick={() => setFields([...fields, { id: 'f-custom-' + Date.now(), label: 'Pertanyaan baru', type: 'text', placeholder: 'Masukkan jawaban…', required: false, isSearchIndex: false, isUnique: false }])}>
            Tambah pertanyaan
          </Button>
        </div>

        <ol className="m-0 flex max-h-[420px] list-none flex-col gap-2 overflow-y-auto p-0 pr-1">
          {fields.map((fld, idx) => {
            const isDragging = draggedFieldIndex === idx;
            const isDropTarget = dragOverFieldIndex === idx && !isDragging;
            const hasOptions = (fld.type === 'select' || fld.type === 'radio') && fld.source !== 'divisions';
            return (
              <li key={fld.id || idx} draggable
                onDragStart={(e) => { setDraggedFieldIndex(idx); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)); }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverFieldIndex !== idx) setDragOverFieldIndex(idx); }}
                onDragLeave={() => { if (dragOverFieldIndex === idx) setDragOverFieldIndex(null); }}
                onDrop={(e) => { e.preventDefault(); handleMoveField(draggedFieldIndex ?? Number(e.dataTransfer.getData('text/plain')), idx); endDrag(); }}
                onDragEnd={endDrag}
                className={cn('flex flex-col gap-2 rounded-md border bg-surface p-3 transition-colors',
                  isDropTarget ? 'border-2 border-dashed border-navy-ink bg-navy-tint' : isDragging ? 'border-dashed border-gold opacity-40' : 'border-line')}>
                <div className="flex items-center gap-2">
                  <span className="flex shrink-0 cursor-grab select-none items-center gap-1 text-dim" title="Tahan dan geser untuk mengubah urutan">
                    <GripVertical size={16} aria-hidden="true" /><span className="min-w-5 text-[0.78rem] font-semibold text-gold-ink">#{idx + 1}</span>
                  </span>
                  <span className="flex shrink-0 gap-0.5">
                    <IconButton label={`Pindahkan pertanyaan ${idx + 1} ke atas`} disabled={idx === 0} onClick={() => handleMoveField(idx, idx - 1)}><ArrowUp size={14} aria-hidden="true" /></IconButton>
                    <IconButton label={`Pindahkan pertanyaan ${idx + 1} ke bawah`} disabled={idx === fields.length - 1} onClick={() => handleMoveField(idx, idx + 1)}><ArrowDown size={14} aria-hidden="true" /></IconButton>
                  </span>
                  <Input className="min-w-0 flex-1" aria-label={`Label pertanyaan ${idx + 1}`} placeholder="Label pertanyaan" value={fld.label || ''} onChange={(e) => updateField(idx, { label: e.target.value })} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select aria-label={`Tipe jawaban pertanyaan ${idx + 1}`} className="min-w-[12rem] flex-1"
                    value={fld.type === 'select' && fld.source === 'divisions' ? 'select_division' : (fld.type || 'text')} onChange={(e) => changeType(idx, e.target.value)}>
                    {FIELD_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                  <label className={chip(Boolean(fld.required))}>
                    <input type="checkbox" className="size-4 cursor-pointer" checked={Boolean(fld.required)} onChange={(e) => updateField(idx, { required: e.target.checked })} />Wajib
                  </label>
                  {item.requiresTracking !== false && (
                    <label className={chip(Boolean(fld.isSearchIndex))} title="Pendaftar dapat mencari status pendaftaran dengan jawaban pertanyaan ini (misalnya NIP).">
                      <input type="checkbox" className="size-4 cursor-pointer" checked={Boolean(fld.isSearchIndex)} onChange={(e) => updateField(idx, { isSearchIndex: e.target.checked })} />Indeks pencarian
                    </label>
                  )}
                  <label className={chip(Boolean(fld.isUnique))} title="Jawaban tidak boleh sama dengan pendaftar lain (misalnya NIP, nomor HP, email).">
                    <input type="checkbox" className="size-4 cursor-pointer" checked={Boolean(fld.isUnique)} onChange={(e) => toggleUnique(idx, e.target.checked)} />Jawaban unik
                  </label>
                  <IconButton label={`Hapus pertanyaan ${idx + 1}`} tone="danger" onClick={() => removeField(idx)}><Trash2 size={15} aria-hidden="true" /></IconButton>
                </div>
                {hasOptions && (
                  <Field label="Pilihan jawaban" className="ml-6"
                    hint={fld.options && fld.options.length > 0 ? `Pilihan aktif (${fld.options.length}): ${fld.options.join(' • ')}` : 'Pisahkan pilihan dengan koma, contoh: Opsi 1, Opsi 2.'}>
                    <Input placeholder="Pisahkan dengan koma" value={fld.rawOptions !== undefined ? fld.rawOptions : (fld.options || []).join(', ')}
                      onChange={(e) => updateField(idx, { rawOptions: e.target.value, options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
                  </Field>
                )}
                {fld.type === 'select' && fld.source === 'divisions' && (
                  <p className="m-0 ml-6 flex items-center gap-2 rounded-md border border-info-line bg-info-tint px-3 py-2 text-[0.82rem] text-ink">
                    <Layers size={14} aria-hidden="true" className="shrink-0" />
                    Pilihan diambil otomatis dari {tenureDivisionCount} divisi pada periode {tenure?.title || tenure?.code || 'aktif'}.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
