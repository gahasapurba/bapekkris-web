import React from 'react';
import { getDeadlineStatus } from '../utils/dateUtils';
import { 
  Building2, 
  Users, 
  Calendar, 
  UserPlus, 
  BookOpen, 
  BookmarkCheck, 
  Music, 
  MonitorPlay,
  Download,
  Image as ImageIcon,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  X,
  Search
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  tenures, 
  activeTenure, 
  onSelectTenure,
  theme,
  onToggleTheme,
  forms = [],
  pageVisibility = {},
  onOpenQuickSearch
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isDark = theme === 'dark';
  const activeFormsCount = forms.filter(f => {
    if (f.isOpen === false) return false;
    if (getDeadlineStatus(f.deadline).isExpired) return false;
    if (activeTenure?.id) {
      const fTenure = f.tenureId || f.tenure_id || (f.fields?.[0]?._tenureId) || '';
      return !fTenure || fTenure === activeTenure.id;
    }
    return true;
  }).length;

  const allNavItems = [
    { id: 'home', label: 'Beranda', icon: Building2 },
    { id: 'organisasi', label: 'Organisasi', icon: Users },
    { id: 'event', label: 'Ibadah & Event', icon: Calendar },
    { id: 'renungan', label: 'Renungan', icon: BookOpen },
    { id: 'alkitab', label: 'Alkitab', icon: BookmarkCheck },
    { id: 'lagu', label: 'Kidung & Lagu', icon: Music },
    { id: 'easyworship', label: 'Multimedia Live', icon: MonitorPlay },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'assets', label: 'Asset', icon: Download },
  ];

  const isTabVisible = (id) => {
    if (id === 'event' || id === 'program') return pageVisibility.event !== false && pageVisibility.program !== false;
    if (id === 'form' || id === 'oprec') return pageVisibility.form !== false && pageVisibility.oprec !== false;
    return pageVisibility[id] !== false;
  };

  const navItems = allNavItems.filter(tab => isTabVisible(tab.id));
  const isFormVisible = isTabVisible('form');
  const isFormActive = currentTab === 'form' || currentTab === 'oprec';

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    if (pageVisibility.home !== false) {
      setCurrentTab('home');
    } else if (navItems.length > 0) {
      setCurrentTab(navItems[0].id);
    } else if (isFormVisible) {
      setCurrentTab('form');
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-card)',
      transition: 'background 0.3s ease, border-color 0.3s ease',
      width: '100%',
      maxWidth: '100vw',
      boxSizing: 'border-box'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px',
        gap: '12px',
        width: '100%',
        maxWidth: '1500px',
        padding: '0 clamp(14px, 2vw, 28px)',
        boxSizing: 'border-box'
      }}>
        {/* 1. Left: Brand Logo & Title */}
        <div 
          onClick={handleLogoClick}
          className="navbar-brand-container"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer',
            flexShrink: 0,
            minWidth: 0,
            marginRight: 'clamp(8px, 1.5vw, 20px)'
          }}
        >
          <img 
            className="navbar-brand-logo"
            src={isDark ? "/assets/mandiri-club-bapekkris-white.png" : "/assets/mandiri-club-bapekkris-original.png"} 
            alt="Bapekkris Bank Mandiri"
            style={{
              height: '36px',
              width: 'auto',
              maxHeight: '38px',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.currentTarget.src = "/assets/mandiri-club-bapekkris-original.png";
            }}
          />
          <div className="navbar-brand-divider" style={{ height: '22px', width: '1px', background: 'var(--border-card)', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span className="navbar-brand-title" style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.01em', color: 'var(--text-main)', lineHeight: 1.15 }}>
              BAPEKKRIS
            </span>
            <span className="navbar-brand-subtitle" style={{ fontSize: '0.67rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Bank Mandiri
            </span>
          </div>
        </div>

        {/* 2. Middle: Navigation Menu Tabs (Desktop only) */}
        <nav className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(2px, 0.35vw, 6px)',
          flex: 1,
          justifyContent: 'center',
          minWidth: 0,
          padding: '2px 0',
          overflow: 'visible'
        }}>
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id || (tab.id === 'event' && currentTab === 'program') || (tab.id === 'form' && currentTab === 'oprec');

            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px clamp(5px, 0.6vw, 9px)',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? (isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 61, 121, 0.09)') : 'transparent',
                  color: isActive ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') : 'var(--text-muted)',
                  border: 'none',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Highlighted Dynamic Registration / Forms Button */}
          {isFormVisible && (
            <button
              onClick={() => handleSelectTab('form')}
              className={isFormActive ? '' : (activeFormsCount > 0 ? 'pulse-glow' : '')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px clamp(8px, 1vw, 14px)',
                borderRadius: 'var(--radius-full)',
                background: isFormActive 
                  ? 'var(--mandiri-gold)' 
                  : (activeFormsCount > 0 
                      ? (isDark ? 'rgba(255, 184, 0, 0.18)' : '#fef3c7')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9')),
                color: isFormActive 
                  ? '#040914' 
                  : (activeFormsCount > 0 ? '#b45309' : 'var(--text-muted)'),
                border: `1px solid ${activeFormsCount > 0 ? 'var(--mandiri-gold)' : 'var(--border-card)'}`,
                fontWeight: 800,
                fontSize: '0.77rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                marginLeft: 'clamp(6px, 1vw, 14px)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              <UserPlus size={13} />
              <span>Registrasi & Form</span>
              {activeFormsCount > 0 && (
                <span style={{
                  background: isFormActive ? '#040914' : 'var(--mandiri-gold)',
                  color: isFormActive ? '#ffffff' : '#040914',
                  fontSize: '0.66rem',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800
                }}>
                  {activeFormsCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* 3. Right: Utility Controls (Search, Tenure, Theme, Mobile Hamburger) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Global Quick Search Shortcut (Ctrl+K / Cmd+K) */}
          {onOpenQuickSearch && (
            <button
              type="button"
              onClick={onOpenQuickSearch}
              className="navbar-search-btn"
              title="Pencarian Cepat Bapekkris (Ctrl+K / Cmd+K)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md)',
                background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-muted)',
                fontSize: '0.76rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Search size={14} />
              <span className="navbar-search-text" style={{ fontSize: '0.74rem' }}>Cari...</span>
              <kbd style={{
                fontSize: '0.64rem',
                padding: '1px 5px',
                borderRadius: '4px',
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                color: 'var(--text-dim)',
                fontFamily: 'monospace'
              }}>
                ⌘K
              </kbd>
            </button>
          )}

          {/* Tenure Switcher Dropdown */}
          {Array.isArray(tenures) && tenures.length > 1 && (
            <div style={{ position: 'relative' }}>
              <select
                value={activeTenure?.id || ''}
                onChange={(e) => {
                  const selected = tenures.find(t => t.id === e.target.value);
                  if (selected && onSelectTenure) onSelectTenure(selected);
                }}
                style={{
                  padding: '6px 26px 6px 10px',
                  borderRadius: 'var(--radius-md)',
                  background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  outline: 'none'
                }}
              >
                {tenures.map((t) => (
                  <option key={t.id} value={t.id}>
                    Periode {t.code || t.title}{t.isActive ? ' (Aktif)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown 
                size={13} 
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'var(--text-dim)'
                }} 
              />
            </div>
          )}

          {/* Theme Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Ganti Tema Warna"
            title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
              border: '1px solid var(--border-card)',
              color: isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="mobile-burger-btn mobile-hamburger"
            aria-label="Buka Menu Navigasi"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              background: isMobileMenuOpen ? (isDark ? 'rgba(255, 184, 0, 0.15)' : '#fef3c7') : 'transparent',
              border: `1px solid ${isMobileMenuOpen ? 'var(--mandiri-gold)' : 'var(--border-card)'}`,
              color: isMobileMenuOpen ? 'var(--mandiri-gold)' : 'var(--text-main)',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {isMobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '74px',
          left: 0,
          right: 0,
          bottom: 0,
          background: isDark ? 'rgba(7, 13, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid var(--border-card)',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          zIndex: 999999,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
        }}>
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelectTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? (isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 61, 121, 0.08)') : 'transparent',
                  color: isActive ? 'var(--mandiri-gold)' : 'var(--text-main)',
                  border: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {isFormVisible && (
            <button
              onClick={() => handleSelectTab('form')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--mandiri-gold)',
                color: '#040914',
                border: 'none',
                fontSize: '0.92rem',
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserPlus size={18} />
                <span>Registrasi & Form Pendaftaran</span>
              </div>
              {activeFormsCount > 0 && (
                <span style={{
                  background: '#040914',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 800
                }}>
                  {activeFormsCount} Aktif
                </span>
              )}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
