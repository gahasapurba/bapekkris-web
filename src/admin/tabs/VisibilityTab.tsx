import { AlertTriangle, Eye, EyeOff, Globe, Megaphone } from 'lucide-react';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, Field, Input, Select, cn } from '../../ui';
import { AdminPanel, AdminSubsection, Switch } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

export default function VisibilityTab() {
  const { announcementBar, onUpdateAnnouncementBar, onUpdatePageVisibility, pageVisibility, showToast } = useAdminPortal();

  const pageItems = [
    { id: 'home', label: 'Beranda', desc: 'Sambutan, visi & misi, pimpinan, pendaftaran terbuka, dan agenda terdekat.' },
    { id: 'organisasi', label: 'Organisasi', desc: 'Bagan kepengurusan: penasihat, pembina, pimpinan, divisi, dan sub-divisi.' },
    { id: 'event', label: 'Ibadah & acara', desc: 'Daftar dan kalender ibadah, retreat, perayaan, serta bakti sosial.' },
    { id: 'renungan', label: 'Renungan', desc: 'Renungan harian, doa, dan kartu bagikan ke WhatsApp.' },
    { id: 'alkitab', label: 'Alkitab', desc: 'Alkitab Terjemahan Baru 66 kitab, terhubung ke Multimedia Live.' },
    { id: 'lagu', label: 'Kidung & lagu', desc: 'Katalog KJ, PKJ, NKB, dan lagu pujian.' },
    { id: 'doa', label: 'Pokok doa', desc: 'Permohonan doa jemaat dan dinding doa yang sudah ditinjau.' },
    { id: 'easyworship', label: 'Multimedia Live', desc: 'Konsol operator tayangan ibadah dan layar proyektor.' },
    { id: 'galeri', label: 'Galeri', desc: 'Album foto kegiatan dan tautan folder dokumentasi.' },
    { id: 'assets', label: 'Aset & logo', desc: 'Logo resmi, template, dan dokumen panduan untuk diunduh.' },
    { id: 'form', label: 'Registrasi & formulir', desc: 'Pendaftaran retreat, kepanitiaan, kebaktian khusus, dan survei.' },
  ];

  const isPageItemVisible = (id: any) => {
    if (id === 'event' || id === 'program') return pageVisibility.event !== false && pageVisibility.program !== false;
    if (id === 'form' || id === 'oprec') return pageVisibility.form !== false && pageVisibility.oprec !== false;
    return pageVisibility[id] !== false;
  };

  const visiblePagesCount = pageItems.filter(p => isPageItemVisible(p.id)).length;
  const isNavbarVisible = pageVisibility.navbar !== false;

  const handleToggleKey = (key: any) => {
    if (!onUpdatePageVisibility) return;
    const currentVal = isPageItemVisible(key);
    const nextVal = !currentVal;
    const nextState = {
      ...pageVisibility,
      [key]: nextVal
    };
    if (key === 'event') nextState.program = nextVal;
    if (key === 'form') nextState.oprec = nextVal;
    onUpdatePageVisibility(nextState);
  };

  const handleSetAll = (showPages: any, showNavbar: any) => {
    if (!onUpdatePageVisibility) return;
    const nextState: Record<string, boolean> = {
      navbar: showNavbar,
      event: showPages,
      program: showPages,
      form: showPages,
      oprec: showPages
    };
    pageItems.forEach(p => {
      nextState[p.id] = showPages;
    });
    onUpdatePageVisibility(nextState);
  };

  const saveBar = (patch: Record<string, unknown>, message: string) => { onUpdateAnnouncementBar({ ...announcementBar, ...patch }); showToast(message); };

  return (
    <AdminPanel title="Visibilitas menu" description="Atur halaman yang tampil untuk publik. Jika semua halaman disembunyikan, pengunjung melihat layar pemeliharaan yang tetap menyediakan akses ke portal pengurus."
      actions={<>
        <Button size="sm" variant="secondary" icon={<Eye size={14} aria-hidden="true" />} onClick={() => handleSetAll(true, true)}>Tampilkan semua</Button>
        <Button size="sm" variant="secondary" icon={<EyeOff size={14} aria-hidden="true" />} onClick={() => handleSetAll(false, true)}>Sembunyikan semua halaman</Button>
        <Button size="sm" variant="danger" icon={<EyeOff size={14} aria-hidden="true" />} onClick={() => handleSetAll(false, false)}>Sembunyikan semua + navbar</Button>
      </>}>
      {pageVisibility?._updatedAt && <p className="-mt-2 text-[0.78rem] text-dim">{formatLastUpdatedWib(pageVisibility._updatedAt)}</p>}

      <div role="status" className={cn('flex items-start gap-3 rounded-md border px-4 py-3 text-[0.9rem] text-ink', visiblePagesCount === 0 ? 'border-danger-line bg-danger-tint' : 'border-info-line bg-info-tint')}>
        {visiblePagesCount === 0 ? <AlertTriangle size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" /> : <Globe size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-info" />}
        {visiblePagesCount === 0
          ? <span><strong>Semua halaman sedang disembunyikan.</strong> Pengunjung melihat layar pemeliharaan.</span>
          : <span><strong>{visiblePagesCount} dari {pageItems.length}</strong> halaman tampil · navbar <strong>{isNavbarVisible ? 'tampil' : 'disembunyikan'}</strong></span>}
      </div>

      <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface p-4">
        <div>
          <p className="font-semibold text-ink">Navbar utama</p>
          <p className="text-[0.86rem] text-muted">Bar navigasi atas beserta logo, pencarian, dan tombol tema.</p>
        </div>
        <Switch checked={isNavbarVisible} onChange={() => handleToggleKey('navbar')} label="Tampilkan navbar utama" />
      </div>

      {typeof onUpdateAnnouncementBar === 'function' && (
        <AdminSubsection title={<span className="inline-flex flex-wrap items-center gap-2"><Megaphone size={17} aria-hidden="true" className="text-gold-ink" />Pengumuman di atas halaman <Badge tone={announcementBar?.isActive ? 'success' : 'neutral'}>{announcementBar?.isActive ? 'Aktif' : 'Nonaktif'}</Badge></span>}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[0.86rem] text-muted">Info singkat seperti townhall atau batas pendaftaran, tampil di bagian paling atas situs.{announcementBar?._updatedAt && <span className="block text-[0.78rem] text-dim">{formatLastUpdatedWib(announcementBar._updatedAt)}</span>}</p>
            <Switch checked={Boolean(announcementBar?.isActive)} label="Aktifkan pengumuman"
              onChange={(next) => saveBar({ isActive: next }, next ? 'Pengumuman diaktifkan.' : 'Pengumuman disembunyikan.')} />
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
            <Field label="Label" hint="Disimpan saat kolom ditinggalkan."><Input defaultValue={announcementBar?.badge || 'INFO TERBARU'} onBlur={(e) => saveBar({ badge: e.target.value.trim() || 'INFO' }, 'Label pengumuman disimpan.')} /></Field>
            <Field label="Pesan"><Input defaultValue={announcementBar?.message || ''} onBlur={(e) => saveBar({ message: e.target.value.trim() }, 'Pesan pengumuman disimpan.')} /></Field>
            <Field label="Teks tombol (opsional)"><Input defaultValue={announcementBar?.ctaText || ''} onBlur={(e) => saveBar({ ctaText: e.target.value.trim() }, 'Teks tombol disimpan.')} /></Field>
            <Field label="Tujuan tombol">
              <Select value={announcementBar?.ctaTab || 'oprec'} onChange={(e) => saveBar({ ctaTab: e.target.value }, 'Tujuan tombol disimpan.')}>
                <option value="oprec">Registrasi & formulir</option>
                <option value="program">Ibadah & acara</option>
                <option value="organisasi">Struktur organisasi</option>
                <option value="galeri">Galeri</option>
                <option value="renungan">Renungan harian</option>
                <option value="alkitab">Alkitab</option>
                <option value="lagu">Kidung & lagu</option>
                <option value="easyworship">Multimedia Live</option>
                <option value="assets">Aset & logo</option>
              </Select>
            </Field>
          </div>
        </AdminSubsection>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="text-[0.98rem] font-semibold text-ink">Halaman situs <span className="font-normal text-muted">({visiblePagesCount}/{pageItems.length} tampil)</span></h3>
        <ul className="grid list-none gap-3 md:grid-cols-2">
          {pageItems.map((page) => {
            const on = isPageItemVisible(page.id);
            return (
              <li key={page.id} className={cn('flex items-start justify-between gap-4 rounded-md border p-4', on ? 'border-line bg-surface' : 'border-dashed border-line bg-subtle')}>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">{page.label}{!on && <Badge>Tersembunyi</Badge>}</p>
                  <p className="mt-0.5 text-[0.84rem] leading-relaxed text-muted">{page.desc}</p>
                </div>
                <Switch checked={on} onChange={() => handleToggleKey(page.id)} label={`Tampilkan halaman ${page.label}`} />
              </li>
            );
          })}
        </ul>
      </div>
    </AdminPanel>
  );
}
