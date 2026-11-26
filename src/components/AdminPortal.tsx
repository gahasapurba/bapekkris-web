import { ArrowLeft, ClipboardList, Download, Globe, KeyRound, Lock, LogOut, RefreshCw, Upload } from 'lucide-react';
import AdminAccountsPanel from '../admin/AdminAccountsPanel';
import { AdminPortalContext } from '../admin/AdminPortalContext';
import AdminLoginForm from '../admin/AdminLoginForm';
import ChangePasswordDialog from '../admin/ChangePasswordDialog';
import { Badge, Button } from '../ui';
import { SYNC_BADGE } from '../admin/adminConstants';
import AdminSummaryBar from '../admin/AdminSummaryBar';
import AdminTabNavigation from '../admin/AdminTabNavigation';
import { useAdminPortalState, type AdminPortalProps } from '../admin/useAdminPortalState';
import VisibilityTab from '../admin/tabs/VisibilityTab';
import MembersTab from '../admin/tabs/MembersTab';
import RolesTab from '../admin/tabs/RolesTab';
import EventsTab from '../admin/tabs/EventsTab';
import GalleryTab from '../admin/tabs/GalleryTab';
import DivisionsTab from '../admin/tabs/DivisionsTab';
import TenureTab from '../admin/tabs/TenureTab';
import FormsTab from '../admin/tabs/FormsTab';
import SubmissionsTab from '../admin/tabs/SubmissionsTab';
import DevotionsTab from '../admin/tabs/DevotionsTab';
import SongsTab from '../admin/tabs/SongsTab';
import EasyWorshipTab from '../admin/tabs/EasyWorshipTab';
import AssetsTab from '../admin/tabs/AssetsTab';
import FaqsTab from '../admin/tabs/FaqsTab';
import PrayerRequestsTab from '../admin/tabs/PrayerRequestsTab';
import VisitorStatsTab from '../admin/tabs/VisitorStatsTab';
import AuditLogTab from '../admin/tabs/AuditLogTab';
import EditItemModal from '../admin/modals/EditItemModal';
import DeleteConfirmModal from '../admin/modals/DeleteConfirmModal';
import ExecutiveReportModal from '../admin/modals/ExecutiveReportModal';

