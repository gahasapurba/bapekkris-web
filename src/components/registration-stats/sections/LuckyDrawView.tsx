import { Award, ChevronDown, ChevronUp, ChevronsUpDown, Clock, Download, Gift, RotateCcw, Search, Sparkles, Trash2, Trophy } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { Badge, Button, Field, Input, Pagination, Select, cn } from '../../../ui';
import { useRegistrationStats } from '../RegistrationStatsContext';

const selectClass = 'h-10 max-w-full cursor-pointer rounded-full border border-line bg-surface pl-3.5 pr-3 text-[0.84rem] font-medium text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink';

export default function LuckyDrawView() {
  const {
    allCandidates, connectedForm, formFields, countdown, drawCount, dropdownFields, eligiblePool, eventWinners, filteredWinners, getDropdownOptions,
    handleDrawCountChange, handleExportWinnersCsv, handleResetWinnerFilters, handleRunLuckyDraw, handleWinnerHeaderSort, hasActiveWinnerFilters,
    isRolling, paginatedWinners, prizeName, rollingName, selectedDrawFieldId, setPrizeName, setResetConfirmOpen, setSelectedDrawFieldId,
    setWinnerCurrentPage, setWinnerDropdownFilters, setWinnerPageSize, setWinnerPrizeFilter, setWinnerSearchQuery, setWinnerToDelete,
    totalFilteredWinners, totalWinnerPages, uniquePrizeNames, winnerCurrentPage, winnerDropdownFilters, winnerPageSize, winnerPrizeFilter,
    winnerSearchPlaceholder, winnerSearchQuery, winnerSortConfig
  } = useRegistrationStats();

  const sortHeader = (key: string, label: string) => {
    const active = winnerSortConfig.key === key;
    return (
      <th key={key} scope="col" aria-sort={active ? (winnerSortConfig.direction === 'asc' ? 'ascending' : 'descending') : undefined} className="whitespace-nowrap px-3 py-3 font-semibold">
        <button type="button" onClick={() => handleWinnerHeaderSort(key)} className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 [font:inherit] [color:inherit] hover:text-ink">
          {label}
          {active ? (winnerSortConfig.direction === 'asc' ? <ChevronUp size={14} aria-hidden="true" className="text-gold-ink" /> : <ChevronDown size={14} aria-hidden="true" className="text-gold-ink" />) : <ChevronsUpDown size={13} aria-hidden="true" className="text-dim" />}
        </button>
      </th>
    );
  };
  const stat = (label: string, value: number, tone: string) => (
    <div className={cn('min-w-[110px] rounded-lg border px-4 py-2 text-center', tone)}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-wide">{label}</p>
      <p className="font-display text-[1.4rem] font-semibold leading-tight">{value}</p>
    </div>
  );
  const firstRow = totalFilteredWinners > 0 ? (winnerPageSize === 'all' ? 1 : (winnerCurrentPage - 1) * winnerPageSize + 1) : 0;
  const lastRow = winnerPageSize === 'all' ? totalFilteredWinners : Math.min(winnerCurrentPage * winnerPageSize, totalFilteredWinners);

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="draw-title" className="flex flex-col gap-6 rounded-xl border border-line bg-surface p-5 shadow-card md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-gold-ink"><Trophy size={14} aria-hidden="true" />Doorprize</p>
            <h2 id="draw-title" className="mt-1 font-display text-[1.6rem] font-semibold text-ink">Undian doorprize</h2>
            <p className="text-[0.88rem] text-muted">Kandidat diambil hanya dari pendaftar formulir acara ini.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stat('Pendaftar', allCandidates.length, 'border-line bg-subtle text-ink')}
            {stat('Sudah menang', eventWinners.length, 'border-gold-line bg-gold-tint text-ink')}
            {stat('Siap diundi', eligiblePool.length, 'border-success-line bg-success-tint text-ink')}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nama hadiah / sesi">
            <Input value={prizeName} onChange={(e) => setPrizeName(e.target.value)} placeholder="Contoh: Hadiah utama" />
          </Field>
          <Field label="Jumlah pemenang kali ini" hint={`Maksimal ${eligiblePool.length} (yang belum menang)`}>
            <Input type="number" min={1} max={Math.max(1, eligiblePool.length)} value={drawCount} onChange={(e) => handleDrawCountChange(e.target.value)} />
          </Field>
          <Field label="Data yang diacak di layar" hint="Nilai pertanyaan ini yang muncul saat pengundian.">
            <Select value={selectedDrawFieldId} onChange={(e) => setSelectedDrawFieldId(e.target.value)}>
                {formFields.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </Select>
          </Field>
        </div>

        <div className={cn('relative flex flex-col items-center rounded-xl border-2 bg-[#0b1424] px-5 py-10 text-center text-white md:py-14', isRolling ? 'border-[#e3b341]' : 'border-dashed border-[rgba(227,179,65,0.45)]')}>
          {isRolling && (
            <span className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[rgba(227,179,65,0.15)] px-3 py-1 text-[0.84rem] font-semibold text-[#e3b341]" aria-live="off">
              <Clock size={14} aria-hidden="true" />{countdown} dtk
            </span>
          )}
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-[#e3b341]">
            {isRolling ? 'Mengacak pendaftar…' : <span className="inline-flex items-center gap-1.5"><Gift size={14} aria-hidden="true" />{prizeName}</span>}
          </p>
          <p className="mt-4 max-w-full break-words font-display text-[clamp(1.8rem,6vw,3.6rem)] font-semibold leading-tight" aria-live="polite">
            {isRolling ? rollingName : (eligiblePool.length === 0 ? 'Semua pendaftar sudah menang' : 'Siap mengundi')}
          </p>
          <p className="mt-3 text-[0.9rem] text-[rgba(255,255,255,0.72)]">{eligiblePool.length} kandidat siap diundi</p>
          <Button variant="gold" size="lg" className="mt-7" loading={isRolling} disabled={isRolling || eligiblePool.length === 0}
            icon={<Sparkles size={18} aria-hidden="true" />} onClick={handleRunLuckyDraw}>
            {isRolling ? `Mengundi (${countdown} dtk)` : `Undi ${drawCount} pemenang`}
          </Button>
        </div>
      </section>

      <section aria-labelledby="winners-title" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-card md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="winners-title" className="inline-flex items-center gap-2 font-display text-[1.25rem] font-semibold text-ink"><Award size={19} aria-hidden="true" className="text-gold-ink" />Daftar pemenang ({filteredWinners.length})</h2>
            <p className="text-[0.84rem] text-muted">Cari, saring per hadiah, dan urutkan pemenang.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={handleExportWinnersCsv} disabled={eventWinners.length === 0}>Ekspor CSV</Button>
            {eventWinners.length > 0 && <Button size="sm" variant="danger" icon={<RotateCcw size={13} aria-hidden="true" />} onClick={() => setResetConfirmOpen(true)}>Reset semua pemenang</Button>}
          </div>
        </div>

        {eventWinners.length > 0 ? (
          <>
            <div className="flex flex-wrap items-center gap-2 border-y border-line py-3">
              <div className="relative min-w-[200px] flex-1">
                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
                <Input type="search" aria-label="Cari pemenang" placeholder={winnerSearchPlaceholder} value={winnerSearchQuery} onChange={(e) => setWinnerSearchQuery(e.target.value)} className="w-full rounded-full pl-10" />
              </div>
              {uniquePrizeNames.length > 1 && (
                <select aria-label="Saring hadiah" value={winnerPrizeFilter} onChange={(e) => setWinnerPrizeFilter(e.target.value)} className={selectClass}>
                  <option value="ALL">Semua hadiah</option>
                  {uniquePrizeNames.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              )}
              {dropdownFields.map((df) => (
                <select key={df.id} aria-label={`Saring ${df.label}`} value={winnerDropdownFilters[df.id] || 'ALL'} onChange={(e) => setWinnerDropdownFilters((prev) => ({ ...prev, [df.id]: e.target.value }))} className={selectClass}>
                  <option value="ALL">Semua {df.label}</option>
                  {getDropdownOptions(df).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              ))}
              {hasActiveWinnerFilters && <Button size="sm" variant="ghost" icon={<RotateCcw size={13} aria-hidden="true" />} onClick={handleResetWinnerFilters}>Reset filter</Button>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[0.86rem]">
                <thead>
                  <tr className="border-b border-line text-[0.78rem] uppercase tracking-wide text-dim">
                    {sortHeader('drawNumber', 'No')}
                    {formFields.map((f) => sortHeader(f.id, f.label))}
                    {sortHeader('prizeName', 'Hadiah')}
                    {sortHeader('drawnAt', 'Waktu menang')}
                    <th scope="col" className="w-16 px-3 py-3 text-center font-semibold"><span className="sr-only">Aksi</span></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWinners.length > 0 ? paginatedWinners.map((w, idx) => {
                    const data = w.submissionData || {};
                    const ts = formatWibTimestamp(w.drawnAt || w.created_at || w.createdAt);
                    return (
                      <tr key={w.id || idx} className="border-b border-line last:border-b-0">
                        <td className="whitespace-nowrap px-3 py-2.5 font-semibold tabular-nums text-gold-ink">#{w.drawNumber || idx + 1}</td>
                        {formFields.map((f, colIdx) => (
                          <td key={f.id} className={cn('px-3 py-2.5 text-ink', colIdx === 0 && 'font-semibold')}>{String((data[f.label] ?? data[f.id] ?? (colIdx === 0 ? w.winnerName : '-')) || '-')}</td>
                        ))}
                        <td className="whitespace-nowrap px-3 py-2.5"><Badge tone="gold">{w.prizeTitle || w.prizeName || 'Doorprize utama'}</Badge></td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[0.8rem] text-dim">{ts.shortDate || ts.exact || '-'}</td>
                        <td className="px-3 py-2.5 text-center">
                          <button type="button" onClick={() => setWinnerToDelete(w)} aria-label={`Hapus pemenang #${w.drawNumber || idx + 1}`} title="Hapus pemenang (peserta bisa diundi lagi)"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-danger hover:bg-danger-tint">
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={4 + formFields.length} className="px-3 py-10 text-center text-muted">Tidak ada pemenang yang cocok dengan filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
              <div className="flex flex-wrap items-center gap-3 text-[0.82rem] text-muted">
                {(winnerPageSize === 'all' || totalWinnerPages <= 1) && <span>Menampilkan {firstRow}–{lastRow} dari {totalFilteredWinners}</span>}
                <label className="inline-flex items-center gap-2">
                  Per halaman
                  <select value={winnerPageSize} onChange={(e) => setWinnerPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))} className={cn(selectClass, 'h-8')}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value="all">Semua</option>
                  </select>
                </label>
              </div>
              {winnerPageSize !== 'all' && totalWinnerPages > 1 && (
                <Pagination page={winnerCurrentPage} pageCount={totalWinnerPages} onChange={setWinnerCurrentPage} itemLabel="pemenang" total={totalFilteredWinners} pageSize={winnerPageSize} />
              )}
            </div>
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-muted">Belum ada pemenang. Tekan <strong className="text-ink">Undi pemenang</strong> di atas untuk memulai.</p>
        )}
      </section>
    </div>
  );
}
