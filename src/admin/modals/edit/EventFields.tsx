import { formatWibEventRange, toDatetimeLocalValue } from '../../../utils/dateUtils';
import { Field, Input, Select, Textarea } from '../../../ui';
import { EVENT_CATEGORIES } from '../../adminConstants';
import { CheckField, Switch } from '../../AdminUi';
import { useEditBinding } from './useEditBinding';

const ORDER_ERROR = 'Tanggal & jam mulai tidak boleh melebihi tanggal & jam berakhir.';
const numberOrBlank = (v: string) => (v === '' ? '' : Number(v));

/** Fields of the edit dialog for `event` items. */
export default function EventFields() {
  const { activeTenure, bind, divisions, item, set, setEditModalError, tenures } = useEditBinding();
  const start = toDatetimeLocalValue(item.startDate);
  const end = toDatetimeLocalValue(item.endDate);
  const orderInvalid = Boolean(start && end && start > end);
  const tenureId = item.tenureId || activeTenure?.id || '';
  const tenureDivisions = divisions.filter((d) => d.tenureId === tenureId);
  const category = item.kategori || item.category || item.badge || '';
  const customCategory = category && !EVENT_CATEGORIES.includes(category);

  const setSchedule = (nextStart: string, nextEnd: string) => {
    const s = toDatetimeLocalValue(nextStart);
    const e = toDatetimeLocalValue(nextEnd);
    setEditModalError(s && e && s > e ? ORDER_ERROR : '');
    set({ startDate: nextStart, endDate: nextEnd, date: formatWibEventRange(nextStart, nextEnd || nextStart) });
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Nama acara" required><Input {...bind('title')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai (WIB)" required error={orderInvalid ? ORDER_ERROR : undefined}>
          <Input type="datetime-local" value={start} max={end || undefined} onChange={(e) => setSchedule(e.target.value, item.endDate || '')} />
        </Field>
        <Field label="Berakhir (WIB)" required>
          <Input type="datetime-local" value={end} min={start || undefined} onChange={(e) => setSchedule(item.startDate || e.target.value, e.target.value)} />
        </Field>
      </div>
      <p className="m-0 rounded-md border border-info-line bg-info-tint px-3.5 py-2 text-[0.84rem] text-ink">
        Tampil di web sebagai <strong>{formatWibEventRange(item.startDate, item.endDate, item.date || 'belum ditentukan')}</strong>
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Periode kepengurusan">
          <Select value={tenureId} onChange={(e) => {
            const next = e.target.value;
            const keep = divisions.some((d) => d.tenureId === next && d.id === item.divisionId);
            set({ tenureId: next, divisionId: keep ? item.divisionId : '', divisionName: keep ? item.divisionName : '' });
          }}>
            {tenures.map((t) => <option key={t.id} value={t.id}>{t.title || t.code} ({t.code})</option>)}
          </Select>
        </Field>
        <Field label="Divisi penyelenggara" error={tenureDivisions.length === 0 ? 'Periode ini belum memiliki divisi. Buat dulu di tab Divisi.' : undefined}>
          <Select value={item.divisionId || ''} disabled={tenureDivisions.length === 0} onChange={(e) => {
            const division = tenureDivisions.find((d) => d.id === e.target.value);
            set({ divisionId: e.target.value, divisionName: division?.name || item.divisionName || '' });
          }}>
            <option value="">Pilih divisi</option>
            {tenureDivisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Status pelaksanaan">
          <Select value={item.status || 'Upcoming'} onChange={(e) => set({ status: e.target.value })}>
            <option value="Upcoming">Akan datang</option>
            <option value="Ongoing">Sedang berjalan</option>
            <option value="Completed">Selesai</option>
          </Select>
        </Field>
        <Field label="Estimasi total RAB (Rp)" required>
          <Input type="number" min="0" placeholder="Contoh: 15000000" value={item.totalRab ?? ''} onChange={(e) => set({ totalRab: numberOrBlank(e.target.value) })} />
        </Field>
        <Field label="Lokasi"><Input {...bind('location')} /></Field>
        <Field label="Peserta">
          <Input placeholder="Contoh: 150+ jemaat" value={item.peserta ?? item.kpi ?? ''} onChange={(e) => set({ peserta: e.target.value, kpi: e.target.value })} />
        </Field>
      </div>

      <Field label="Kategori kegiatan" required>
        <Select value={category} onChange={(e) => set({ kategori: e.target.value, category: e.target.value, badge: e.target.value })}>
          <option value="">Pilih kategori</option>
          {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          {customCategory && <option value={category}>{category}</option>}
        </Select>
      </Field>
      <Field label="Deskripsi kegiatan"><Textarea rows={3} {...bind('description')} /></Field>

      <CheckField checked={Boolean(item.isLimited)} onChange={(checked) => set({ isLimited: checked })}
        label="Batasi kuota RSVP acara ini" description="RSVP ditutup otomatis ketika jumlah pendaftar mencapai batas." />
      {item.isLimited && (
        <Field label="Kuota maksimal peserta" required className="ml-6 max-w-xs">
          <Input type="number" min="1" placeholder="Contoh: 100" value={item.maxQuota ?? ''} onChange={(e) => set({ maxQuota: numberOrBlank(e.target.value) })} />
        </Field>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface p-3">
        <div className="min-w-0">
          <p className="m-0 text-[0.88rem] font-semibold text-ink">{item.isPublic ? 'Tampil di web publik' : 'Draf (hanya terlihat di Admin Portal)'}</p>
          <p className="m-0 text-[0.82rem] text-muted">Acara draf tidak terlihat oleh pengunjung.</p>
        </div>
        <Switch checked={Boolean(item.isPublic)} onChange={(checked) => set({ isPublic: checked })} label="Publikasikan acara" />
      </div>
    </div>
  );
}
