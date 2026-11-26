import { Field, Input, Select, Textarea } from '../../../ui';
import { useEditBinding } from './useEditBinding';

const DEFAULT_COLOR = '#0284c7';

/** Fields of the edit dialog for `division` items. */
export default function DivisionFields() {
  const { activeTenure, bind, item, set, tenures } = useEditBinding();
  const focusText = item.rawFocusAreas !== undefined ? item.rawFocusAreas : Array.isArray(item.focusAreas) ? item.focusAreas.join(', ') : '';
  const focusAreas: string[] = Array.isArray(item.focusAreas) ? item.focusAreas : [];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama divisi" required><Input {...bind('name')} /></Field>
        <Field label="Periode">
          <Select value={item.tenureId || activeTenure?.id || ''} onChange={(e) => set({ tenureId: e.target.value })}>
            {tenures.map((t) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
          </Select>
        </Field>
        <Field label="Status rekrutmen (publik)">
          <Select value={item.isRecruiting ? 'open' : 'closed'} onChange={(e) => set({ isRecruiting: e.target.value === 'open' })}>
            <option value="open">Membuka rekrutmen</option>
            <option value="closed">Ditutup (lencana tidak tampil di web)</option>
          </Select>
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.84rem] font-semibold text-muted">Warna identitas divisi</span>
          <div className="flex items-center gap-2">
            <input type="color" aria-label="Pilih warna divisi" value={item.color || DEFAULT_COLOR} onChange={(e) => set({ color: e.target.value })}
              className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-field-line bg-field p-1" />
            <Input aria-label="Kode warna divisi (hex)" className="min-w-0 flex-1" value={item.color || DEFAULT_COLOR} onChange={(e) => set({ color: e.target.value })} />
          </div>
        </div>
      </div>
      <Field label="Motto divisi"><Input {...bind('motto')} /></Field>
      <Field label="Deskripsi tugas"><Textarea rows={3} {...bind('description')} /></Field>
      <Field label="Fokus program" hint={focusAreas.length > 0 ? `Fokus aktif (${focusAreas.length}): ${focusAreas.join(' • ')}` : 'Pisahkan dengan koma, contoh: Liturgi, Musik, Multimedia.'}>
        <Input placeholder="Contoh: Liturgi, Musik, Multimedia" value={focusText}
          onChange={(e) => set({ rawFocusAreas: e.target.value, focusAreas: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
      </Field>
    </div>
  );
}
