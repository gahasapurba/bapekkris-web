import { useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button, cn } from '../../ui';
import { useModalBehavior } from '../../ui/useModalBehavior';
import {
  AlertCircle, AlertTriangle, CalendarDays, Camera, ClipboardList, FileCheck2, FileText, Image as ImageIcon, Layers, Lightbulb,
  RefreshCw, ShieldAlert, ShieldCheck, Sparkles, Users, type LucideIcon
} from 'lucide-react';
import type { DeleteConfirm } from '../useAdminPortalState';
import { useDeleteDialogContext } from '../AdminPortalContext';

type NoteTone = 'warning' | 'safe' | 'info';
interface Dependency { icon: LucideIcon; label: string; value: string; active: boolean }
interface ConfirmBody {
  intro: ReactNode;
  dependencies?: Dependency[];
  extra?: ReactNode;
  note?: { tone: NoteTone; label: string; text: ReactNode };
}

const NOTE_STYLES: Record<NoteTone, { className: string; icon: LucideIcon }> = {
  warning: { className: 'border-gold-line bg-gold-tint text-ink', icon: ShieldAlert },
  safe: { className: 'border-success-line bg-success-tint text-ink', icon: ShieldCheck },
  info: { className: 'border-gold-line bg-gold-tint text-ink', icon: Lightbulb }
};

const n = (value: number | undefined) => value ?? 0;
const dep = (icon: LucideIcon, label: string, count: number | undefined, unit: string, detail?: string): Dependency =>
  ({ icon, label, value: `${n(count)} ${unit}${detail ? `: ${detail}` : ''}`, active: n(count) > 0 });
const hint = (text: ReactNode) => ({ tone: 'info' as const, label: 'Petunjuk', text });
const safe = (text: ReactNode, label = 'Aman dihapus') => ({ tone: 'safe' as const, label, text });

