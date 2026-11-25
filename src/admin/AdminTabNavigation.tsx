import { BookOpen, Calendar, CalendarDays, ClipboardList, Download, Eye, FileCheck2, Image as ImageIcon, Layers, Menu, MessageSquare, MonitorPlay, Music, Settings, Shield, Users, X } from 'lucide-react';
import { DIVISION_ADMIN_TABS } from './adminConstants';
import { createPortal } from 'react-dom';
import { useAdminPortal } from './AdminPortalContext';

export default function AdminTabNavigation() {
  const {
    activeTab,
    applications,
    brandAssets,
    devotions,
    divisions,
    easyWorshipSchedules,
    events,
    faqs,
    forms,
    galleries,
    isAdminMobileMenuOpen,
    isDark,
    isSuperAdmin,
    members,
    setActiveTab,
    setIsAdminMobileMenuOpen,
    submissions,
    tenureRoles,
    tenures,
    worshipSongs
  } = useAdminPortal();

  const adminTabList = [
    { id: 'members', label: `Pengurus & Pelayan (${members.length})`, icon: Users },
    { id: 'roles', label: `Role & Jabatan (${tenureRoles.length})`, icon: Shield },
    { id: 'divisions', label: `Kelola Divisi (${divisions.length})`, icon: Layers },
    { id: 'devotions', label: `Renungan Harian (${devotions.length})`, icon: BookOpen },
    { id: 'songs', label: `Kidung & Lagu (${worshipSongs.length})`, icon: Music },
    { id: 'easyworship', label: `Jadwal EasyWorship (${easyWorshipSchedules.length})`, icon: MonitorPlay },
    { id: 'events', label: `Ibadah & Event (${events.length})`, icon: CalendarDays },
    { id: 'forms', label: `Kelola Formulir (${forms.length})`, icon: ClipboardList },
    { id: 'submissions', label: `Data Pendaftaran (${submissions.length + applications.length})`, icon: FileCheck2 },
    { id: 'gallery', label: `Galeri Kegiatan (${galleries.length})`, icon: ImageIcon },
    { id: 'assets', label: `Asset (${brandAssets.length})`, icon: Download },
    { id: 'faqs', label: `Panduan & FAQ (${faqs.length})`, icon: MessageSquare },
    { id: 'tenure', label: `Periode Kepengurusan (${tenures.length})`, icon: Calendar },
    { id: 'visibility', label: 'Visibilitas Menu Website', icon: Eye },
    { id: 'admins', label: 'Kelola Admin', icon: Shield },
  ].filter(tab => (isSuperAdmin ? true : DIVISION_ADMIN_TABS.includes(tab.id)));
  const activeTabObj = adminTabList.find(t => t.id === activeTab) || adminTabList[0];
  const ActiveTabIcon = activeTabObj.icon;

  return (
    <>
      {/* Mobile Admin Navigation Header & Hamburger Bar */}
      <div className="admin-mobile-tabs-bar glass-panel" style={{
        padding: '10px 14px',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        borderRadius: 'var(--radius-md)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            Tab Admin:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: 'var(--mandiri-gold)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <ActiveTabIcon size={16} />
            <span>{activeTabObj.label}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdminMobileMenuOpen(!isAdminMobileMenuOpen)}
          className="admin-mobile-burger-btn"
          aria-label="Pilih Menu Admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            background: isAdminMobileMenuOpen ? 'var(--mandiri-gold)' : 'rgba(255, 184, 0, 0.15)',
            border: '1px solid var(--mandiri-gold)',
            color: isAdminMobileMenuOpen ? '#040914' : 'var(--mandiri-gold)',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            flexShrink: 0
          }}
        >
          {isAdminMobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
          <span>Menu Admin</span>
        </button>
      </div>

      {/* Mobile Admin Navigation Drawer / Bottom Sheet (Rendered to document.body to prevent clipping / behind card issues) */}
      {isAdminMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div 
          onClick={() => setIsAdminMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 0
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: isDark ? '#0b1329' : '#ffffff',
              borderTop: '1.5px solid var(--border-card)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px 16px 28px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -15px 40px rgba(0,0,0,0.6)'
            }}
          >
            {/* Header Modal */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-card)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} color="var(--mandiri-gold)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
                    Pilih Menu Admin
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Beralih ke tab pengelolaan data Bapekkris
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminMobileMenuOpen(false)}
                aria-label="Tutup Menu"
                style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-main)',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              overflowY: 'auto',
              paddingRight: '2px',
              WebkitOverflowScrolling: 'touch'
            }}>
              {adminTabList.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsAdminMobileMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isActive ? 'var(--mandiri-gold)' : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'),
                      color: isActive ? '#040914' : 'var(--text-main)',
                      border: isActive ? 'none' : '1px solid var(--border-card)',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.88rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {isActive && (
                      <span style={{
                        fontSize: '0.72rem',
                        background: '#040914',
                        color: 'var(--mandiri-gold)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontWeight: 800
                      }}>
                        Aktif
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Desktop Tabs */}
      <div className="admin-desktop-tabs glass-panel" style={{
        padding: '8px',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        {adminTabList.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? 'var(--mandiri-gold)' : 'transparent',
                color: isActive ? '#040914' : 'var(--text-muted)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );

}
