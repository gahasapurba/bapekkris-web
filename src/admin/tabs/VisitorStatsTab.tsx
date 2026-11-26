import { useMemo, useState } from 'react';
import { usePageViewStats } from '../../lib/analytics';
import { NAV_ITEMS } from '../../components/layout/navItems';
import { formatToIndonesianDate, toWibIsoDate } from '../../utils/dateUtils';
import { AdminEmpty, AdminPanel, FilterSelect } from '../AdminUi';

const PAGE_LABELS: Record<string, string> = Object.fromEntries([...NAV_ITEMS.map((n) => [n.id, n.label]), ['form', 'Registrasi & Formulir']]);
const RANGES = [7, 30, 90] as const;
const nf = new Intl.NumberFormat('id-ID');
const nf1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

/** Rounds the axis maximum up to a "nice" even number so the midline is a whole number too. */
export function niceAxisMax(max: number): number {
  if (max <= 2) return 2;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const step = [1, 2, 4, 5, 10].map((m) => m * magnitude).find((v) => v >= max) || 10 * magnitude;
  return step % 2 === 0 ? step : step + 1;
}

function lastDays(count: number): string[] {
  const today = toWibIsoDate();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - (count - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

const shortDate = (iso: string) => new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

/** Super-admin view of daily page visits (counts only; no visitor data is collected). */
export default function VisitorStatsTab() {
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const { data: rows = [], isLoading, isError } = usePageViewStats(days);
  const [hovered, setHovered] = useState<number | null>(null);

  const { daily, pages, total, max } = useMemo(() => {
    const byDay = new Map<string, number>();
    const byPage = new Map<string, number>();
    rows.forEach((r) => {
      byDay.set(r.day, (byDay.get(r.day) || 0) + r.views);
      byPage.set(r.page, (byPage.get(r.page) || 0) + r.views);
    });
    const series = lastDays(days).map((day) => ({ day, views: byDay.get(day) || 0 }));
    const ranked = [...byPage.entries()].sort((a, b) => b[1] - a[1]).map(([page, views]) => ({ page, views }));
    const sum = series.reduce((n, d) => n + d.views, 0);
    return { daily: series, pages: ranked, total: sum, max: niceAxisMax(Math.max(...series.map((d) => d.views))) };
  }, [rows, days]);

  const busiest = daily.reduce((best, d) => (d.views > best.views ? d : best), daily[0] || { day: '', views: 0 });

  return (
    <AdminPanel title="Statistik pengunjung"
      description="Jumlah kunjungan halaman publik per hari (WIB). Satu kunjungan dihitung sekali per halaman per sesi browser; admin yang sedang masuk tidak dihitung. Tidak ada cookie atau data pribadi yang disimpan."
      actions={(
        <FilterSelect value={String(days)} onChange={(v) => setDays(Number(v) as (typeof RANGES)[number])} label="Rentang waktu">
          {RANGES.map((r) => <option key={r} value={r}>{r} hari terakhir</option>)}
        </FilterSelect>
      )}>
      {isLoading ? <AdminEmpty>Memuat statistik…</AdminEmpty> : isError ? <AdminEmpty>Statistik gagal dimuat.</AdminEmpty> : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: `Kunjungan (${days} hari)`, value: nf.format(total) },
              { label: 'Rata-rata per hari', value: nf1.format(total / days) },
              { label: 'Hari tersibuk', value: busiest.views > 0 ? `${shortDate(busiest.day)} · ${nf.format(busiest.views)}` : '—' }
            ].map((s) => (
              <div key={s.label} className="rounded-md border border-line bg-surface px-4 py-3">
                <p className="text-[0.76rem] font-semibold uppercase tracking-wide text-dim">{s.label}</p>
                <p className="mt-1 font-display text-[1.6rem] font-semibold leading-tight text-ink">{s.value}</p>
              </div>
            ))}
          </div>

          <section aria-labelledby="visits-chart-title" className="rounded-md border border-line bg-surface p-4">
            <h3 id="visits-chart-title" className="text-[0.98rem] font-semibold text-ink">Kunjungan harian</h3>
            {total === 0 ? <p className="py-10 text-center text-[0.9rem] text-muted">Belum ada kunjungan tercatat pada rentang ini.</p> : (
              <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
                <div className="flex h-48 flex-col justify-between text-right text-[0.72rem] text-dim" aria-hidden="true">
                  <span>{nf.format(max)}</span><span>{nf.format(max / 2)}</span><span>0</span>
                </div>
                <div className="relative h-48">
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                    <div className="border-t border-dashed border-line" /><div className="border-t border-dashed border-line" /><div className="border-t border-line" />
                  </div>
                  <ul aria-label="Kunjungan per hari" className="relative m-0 flex h-full list-none items-end gap-[2px] p-0" onMouseLeave={() => setHovered(null)}>
                    {daily.map((d, i) => (
                      <li key={d.day} tabIndex={0} aria-label={`${formatToIndonesianDate(d.day)}: ${nf.format(d.views)} kunjungan`}
                        onMouseEnter={() => setHovered(i)} onFocus={() => setHovered(i)} onBlur={() => setHovered(null)}
                        className="relative flex h-full min-w-0 flex-1 cursor-default items-end outline-none focus-visible:outline-2 focus-visible:outline-navy-ink">
                        <div className="w-full rounded-t-[4px] bg-chart-1 transition-opacity" style={{ height: d.views > 0 ? `max(2px, ${(d.views / max) * 100}%)` : 0, opacity: hovered === null || hovered === i ? 1 : 0.45 }} />
                        {hovered === i && (
                          <div role="tooltip" className={`pointer-events-none absolute bottom-[calc(100%+6px)] z-10 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-[0.78rem] shadow-card ${i > daily.length / 2 ? 'right-0' : 'left-0'}`}>
                            <span className="block font-semibold text-ink">{nf.format(d.views)} kunjungan</span>
                            <span className="text-muted">{formatToIndonesianDate(d.day)}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div />
                <div className="mt-1.5 flex justify-between text-[0.72rem] text-dim" aria-hidden="true">
                  <span>{shortDate(daily[0].day)}</span><span>{shortDate(daily[Math.floor(daily.length / 2)].day)}</span><span>{shortDate(daily[daily.length - 1].day)}</span>
                </div>
              </div>
            )}
          </section>

          <section aria-labelledby="top-pages-title" className="rounded-md border border-line bg-surface p-4">
            <h3 id="top-pages-title" className="text-[0.98rem] font-semibold text-ink">Halaman terpopuler</h3>
            {pages.length === 0 ? <p className="py-6 text-center text-[0.9rem] text-muted">Belum ada data.</p> : (
              <table className="mt-3 w-full border-collapse text-[0.88rem]">
                <thead>
                  <tr className="text-left text-[0.74rem] uppercase tracking-wide text-dim">
                    <th scope="col" className="pb-2 font-semibold">Halaman</th>
                    <th scope="col" className="w-1/2 pb-2 font-semibold"><span className="sr-only">Proporsi</span></th>
                    <th scope="col" className="pb-2 text-right font-semibold">Kunjungan</th>
                    <th scope="col" className="pb-2 pl-3 text-right font-semibold">Porsi</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr key={p.page} className="border-t border-line">
                      <th scope="row" className="py-2 pr-3 text-left font-medium text-ink">{PAGE_LABELS[p.page] || p.page}</th>
                      <td className="py-2" aria-hidden="true">
                        <div className="h-2 rounded-r-[4px] bg-chart-1" style={{ width: `${(p.views / pages[0].views) * 100}%` }} />
                      </td>
                      <td className="py-2 text-right tabular-nums text-ink">{nf.format(p.views)}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-muted">{total ? `${Math.round((p.views / total) * 100)}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </AdminPanel>
  );
}