/** Message, blocking dependencies and guidance shown for each kind of delete. */
function describe(dc: DeleteConfirm): ConfirmBody {
  const name = <strong>“{dc.name}”</strong>;
  switch (dc.type) {
    case 'reset_all':
      return { intro: <span className="font-semibold text-ink">Bersihkan cache dan muat ulang data? Data tidak dihapus, hanya dimuat ulang dari server.</span> };
    case 'tenure':
      if (dc.isOnlyTenure) return {
        intro: <>Periode {name} adalah satu-satunya periode kepengurusan yang tersisa di sistem.</>,
        note: { tone: 'warning', label: 'Proteksi sistem', text: <>Website mewajibkan minimal <strong>1 periode kepengurusan</strong> tetap ada agar struktur organisasi, acara, dan informasi kabinet berjalan normal.</> }
      };
      if (dc.isActiveTenure) return {
        intro: <>Periode {name} saat ini berstatus <strong>periode aktif utama</strong> (default website).</>,
        note: { tone: 'warning', label: 'Proteksi periode aktif', text: <>Periode yang sedang aktif tidak dapat dihapus. Klik <strong>“Jadikan aktif”</strong> pada periode lain terlebih dahulu.</> }
      };
      if (n(dc.totalDependentCount) > 0) return {
        intro: <>Periode {name} belum dapat dihapus karena masih menaungi <strong>{n(dc.totalDependentCount)} data kepengurusan</strong>. Hapus atau pindahkan data berikut terlebih dahulu:</>,
        dependencies: [
          dep(Layers, 'Divisi terkait', dc.divCount, 'divisi'), dep(Users, 'Anggota / pengurus', dc.memCount, 'orang'),
          dep(CalendarDays, 'Acara', dc.evtCount, 'acara'), dep(ImageIcon, 'Galeri kegiatan', dc.galCount, 'album'),
          dep(FileText, 'Formulir terkait', dc.formCount, 'formulir')
        ],
        note: hint('Buka tab data terkait di menu admin untuk menghapus atau memindahkan periode data di atas sebelum menghapus periode ini.')
      };
      return {
        intro: <>Yakin ingin menghapus periode {name}? Data periode ini akan dihapus permanen.</>,
        note: safe('Periode ini tidak aktif dan tidak memiliki data terkait (0 divisi, 0 anggota, 0 acara, 0 galeri, 0 formulir).')
      };
    case 'division':
      return dc.isBlocked ? {
        intro: <>Divisi {name} belum dapat dihapus karena masih menaungi <strong>{n(dc.totalDependentCount)} data kepengurusan</strong>. Pindahkan atau hapus data berikut terlebih dahulu:</>,
        dependencies: [
          dep(Users, 'Anggota divisi', dc.memCount, 'orang'), dep(CalendarDays, 'Acara', dc.evtCount, 'acara'),
          ...(n(dc.galCount) > 0 ? [dep(ImageIcon, 'Galeri terkait', dc.galCount, 'album')] : [])
        ],
        note: hint(<>Buka tab <strong>Pengurus & pelayan</strong> dan <strong>Ibadah & acara</strong> untuk memindahkan divisi personel/acara atau menghapusnya terlebih dahulu.</>)
      } : { intro: <>Yakin ingin menghapus divisi {name}?</>, note: safe('Divisi ini tidak menaungi anggota maupun acara (0 anggota, 0 acara).') };
    case 'sub_division':
      return dc.isBlocked ? {
        intro: <>Sub-divisi {name} belum dapat dihapus karena masih memiliki <strong>{n(dc.memCount)} personel</strong> yang ditempatkan di sub-divisi ini.</>,
        dependencies: [dep(Users, 'Personel di sub-divisi ini', dc.memCount, 'orang')],
        note: hint(<>Buka tab <strong>Pengurus & pelayan</strong> untuk memindahkan sub-divisi personel tersebut terlebih dahulu.</>)
      } : { intro: <>Yakin ingin menghapus sub-divisi {name}?</>, note: safe('Sub-divisi ini kosong dan tidak memiliki personel terdaftar (0 anggota).') };
    case 'member':
      return dc.isBlocked ? {
        intro: <>Personel {name} merupakan <strong>ketua</strong> divisi <strong>“{dc.divName}”</strong>.</>,
        dependencies: [dep(Users, 'Anggota aktif di bawah divisi ini', dc.squadCount, 'anggota divisi')],
        note: hint('Menghapus ketua divisi membuat anggota di bawahnya kehilangan garis komando di bagan organisasi. Tunjuk ketua pengganti atau pindahkan anggota terlebih dahulu.')
      } : { intro: <>Yakin ingin menghapus personel {name}?</>, note: safe('Personel tidak memimpin anggota divisi aktif. Foto profilnya ikut dibersihkan dari storage.') };
    case 'event':
      return dc.isBlocked ? {
        intro: <>Acara {name} belum dapat dihapus karena masih memiliki data terkait:</>,
        dependencies: [
          dep(ClipboardList, 'RSVP terdaftar', dc.rsvpCount, 'pendaftar'),
          dep(FileText, 'Formulir pendaftaran terhubung', dc.formCount, 'formulir', dc.connectedFormNames),
          dep(Users, 'Pengisian formulir peserta', dc.formSubCount, 'pengisian'),
          dep(Sparkles, 'Pemenang undian doorprize', dc.luckyDrawCount, 'pemenang'),
          dep(Camera, 'Galeri terhubung', dc.galCount, 'album', dc.connectedGalTitles)
        ].filter((d) => d.active),
        note: hint('Putuskan hubungan formulir/galeri ke acara ini, atau bersihkan RSVP dan hasil undian terlebih dahulu agar data tetap konsisten.')
      } : { intro: <>Yakin ingin menghapus acara {name}?</>, note: safe('Acara ini tidak memiliki RSVP, formulir terhubung, galeri, maupun pemenang undian.') };
    case 'submission':
      return dc.isBlocked ? {
        intro: <><strong>{dc.name}</strong> tidak dapat dihapus karena peserta tercatat sebagai <strong>pemenang undian doorprize</strong>.</>,
        dependencies: [{ icon: Sparkles, label: 'Hadiah yang dimenangkan', value: dc.drawPrize || 'Hadiah doorprize acara', active: true }],
        note: hint(<>Buka halaman <strong>Statistik & undian acara</strong> untuk membatalkan pemenang terlebih dahulu, lalu hapus berkas pendaftaran ini.</>)
      } : { intro: <>Yakin ingin menghapus berkas pendaftaran {name}? Berkas lampirannya ikut dibersihkan.</> };
    case 'form':
      return dc.isBlocked ? {
        intro: <>Formulir {name} belum dapat dihapus karena masih memiliki data terkait:</>,
        dependencies: [
          dep(FileCheck2, 'Data pengisian peserta', dc.submissionCount, 'respons'),
          { icon: CalendarDays, label: 'Terhubung ke acara', value: dc.connectedEventTitle || '', active: n(dc.eventCount) > 0 }
        ].filter((d) => d.active),
        note: hint(<>
          {n(dc.eventCount) > 0 && 'Putuskan hubungan acara ke formulir ini lewat Edit acara atau Edit formulir terlebih dahulu. '}
          {n(dc.submissionCount) > 0 && 'Buka tab Data pendaftaran untuk meninjau atau mengekspor respons sebelum membersihkan data pendaftar.'}
        </>)
      } : { intro: <>Yakin ingin menghapus formulir {name}?</>, note: safe('Formulir ini tidak memiliki pengisian peserta dan tidak terhubung ke acara mana pun.') };
    case 'role':
      return dc.isBlocked ? {
        intro: <>Role {name} tidak dapat dihapus karena masih digunakan oleh <strong>{n(dc.dependentCount)} personel</strong> pada periode ini.</>,
        extra: (
          <ul className="m-0 flex max-h-40 list-none flex-col gap-1 overflow-y-auto rounded-md border border-line bg-subtle px-3 py-2 text-[0.84rem]">
            {(dc.dependentMembers || []).map((m, i) => <li key={m.id || i}><strong>{m.name}</strong> ({m.role})</li>)}
          </ul>
        ),
        note: hint(<>Ubah jabatan personel di atas ke role lain di tab <strong>Pengurus & pelayan</strong> sebelum menghapus role ini.</>)
      } : { intro: <>Yakin ingin menghapus role {name} dari periode kepengurusan ini?</>, note: safe('Tidak ada personel yang memakai role ini pada periode yang dipilih.', 'Aman') };
    case 'gallery':
      return dc.isBlocked ? {
        intro: <>Album {name} belum dapat dihapus karena masih terhubung ke acara:</>,
        dependencies: [{ icon: CalendarDays, label: 'Terhubung ke acara', value: dc.connectedEventTitle || '', active: true }],
        note: hint(<>Putuskan hubungan acara lewat <strong>Edit galeri</strong> (pilih <em>Tanpa hubungan acara</em>) terlebih dahulu.</>)
      } : { intro: <>Yakin ingin menghapus album {name}? Foto di dalamnya ikut dibersihkan.</>, note: safe('Galeri ini tidak terhubung ke acara mana pun.') };
    case 'gallery_photo':
      return { intro: <>Yakin ingin menghapus {name} dari album? Fotonya dibersihkan dari storage saat Anda klik <strong>Simpan perubahan</strong>.</> };
    default:
      return { intro: <>Yakin ingin menghapus {name}?</> };
  }
}

