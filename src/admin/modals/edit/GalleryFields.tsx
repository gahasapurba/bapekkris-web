import { Link2, Plus, Trash2, Upload, X } from 'lucide-react';
import { parseFlexibleDate, buildFlexibleDate } from '../../../utils/dateUtils';
import { soundFx } from '../../../utils/audio';
import { Button, Field, Input, Select, Textarea, cn } from '../../../ui';
import { FlexibleDateField, type FlexibleDateMode, type FlexibleDateValue } from '../../FlexibleDateField';
import { FileButton, IconButton, PendingFile } from '../../AdminUi';
import { useEditBinding } from './useEditBinding';

/** A documentation link attached to a gallery album. */
interface DocLink { text?: string; url?: string }

/** Fields of the edit dialog for `gallery` items. */
export default function GalleryFields() {
  const {
    activeTenure, bind, divisions, editingItem, events, handleAddPhotoLinkToEditModal, handlePhotoUpload, isUploadingMedia, item, set,
    setDeleteConfirm, setEditingItem, showToast, tenures
  } = useEditBinding();

  const tenureId = item.tenureId || activeTenure?.id || '';
  const tenureDivisions = divisions.filter((d) => d.tenureId === tenureId);
  const tenureEvents = events.filter((ev) => !tenureId || ev.tenureId === tenureId);
  const divisionId = item.divisionId || tenureDivisions.find((d) => d.name === item.division)?.id || '';
  const photos: string[] = Array.isArray(item.photos) ? item.photos : [];
  const docLinks: DocLink[] = Array.isArray(item.docLinks) ? item.docLinks : [];
  const parsed = parseFlexibleDate(item.date);
  const dateMode: FlexibleDateMode = item._dateMode || parsed.mode;
  const dateParts: FlexibleDateValue = item._dateParts || {
    date: parsed.date, dates: parsed.dates || [parsed.date], startDate: parsed.startDate, endDate: parsed.endDate, month: parsed.month, year: parsed.year
  };
  const setDate = (mode: FlexibleDateMode, parts: FlexibleDateValue) => set({ _dateMode: mode, _dateParts: parts, date: buildFlexibleDate(mode, parts) });
  const setLinks = (next: DocLink[]) => set({ docLinks: next });
  const photoUrlInput = (editingItem.photoUrlInput || '').trim();

  const removePhoto = (url: string, index: number) => {
    if (photos.length <= 1) {
      soundFx.playError?.();
      showToast('Album wajib memiliki minimal 1 foto, jadi foto terakhir tidak dapat dihapus.', 'error');
      return;
    }
    soundFx.playClick?.();
    setDeleteConfirm({ type: 'gallery_photo', id: url, photoIdx: index, name: `Foto ke-${index + 1}` });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Judul kegiatan" required><Input {...bind('title')} /></Field>
        <Field label="Periode kepengurusan">
          <Select value={tenureId} onChange={(e) => {
            const next = e.target.value;
            const keep = divisions.find((d) => d.tenureId === next && (d.id === item.divisionId || d.name === item.division));
            set({ tenureId: next, divisionId: keep?.id || '', division: keep?.name || '', divisionName: keep?.name || '' });
          }}>
            {tenures.map((t) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
          </Select>
        </Field>
      </div>

      <FlexibleDateField mode={dateMode} value={dateParts}
        onModeChange={(mode) => setDate(mode, dateParts)}
        onChange={(patch) => setDate(dateMode, { ...dateParts, ...patch })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Divisi penyelenggara" required error={tenureDivisions.length === 0 ? 'Periode ini belum memiliki divisi. Buat dulu di tab Divisi.' : undefined}>
          <Select value={divisionId} disabled={tenureDivisions.length === 0} onChange={(e) => {
            const division = tenureDivisions.find((d) => d.id === e.target.value);
            set({ divisionId: e.target.value, division: division?.name || '', divisionName: division?.name || '' });
          }}>
            <option value="">Pilih divisi</option>
            {tenureDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Hubungkan ke acara (opsional)">
          <Select value={item.eventId || ''} onChange={(e) => set({ eventId: e.target.value || null })}>
            <option value="">Tanpa hubungan acara</option>
            {tenureEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.title} ({ev.date || 'tanpa tanggal'})</option>)}
          </Select>
        </Field>
      </div>

      <Field label="Deskripsi kegiatan"><Textarea rows={3} {...bind('description')} /></Field>

      <section aria-label="Foto album" className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[0.92rem] font-semibold text-ink">Foto album ({photos.length})</h3>
          <FileButton icon={<Upload size={15} aria-hidden="true" />} accept="image/*" multiple onChange={handlePhotoUpload}>Pilih foto baru</FileButton>
        </div>
        {editingItem.pendingPhotos && editingItem.pendingPhotos.length > 0 && (
          <PendingFile onCancel={() => setEditingItem({ ...editingItem, pendingPhotos: [], item: { ...item, photos: photos.filter((p) => !p.startsWith('blob:')) } })}>
            <strong>{editingItem.pendingPhotos.length} foto baru</strong> diunggah saat Anda klik Simpan perubahan.
          </PendingFile>
        )}
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {photos.map((url, i) => {
            const last = photos.length <= 1;
            return (
              <li key={`${url}-${i}`} className="relative h-14 w-20 overflow-hidden rounded-md border border-line">
                <img src={url} alt={`Foto ke-${i + 1}`} className="size-full object-cover" />
                <button type="button" onClick={() => removePhoto(url, i)} aria-disabled={last}
                  aria-label={last ? 'Foto terakhir tidak dapat dihapus' : `Hapus foto ke-${i + 1}`}
                  className={cn('absolute right-1 top-1 flex size-5 cursor-pointer items-center justify-center rounded-full border-0 text-white', last ? 'cursor-not-allowed bg-dim opacity-70' : 'bg-danger')}>
                  <X size={12} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex flex-col gap-2 rounded-md border border-line bg-subtle p-3">
          <label htmlFor="edit-gallery-photo-links" className="flex items-center gap-1.5 text-[0.84rem] font-semibold text-ink"><Link2 size={14} aria-hidden="true" className="text-gold-ink" />Atau tambah foto lewat tautan</label>
          <div className="flex flex-wrap items-start gap-2">
            <Textarea id="edit-gallery-photo-links" rows={2} className="min-w-0 flex-1" placeholder={'https://…/foto-1.jpg\nhttps://…/foto-2.png'}
              value={editingItem.photoUrlInput || ''} onChange={(e) => setEditingItem({ ...editingItem, photoUrlInput: e.target.value })} />
            <Button size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />} loading={isUploadingMedia} disabled={!photoUrlInput} onClick={handleAddPhotoLinkToEditModal}>Tambah tautan</Button>
          </div>
          <p className="m-0 text-[0.78rem] text-dim">Tautan diperiksa dulu sebelum masuk album. Pisahkan beberapa tautan dengan baris baru.</p>
        </div>
      </section>

      <section aria-label="Tautan dokumentasi" className="flex flex-col gap-3 border-t border-line pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-[0.92rem] font-semibold text-ink">Tautan dokumentasi / Google Drive ({docLinks.length})</h3>
          <Button size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />} onClick={() => setLinks([...docLinks, { text: 'Dokumentasi Google Drive', url: '' }])}>Tambah tautan</Button>
        </div>
        {docLinks.map((link, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input className="min-w-0 flex-1" aria-label={`Label tautan ${i + 1}`} placeholder="Label tombol" value={link.text || ''}
              onChange={(e) => setLinks(docLinks.map((l, j) => (j === i ? { ...l, text: e.target.value } : l)))} />
            <Input className="min-w-0 flex-[2]" type="url" aria-label={`Alamat tautan ${i + 1}`} placeholder="https://drive.google.com/…" value={link.url || ''}
              onChange={(e) => setLinks(docLinks.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))} />
            <IconButton label={`Hapus tautan ${i + 1}`} tone="danger" onClick={() => setLinks(docLinks.filter((_, j) => j !== i))}><Trash2 size={15} aria-hidden="true" /></IconButton>
          </div>
        ))}
      </section>
    </div>
  );
}
