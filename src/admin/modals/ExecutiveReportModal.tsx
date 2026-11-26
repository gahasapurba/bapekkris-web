import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { Printer, X } from 'lucide-react';
import { formatWibEventRange } from '../../utils/dateUtils';
import { Badge, Button } from '../../ui';
import { useModalBehavior } from '../../ui/useModalBehavior';
import { AdminTable, tdClass, thClass } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

/** Printable accountability report (LPJ) for one tenure. Printing hides the rest of the page (see the print rules in styles/base.css). */
export default function ExecutiveReportModal() {
  const { activeTenure, devotions, divisions, events, galleries, members, reportTenureId, setReportTenureId, setShowExecutiveReportModal, tenures, worshipSongs } = useAdminPortal();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setShowExecutiveReportModal(false);
  useModalBehavior(panelRef, true, close);

  const selectedReportTenureId = reportTenureId || activeTenure?.id || tenures[0]?.id || '';
  const selectedReportTenure = tenures.find(t => t.id === selectedReportTenureId) || activeTenure || tenures[0];

  const reportEvents = events.filter(e => e.tenureId === selectedReportTenureId || (!e.tenureId && divisions.find(d => d.id === e.divisionId)?.tenureId === selectedReportTenureId));
  const reportMembers = members.filter(m => m.tenureId === selectedReportTenureId);
  const reportGalleries = galleries.filter(g => g.tenureId === selectedReportTenureId || (!g.tenureId && divisions.find(d => d.id === g.divisionId || d.name === g.division)?.tenureId === selectedReportTenureId));

  const completedEvents = reportEvents.filter(e => e.status === 'Completed').length;
  const eventPercent = reportEvents.length > 0 ? Math.round((completedEvents / reportEvents.length) * 100) : 0;
  const totalRab = reportEvents.reduce((acc, e) => acc + Number(e.totalRab || 0), 0);
  const coreLeaders = reportMembers.filter(m => m.category === 'pembina' || m.category === 'inti' || m.category === 'pimpro');

  const divisionCount = divisions.filter((d) => d.tenureId === selectedReportTenureId).length;
  const metric = (label: string, value: string, sub: string) => (
    <div className="rounded-md border border-line bg-subtle p-4">
      <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-dim">{label}</p>
      <p className="mt-1 font-display text-[1.45rem] font-semibold leading-tight text-ink">{value}</p>
      <p className="text-[0.8rem] text-muted">{sub}</p>
    </div>
  );

  return createPortal(
    <div className="executive-report-modal fixed inset-0 z-[100004] flex items-center justify-center bg-overlay p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="report-title" tabIndex={-1}
        className="executive-report-container flex max-h-[94vh] w-full max-w-5xl flex-col gap-6 overflow-y-auto rounded-xl border border-line bg-surface p-5 shadow-card outline-none md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
          <div>
            <Badge tone="gold">Laporan pertanggungjawaban</Badge>
            <h2 id="report-title" className="mt-2 font-display text-[clamp(1.3rem,3vw,1.8rem)] font-semibold leading-tight text-ink">Laporan Pertanggungjawaban Bapekkris Bank Mandiri</h2>
            <p className="mt-1 text-[0.9rem] text-muted">Periode <strong className="text-ink">{selectedReportTenure?.title || selectedReportTenure?.code || 'Kepengurusan'}</strong>{selectedReportTenure?.themeTagline ? ` · Tema “${selectedReportTenure.themeTagline}”` : ''}</p>
          </div>
          <div className="no-print flex flex-wrap items-center gap-2">
            <select aria-label="Pilih periode laporan" value={selectedReportTenureId} onChange={(e) => setReportTenureId(e.target.value)}
              className="h-10 cursor-pointer rounded-full border border-line bg-surface pl-4 pr-3 text-[0.86rem] font-medium text-ink hover:border-line-strong">
              {tenures.map((t) => <option key={t.id} value={t.id}>Periode {t.code || t.title}</option>)}
            </select>
            <Button icon={<Printer size={15} aria-hidden="true" />} onClick={() => window.print()}>Cetak / simpan PDF</Button>
            <button type="button" onClick={close} aria-label="Tutup" className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:bg-subtle hover:text-ink"><X size={18} aria-hidden="true" /></button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metric('Personel', `${reportMembers.length} orang`, `${reportMembers.filter((m) => m.category === 'pembina').length} pembina · ${divisionCount} divisi`)}
          {metric('Realisasi kegiatan', `${completedEvents}/${reportEvents.length} (${eventPercent}%)`, `${reportGalleries.length} album dokumentasi`)}
          {metric('Total anggaran', `Rp ${totalRab.toLocaleString('id-ID')}`, `${reportEvents.length} kegiatan`)}
          {metric('Pelayanan firman', `${devotions.length} renungan`, `${worshipSongs.length} kidung & lagu`)}
        </div>

        <section className="flex flex-col gap-3">
          <h3 className="font-display text-[1.1rem] font-semibold text-ink">I. Rekapitulasi kegiatan & anggaran</h3>
          <AdminTable label="Rekapitulasi kegiatan">
            <thead>
              <tr>
                <th scope="col" className={thClass}>Kegiatan</th>
                <th scope="col" className={thClass}>Divisi</th>
                <th scope="col" className={thClass}>Jadwal</th>
                <th scope="col" className={thClass}>Peserta</th>
                <th scope="col" className={thClass}>Status</th>
                <th scope="col" className={`${thClass} text-right`}>RAB</th>
              </tr>
            </thead>
            <tbody>
              {reportEvents.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">Belum ada kegiatan pada periode ini.</td></tr>
              ) : reportEvents.map((evt) => (
                <tr key={evt.id}>
                  <td className={`${tdClass} font-semibold`}>{evt.title}</td>
                  <td className={`${tdClass} text-muted`}>{evt.divisionName}</td>
                  <td className={`${tdClass} text-muted`}>{evt.date || formatWibEventRange(evt.startDate, evt.endDate)}</td>
                  <td className={`${tdClass} text-muted`}>{evt.peserta || evt.kpi}</td>
                  <td className={tdClass}><Badge tone={evt.status === 'Completed' ? 'success' : 'gold'}>{evt.status === 'Completed' ? 'Selesai' : evt.status === 'Ongoing' ? 'Berjalan' : 'Akan datang'}</Badge></td>
                  <td className={`${tdClass} whitespace-nowrap text-right font-semibold`}>Rp {Number(evt.totalRab || 0).toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </section>

        <section className="flex flex-col gap-3">
          <h3 className="font-display text-[1.1rem] font-semibold text-ink">II. Dewan pembina, pengurus inti & ketua divisi</h3>
          {coreLeaders.length === 0 ? <p className="text-[0.9rem] text-muted">Belum ada susunan pengurus pada periode ini.</p> : (
            <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {coreLeaders.map((l) => (
                <li key={l.id} className="rounded-md border border-line bg-subtle px-3 py-2.5">
                  <p className="text-[0.74rem] font-semibold uppercase tracking-wide text-gold-ink">{l.role}</p>
                  <p className="font-semibold text-ink">{l.name}</p>
                  {l.title && <p className="text-[0.82rem] text-muted">{l.title}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>,
    document.body
  );
}