function DependencyGrid({ items }: { items: Dependency[] }) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-2 rounded-lg border border-line bg-subtle p-3 sm:grid-cols-2">
      {items.map((d) => {
        const Icon = d.icon;
        return (
          <li key={d.label} className={cn('flex items-center gap-2.5 rounded-md border px-3 py-2', d.active ? 'border-danger-line bg-danger-tint' : 'border-line bg-surface')}>
            <Icon size={18} aria-hidden="true" className={cn('shrink-0', d.active ? 'text-danger' : 'text-muted')} />
            <span className="min-w-0">
              <span className="block text-[0.74rem] text-muted">{d.label}</span>
              <span className={cn('block break-words text-[0.88rem] font-semibold', d.active ? 'text-danger' : 'text-muted')}>{d.value}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function DeleteConfirmModal() {
  const {
    deleteConfirm,
    editingItem,
    onDeleteBrandAsset,
    onDeleteDivision,
    onDeleteEvent,
    onDeleteEventRsvp,
    onDeleteFaq,
    onDeleteForm,
    onDeleteGallery,
    onDeleteMember,
    onDeleteSubDivision,
    onDeleteSubmission,
    onDeleteTenure,
    onDeleteTenureRole,
    onResetDefault,
    setDeleteConfirm,
    setEditingItem,
    showToast
  } = useDeleteDialogContext();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setDeleteConfirm(null);
  useModalBehavior(panelRef, true, close);
  const isReset = deleteConfirm.type === 'reset_all';
  const blocked = Boolean(deleteConfirm.isBlocked);
  const confirmLabel = (() => { const labelMap: Record<string, string> = {
                    reset_all: 'Ya, Sync Data',
                    gallery_photo: 'Hapus Foto',
                    tenure: 'Ya, Hapus Periode',
                    division: 'Ya, Hapus Divisi',
                    sub_division: 'Ya, Hapus Sub-Divisi',
                    member: 'Ya, Hapus Personel',
                    role: 'Ya, Hapus Role',
                    event: 'Ya, Hapus Acara',
                    form: 'Ya, Hapus Formulir',
                    submission: 'Ya, Hapus Berkas'
                  };
                  return labelMap[deleteConfirm.type] || 'Ya, Hapus Data'; })();
  const runDelete = () => {
                  if (deleteConfirm.type === 'member' && onDeleteMember) onDeleteMember(deleteConfirm.id);
                  if (deleteConfirm.type === 'division' && onDeleteDivision) onDeleteDivision(deleteConfirm.id);
                  if (deleteConfirm.type === 'sub_division' && onDeleteSubDivision) onDeleteSubDivision(deleteConfirm.id);
                  if (deleteConfirm.type === 'role' && onDeleteTenureRole) onDeleteTenureRole(deleteConfirm.id);
                  if (deleteConfirm.type === 'gallery' && onDeleteGallery) onDeleteGallery(deleteConfirm.id);
                  if (deleteConfirm.type === 'tenure' && onDeleteTenure) onDeleteTenure(deleteConfirm.id);
                  if (deleteConfirm.type === 'event_rsvp' && onDeleteEventRsvp) onDeleteEventRsvp(deleteConfirm.id);
                  if (deleteConfirm.type === 'form' && onDeleteForm) onDeleteForm(deleteConfirm.id);
                  if (deleteConfirm.type === 'event' && onDeleteEvent) onDeleteEvent(deleteConfirm.id);
                  if (deleteConfirm.type === 'submission' && onDeleteSubmission) onDeleteSubmission(deleteConfirm.id);
                  if (deleteConfirm.type === 'brand_asset' && onDeleteBrandAsset) onDeleteBrandAsset(deleteConfirm.id);
                  if (deleteConfirm.type === 'faq' && onDeleteFaq) onDeleteFaq(deleteConfirm.id);
                  if (deleteConfirm.type === 'reset_all' && onResetDefault) onResetDefault();
                  if (deleteConfirm.type === 'gallery_photo') {
                    if (editingItem && editingItem.item) {
                      const nextPhotos = (editingItem.item.photos || []).filter((_: string, i: number) => i !== deleteConfirm.photoIdx);
                      setEditingItem({ ...editingItem, item: { ...editingItem.item, photos: nextPhotos } });
                    }
                  }

                  let toastMsg = 'Data berhasil dihapus & disinkronkan!';
                  if (deleteConfirm.type === 'reset_all') {
                    toastMsg = 'Cache berhasil dibersihkan & data berhasil dimuat ulang!';
                  } else if (deleteConfirm.type === 'gallery_photo') {
                    toastMsg = `${deleteConfirm.name} berhasil dihapus dari daftar!`;
                  } else if (deleteConfirm.type === 'tenure') {
                    toastMsg = `Periode "${deleteConfirm.name}" berhasil dihapus!`;
                  } else if (deleteConfirm.type === 'division') {
                    toastMsg = `Divisi "${deleteConfirm.name}" berhasil dihapus!`;
                  } else if (deleteConfirm.type === 'sub_division') {
                    toastMsg = `Sub-divisi "${deleteConfirm.name}" berhasil dihapus!`;
                  } else if (deleteConfirm.type === 'member') {
                    toastMsg = `Personel "${deleteConfirm.name}" berhasil dihapus!`;
                  } else if (deleteConfirm.type === 'role') {
                    toastMsg = `Role "${deleteConfirm.name}" berhasil dihapus!`;
                  } else if (deleteConfirm.type === 'event') {
                    toastMsg = `Acara "${deleteConfirm.name}" berhasil dihapus!`;
                  } else if (deleteConfirm.type === 'form') {
                    toastMsg = `Formulir "${deleteConfirm.name}" berhasil dihapus!`;
                  }

                  setDeleteConfirm(null);
                  showToast(toastMsg);
  };

  const body = describe(deleteConfirm);
  const note = body.note ? NOTE_STYLES[body.note.tone] : null;
  const NoteIcon = note?.icon;

  return createPortal(
    <div className="fixed inset-0 z-[100005] flex items-center justify-center bg-overlay p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={panelRef} role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title" tabIndex={-1}
        className={cn('flex max-h-[92vh] w-full flex-col gap-4 overflow-y-auto rounded-xl border bg-surface p-6 text-left shadow-card outline-none', (deleteConfirm.totalDependentCount ?? 0) > 0 ? 'max-w-[520px]' : 'max-w-[460px]', isReset ? 'border-info-line' : blocked ? 'border-gold-line' : 'border-danger-line')}>
        <div className="flex items-start gap-3">
          <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full', isReset ? 'bg-info-tint text-info' : blocked ? 'bg-gold-tint text-gold-ink' : 'bg-danger-tint text-danger')}>
            {isReset ? <RefreshCw size={22} aria-hidden="true" /> : blocked ? <AlertCircle size={22} aria-hidden="true" /> : <AlertTriangle size={22} aria-hidden="true" />}
          </span>
          <h2 id="delete-confirm-title" className="pt-1.5 font-display text-[1.3rem] font-semibold leading-snug text-ink">{(() => {
            if (deleteConfirm.type === 'reset_all') return 'Konfirmasi Sync Data';
            if (deleteConfirm.isBlocked) {
              if (deleteConfirm.type === 'tenure') {
                if (deleteConfirm.isOnlyTenure) return 'Tidak Dapat Menghapus Periode';
                if (deleteConfirm.isActiveTenure) return 'Periode Sedang Aktif';
                return 'Periode Masih Memiliki Data Terkait';
              }
              if (deleteConfirm.type === 'division') return 'Divisi Masih Memiliki Data Terkait';
              if (deleteConfirm.type === 'role') return 'Role Masih Digunakan Personel';
              if (deleteConfirm.type === 'member') return 'Ketua Divisi Masih Memimpin Anggota';
              if (deleteConfirm.type === 'event') return 'Acara Masih Memiliki Data Terkait';
              if (deleteConfirm.type === 'form') return 'Formulir Memiliki Data Pengisian';
              if (deleteConfirm.type === 'submission') return 'Peserta Adalah Pemenang Undian';
              return 'Data Masih Memiliki Ketergantungan';
            }
            const titles: Record<string, string> = {
              gallery_photo: 'Konfirmasi Hapus Foto',
              tenure: 'Konfirmasi Hapus Periode',
              division: 'Konfirmasi Hapus Divisi',
              sub_division: 'Konfirmasi Hapus Sub-Divisi',
              role: 'Konfirmasi Hapus Role',
              member: 'Konfirmasi Hapus Personel',
              event: 'Konfirmasi Hapus Acara',
              form: 'Konfirmasi Hapus Formulir',
              submission: 'Konfirmasi Hapus Berkas'
            };
            return titles[deleteConfirm.type] || 'Konfirmasi Penghapusan Data';
          })()}</h2>
        </div>
        <div className="flex flex-col gap-3 text-[0.9rem] leading-relaxed text-muted">
          <p className="m-0">{body.intro}</p>
          {body.dependencies && body.dependencies.length > 0 && <DependencyGrid items={body.dependencies} />}
          {body.extra}
          {body.note && note && NoteIcon && (
            <p className={cn('m-0 flex items-start gap-2 rounded-md border px-3.5 py-2.5 text-[0.84rem] leading-relaxed', note.className)}>
              <NoteIcon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
              <span><strong>{body.note.label}:</strong> {body.note.text}</span>
            </p>
          )}
        </div>
        <div className="mt-1 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          {blocked ? (
            <Button onClick={close}>Mengerti</Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>Batal</Button>
              <Button variant={isReset ? 'primary' : 'danger'} onClick={runDelete}>{confirmLabel}</Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
