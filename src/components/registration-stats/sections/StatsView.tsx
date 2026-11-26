import { BarChart3, Check, ChevronDown, ChevronUp, ChevronsUpDown, Copy, Download, QrCode, RotateCcw, Search, Trophy } from 'lucide-react';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { Badge, Button, Input, Pagination, cn } from '../../../ui';
import { useRegistrationStats } from '../RegistrationStatsContext';

const selectClass = 'h-10 max-w-full cursor-pointer rounded-full border border-line bg-surface pl-3.5 pr-3 text-[0.84rem] font-medium text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink';

export default function StatsView() {
  const {
    choiceFields, connectedForm, formFields, copySuccess, currentPage, diagramData, dropdownFields, dropdownFilters, event, activeDiagramFieldId,
    filteredSubmissions, formSubmissions, getDropdownOptions, handleCopyLink, handleExportCsv, handleGeneratePoster, handleHeaderSort,
    handleResetFilters, hasActiveFilters, isFormClosed, isGeneratingPoster, isLuckyDrawEnabled, pageSize, paginatedSubmissions,
    qrCodeDataUrl, searchPlaceholder, searchQuery, setActiveDiagramFieldId, setCurrentPage, setDropdownFilters, setPageSize,
    setSearchQuery, setWinnerFilter, sortConfig, totalFiltered, totalPages, winnerFilter, wonIdsSet
  } = useRegistrationStats();

  const sortIcon = (key: string) => sortConfig.key === key
    ? (sortConfig.direction === 'asc' ? <ChevronUp size={14} aria-hidden="true" className="text-gold-ink" /> : <ChevronDown size={14} aria-hidden="true" className="text-gold-ink" />)
    : <ChevronsUpDown size={13} aria-hidden="true" className="text-dim" />;
  const ariaSort = (key: string) => (sortConfig.key === key ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : undefined);
  const sortHeader = (key: string, label: string) => (
    <th key={key} scope="col" aria-sort={ariaSort(key)} className="whitespace-nowrap px-3 py-3 font-semibold">
      <button type="button" onClick={() => handleHeaderSort(key)} className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 [font:inherit] [color:inherit] hover:text-ink">
        {label}{sortIcon(key)}
      </button>
    </th>
  );
  const firstRow = totalFiltered > 0 ? (pageSize === 'all' ? 1 : (currentPage - 1) * pageSize + 1) : 0;
  const lastRow = pageSize === 'all' ? totalFiltered : Math.min(currentPage * pageSize, totalFiltered);

  return (
    <div className="flex flex-col gap-6">
      <div className={cn('grid gap-5', !isFormClosed && 'lg:grid-cols-[minmax(280px,360px)_1fr]')}>
        {!isFormClosed && (
          <section aria-labelledby="qr-title" className="flex flex-col items-center gap-4 rounded-xl border border-line bg-surface p-6 text-center shadow-card">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-gold-ink"><QrCode size={14} aria-hidden="true" />Absensi & pendaftaran</p>
              <h2 id="qr-title" className="mt-1 font-display text-[1.5rem] font-semibold text-ink">Pindai QR di layar</h2>
              <p className="text-[0.86rem] text-muted">Arahkan kamera ponsel ke kode QR di bawah.</p>
            </div>
            <div className="flex aspect-square w-full max-w-[240px] items-center justify-center rounded-lg border border-line bg-white p-3">
              {qrCodeDataUrl ? <img src={qrCodeDataUrl} alt="Kode QR formulir pendaftaran" className="block size-full" /> : <span className="text-[0.8rem] font-semibold text-[#0e1a2b]">Memuat QR…</span>}
            </div>
            {event.location && <p className="text-[0.82rem] text-dim">{event.location}</p>}
            <div className="flex w-full flex-wrap justify-center gap-2">
              <Button size="sm" variant="secondary" className="flex-1" icon={copySuccess ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} onClick={handleCopyLink}>
                {copySuccess ? 'Tersalin' : 'Salin tautan'}
              </Button>
              <Button size="sm" variant="gold" className="flex-1" loading={isGeneratingPoster} icon={<Download size={14} aria-hidden="true" />} onClick={handleGeneratePoster}>
                {isGeneratingPoster ? 'Menyiapkan…' : 'Poster PNG'}
              </Button>
            </div>
          </section>
        )}

        <section aria-labelledby="diagram-title" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gold-tint text-gold-ink"><BarChart3 size={18} aria-hidden="true" /></span>
              <div>
                <h2 id="diagram-title" className="font-display text-[1.25rem] font-semibold text-ink">Sebaran: {diagramData.fieldLabel}</h2>
                <p className="text-[0.84rem] text-muted">Dari {diagramData.totalCategories} pilihan, diperbarui otomatis saat ada pendaftar baru.</p>
              </div>
            </div>
            <Badge tone="info">{diagramData.filledCount} / {diagramData.totalCategories} terisi</Badge>
          </div>

          {choiceFields.length > 1 && (
            <div role="group" aria-label="Pilih pertanyaan" className="flex flex-wrap gap-1.5">
              {choiceFields.map((cf) => (
                <button key={cf.id} type="button" aria-pressed={activeDiagramFieldId === cf.id} onClick={() => setActiveDiagramFieldId(cf.id)}
                  className={cn('inline-flex h-8 cursor-pointer items-center rounded-full border px-3 text-[0.8rem] font-semibold',
                    activeDiagramFieldId === cf.id ? 'border-action bg-action text-on-action' : 'border-line bg-transparent text-muted hover:text-ink')}>
                  {cf.label}
                </button>
              ))}
            </div>
          )}

          {diagramData.items.length > 0 ? (
            <ul className="grid list-none gap-x-6 gap-y-3 sm:grid-cols-2">
              {diagramData.items.map((item, idx) => (
                <li key={idx} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 text-[0.84rem]">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2.5 shrink-0 rounded-full" style={{ background: item.color }} aria-hidden="true" />
                      <span className="truncate text-ink" title={item.label}>{item.label}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted"><strong className="text-ink">{item.count}</strong> ({item.percentage}%)</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-subtle" aria-hidden="true">
                    <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${item.percentage}%`, background: item.color }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-[0.88rem] text-muted">Belum ada jawaban untuk pertanyaan ini.</p>
          )}
        </section>
      </div>

      <section aria-labelledby="respondents-title" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 shadow-card md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="respondents-title" className="font-display text-[1.25rem] font-semibold text-ink">Daftar pendaftar ({filteredSubmissions.length})</h2>
            <p className="text-[0.84rem] text-muted">Cari, saring, dan urutkan jawaban formulir.</p>
          </div>
          <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={handleExportCsv} disabled={formSubmissions.length === 0}>Ekspor CSV</Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-y border-line py-3">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <Input type="search" aria-label="Cari pendaftar" placeholder={searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-full pl-10" />
          </div>
          {dropdownFields.map((df) => (
            <select key={df.id} aria-label={`Saring ${df.label}`} value={dropdownFilters[df.id] || 'ALL'} onChange={(e) => setDropdownFilters((prev) => ({ ...prev, [df.id]: e.target.value }))} className={selectClass}>
              <option value="ALL">Semua {df.label}</option>
              {getDropdownOptions(df).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
          ))}
          {isLuckyDrawEnabled && (
            <select aria-label="Saring status undian" value={winnerFilter} onChange={(e) => setWinnerFilter(e.target.value)} className={selectClass}>
              <option value="ALL">Semua peserta</option>
              <option value="WINNERS">Hanya pemenang</option>
              <option value="NOT_WINNERS">Belum menang</option>
            </select>
          )}
          {hasActiveFilters && <Button size="sm" variant="ghost" icon={<RotateCcw size={13} aria-hidden="true" />} onClick={handleResetFilters}>Reset filter</Button>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-line text-[0.78rem] uppercase tracking-wide text-dim">
                <th scope="col" className="w-12 px-3 py-3 font-semibold">No</th>
                {formFields.map((f) => sortHeader(f.id, f.label))}
                {sortHeader('createdAt', 'Waktu daftar')}
              </tr>
            </thead>
            <tbody>
              {paginatedSubmissions.length > 0 ? paginatedSubmissions.map((sub, idx) => {
                const isWinner = isLuckyDrawEnabled && wonIdsSet.has(sub.id);
                const rowIndex = pageSize === 'all' ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                const raw = sub.createdAt || sub.created_at || sub.submittedAt;
                const ts = formatWibTimestamp(raw);
                return (
                  <tr key={sub.id} className={cn('border-b border-line last:border-b-0', isWinner && 'bg-gold-tint')}>
                    <td className="px-3 py-2.5 tabular-nums text-dim">{rowIndex}</td>
                    {formFields.map((f, colIdx) => (
                      <td key={f.id} className={cn('px-3 py-2.5 text-ink', colIdx === 0 && 'font-semibold')}>
                        <span className="inline-flex flex-wrap items-center gap-2">
                          {String(sub.data?.[f.label] ?? sub.data?.[f.id] ?? '-')}
                          {colIdx === 0 && isWinner && <Badge tone="gold"><Trophy size={12} aria-hidden="true" />Pemenang</Badge>}
                        </span>
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-2.5 text-[0.8rem] text-dim">{ts.shortDate || ts.exact || '-'}</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={2 + formFields.length} className="px-3 py-10 text-center text-muted">
                    {hasActiveFilters ? 'Tidak ada pendaftar yang cocok dengan filter.' : 'Belum ada yang mendaftar melalui formulir ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-3 text-[0.82rem] text-muted">
            {(pageSize === 'all' || totalPages <= 1) && <span>Menampilkan {firstRow}–{lastRow} dari {totalFiltered}</span>}
            <label className="inline-flex items-center gap-2">
              Per halaman
              <select value={pageSize} onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))} className={cn(selectClass, 'h-8')}>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value="all">Semua</option>
              </select>
            </label>
          </div>
          {pageSize !== 'all' && totalPages > 1 && (
            <Pagination page={currentPage} pageCount={totalPages} onChange={setCurrentPage} itemLabel="pendaftar" total={totalFiltered} pageSize={pageSize} />
          )}
        </div>
      </section>
    </div>
  );
}