export default function AdminPortal(props: AdminPortalProps) {
  const state = useAdminPortalState(props);
  const {
    activeTab, adminProfile, deleteConfirm, divisions, downloadBackup, editingItem, handleLogoutClick, isAuthenticated, isChangePasswordOpen,
    isDark, isSuperAdmin, onAdminLogin, onBack, onResetDefault, onRestoreBackup, restoreBackupFile, setDeleteConfirm, setIsChangePasswordOpen,
    setShowExecutiveReportModal, showExecutiveReportModal, showToast, syncStatus
  } = state;
  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-[440px] px-4 pb-24 pt-8">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={onBack} className="mb-5">Kembali ke beranda</Button>
        <div className="rounded-xl border border-line bg-surface p-7 shadow-card md:p-9">
          <div className="mb-6 text-center">
            <img src={isDark ? '/assets/mandiri-club-bapekkris-white.png' : '/assets/mandiri-club-bapekkris-original.png'} alt="Bapekkris Bank Mandiri"
              className="mx-auto mb-5 block h-12 w-auto object-contain" onError={(e) => { e.currentTarget.src = '/assets/mandiri-club-bapekkris-original.png'; }} />
            <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-gold-tint text-gold-ink"><Lock size={20} aria-hidden="true" /></span>
            <h1 className="font-display text-[1.6rem] font-semibold text-ink">Portal pengurus</h1>
            <p className="mt-1 text-[0.9rem] text-muted">Masuk untuk mengelola acara, pengurus, renungan, lagu, dan konten lainnya.</p>
          </div>
          <AdminLoginForm onLogin={onAdminLogin} showToast={showToast} />
        </div>
      </div>
    );
  }

    // Everything the extracted tabs and modals (src/admin/*) read from this component.

  return (
    <AdminPortalContext.Provider value={state}>
    <div className="admin-portal-wrapper mx-auto w-full max-w-[1360px] px-4 pb-24 pt-6 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={onBack} className="-ml-3 mb-2">Kembali ke situs</Button>
          <h1 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight text-ink">Portal pengurus</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.86rem] text-muted">
            <span>{adminProfile?.displayName || adminProfile?.email || 'Admin'} · {isSuperAdmin ? 'Super admin' : 'Admin divisi'}</span>
            <Badge tone={syncStatus === 'synced' ? 'success' : syncStatus === 'error' ? 'danger' : 'gold'}><Globe size={12} aria-hidden="true" />{SYNC_BADGE[syncStatus].label}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={<ClipboardList size={14} aria-hidden="true" />} onClick={() => setShowExecutiveReportModal(true)}>Laporan / LPJ</Button>
          <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={downloadBackup} title="Unduh cadangan lengkap seluruh data (.json)">Backup</Button>
          {onRestoreBackup && (
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[0.8rem] font-semibold text-ink hover:border-line-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy-ink" title="Pulihkan seluruh data dari file cadangan (.json)">
              <Upload size={14} aria-hidden="true" />Restore
              <input type="file" accept=".json,application/json" className="sr-only" onChange={restoreBackupFile} />
            </label>
          )}
          {onResetDefault && (
            <Button size="sm" variant="secondary" icon={<RefreshCw size={14} aria-hidden="true" />} onClick={() => setDeleteConfirm({ type: 'reset_all', id: 'reset', name: 'Sync Data' })} title="Kosongkan cache lokal dan muat ulang data terbaru">Sinkronkan</Button>
          )}
          <Button size="sm" variant="secondary" icon={<KeyRound size={14} aria-hidden="true" />} onClick={() => setIsChangePasswordOpen(true)}>Ganti password</Button>
          <Button size="sm" variant="danger" icon={<LogOut size={14} aria-hidden="true" />} onClick={handleLogoutClick} className="lg:hidden">Keluar</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
      <AdminTabNavigation onLogout={handleLogoutClick} />
      <div className="flex min-w-0 flex-col gap-6">
      <AdminSummaryBar />

      {/* TAB CONTENT: VISIBILITAS HALAMAN & NAVBAR (VIEW / HIDE) */}
      {activeTab === 'admins' && isSuperAdmin && (
        <AdminAccountsPanel divisions={divisions} currentUserId={adminProfile?.userId} showToast={showToast} />
      )}

      {activeTab === 'visibility' && <VisibilityTab />}

      {activeTab === 'prayers' && isSuperAdmin && <PrayerRequestsTab />}

      {activeTab === 'visitors' && isSuperAdmin && <VisitorStatsTab />}

      {activeTab === 'activity' && isSuperAdmin && <AuditLogTab />}

      {/* TAB CONTENT: PENGURUS & ANGGOTA (DENGAN NOMOR WA OPSIONAL) */}
      {activeTab === 'members' && <MembersTab />}

      {/* TAB CONTENT: STRUKTUR ROLE & JABATAN */}
      {activeTab === 'roles' && <RolesTab />}

      {/* TAB CONTENT: EVENT (DENGAN TANGGAL MULAI & BERAKHIR) */}
      {activeTab === 'events' && <EventsTab />}

      {/* TAB CONTENT 0: GALERI KEGIATAN DINAMIS */}
      {activeTab === 'gallery' && <GalleryTab />}

      {/* TAB CONTENT 1: DIVISI */}
      {activeTab === 'divisions' && <DivisionsTab />}

      {/* TAB CONTENT 2: TENURE */}
      {activeTab === 'tenure' && <TenureTab />}

      {/* TAB CONTENT: DYNAMIC FORM ENGINE */}
      {activeTab === 'forms' && <FormsTab />}

      {/* TAB CONTENT: SUBMISSIONS (DATA PENGISIAN FORM DINAMIS PER FORM + SELEKSI STATUS & 1-CLICK WA) */}
      {activeTab === 'submissions' && <SubmissionsTab />}

      {/* TAB CONTENT: RENUNGAN HARIAN */}
      {activeTab === 'devotions' && <DevotionsTab />}

      {/* TAB CONTENT: KIDUNG JEMAAT & LAGU ROHANI */}
      {activeTab === 'songs' && <SongsTab />}

      {/* TAB CONTENT: JADWAL EASYWORSHIP */}
      {activeTab === 'easyworship' && <EasyWorshipTab />}

      {/* TAB CONTENT: BRAND ASSETS & TEMPLATES MANAGEMENT */}
      {activeTab === 'assets' && <AssetsTab />}

      {/* TAB CONTENT: PUSAT PANDUAN & TANYA JAWAB (FAQ) */}
      {activeTab === 'faqs' && <FaqsTab />}

      {/* EDIT MODAL DIALOG */}
      {editingItem && <EditItemModal />}

      {/* CONFIRMATION DELETE DIALOG */}
      {deleteConfirm && <DeleteConfirmModal />}

      {/* PRINT-READY EXECUTIVE REPORT & LPJ MODAL */}
      {showExecutiveReportModal && <ExecutiveReportModal />}
      <ChangePasswordDialog open={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} showToast={showToast} />
      </div>
      </div>
    </div>
    </AdminPortalContext.Provider>
  );
}
