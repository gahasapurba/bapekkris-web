import { Plus, Trash2 } from 'lucide-react';
import { buildFlexibleDate, formatWibDateTime, toWibIsoDate } from '../utils/dateUtils';
import { Button, Input, cn } from '../ui';
import { IconButton } from './AdminUi';

export type FlexibleDateMode = 'date' | 'dates' | 'range' | 'month' | 'year';
export interface FlexibleDateValue { date: string; dates: string[]; startDate: string; endDate: string; month: string; year: string }

const MODES: { id: FlexibleDateMode; label: string }[] = [
  { id: 'date', label: 'Satu tanggal' },
  { id: 'dates', label: 'Beberapa tanggal' },
  { id: 'range', label: 'Rentang' },
  { id: 'month', label: 'Bulan' },
  { id: 'year', label: 'Tahun' }
];

/** Date input that can hold one date, several dates, a range, a month or just a year. */
export function FlexibleDateField({ mode, onModeChange, value, onChange, label = 'Waktu pelaksanaan' }: {
  mode: FlexibleDateMode; onModeChange: (m: FlexibleDateMode) => void; value: FlexibleDateValue; onChange: (patch: Partial<FlexibleDateValue>) => void; label?: string;
}) {
  const preview = formatWibDateTime(buildFlexibleDate(mode, value));
  return (
    <fieldset className="flex min-w-0 flex-col gap-3 rounded-md border border-line bg-surface p-3">
      <legend className="px-1 text-[0.86rem] font-semibold text-ink">{label}</legend>
      <div role="radiogroup" aria-label="Format tanggal" className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => onModeChange(m.id)}
            className={cn('inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-[0.8rem] font-semibold',
              mode === m.id ? 'border-action bg-action text-on-action' : 'border-line bg-transparent text-muted hover:text-ink')}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'date' && <Input type="date" aria-label="Tanggal" value={value.date} onChange={(e) => onChange({ date: e.target.value })} />}
      {mode === 'dates' && (
        <div className="flex flex-col gap-2">
          {value.dates.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[0.8rem] text-muted">Hari ke-{i + 1}</span>
              <Input type="date" aria-label={`Tanggal hari ke-${i + 1}`} value={d} className="min-w-0 flex-1" onChange={(e) => { const next = [...value.dates]; next[i] = e.target.value; onChange({ dates: next }); }} />
              {value.dates.length > 1 && <IconButton label={`Hapus hari ke-${i + 1}`} tone="danger" onClick={() => onChange({ dates: value.dates.filter((_, j) => j !== i) })}><Trash2 size={15} aria-hidden="true" /></IconButton>}
            </div>
          ))}
          <div><Button type="button" size="sm" variant="secondary" icon={<Plus size={14} aria-hidden="true" />} onClick={() => onChange({ dates: [...value.dates, toWibIsoDate()] })}>Tambah tanggal</Button></div>
        </div>
      )}
      {mode === 'range' && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1 text-[0.8rem] text-muted">Mulai<Input type="date" value={value.startDate} onChange={(e) => onChange({ startDate: e.target.value })} /></label>
          <label className="flex flex-col gap-1 text-[0.8rem] text-muted">Selesai<Input type="date" value={value.endDate} onChange={(e) => onChange({ endDate: e.target.value })} /></label>
        </div>
      )}
      {mode === 'month' && <Input type="month" aria-label="Bulan" value={value.month} onChange={(e) => onChange({ month: e.target.value })} />}
      {mode === 'year' && <Input type="number" aria-label="Tahun" min={2000} max={2099} placeholder="Contoh: 2026" value={value.year} onChange={(e) => onChange({ year: e.target.value })} />}
      <p className="text-[0.8rem] text-muted">Tampil di situs: <strong className="text-ink">{preview || '—'}</strong></p>
    </fieldset>
  );
}
