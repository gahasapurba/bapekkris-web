import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  const [isMoreOpen, setIsMoreOpen] = React.useState(false);
  const moreMenuRef = useRef(null);

  // Close the "Lainnya" dropdown on outside click or Escape
  useEffect(() => {
    if (!isMoreOpen) return undefined;
    const handlePointer = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setIsMoreOpen(false);
    };
    const handleKey = (e) => { if (e.key === 'Escape') setIsMoreOpen(false); };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isMoreOpen]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);
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
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    // Grouped under "Lainnya" on desktop so the bar fits; listed individually in the mobile drawer
    { id: 'alkitab', label: 'Alkitab', icon: BookmarkCheck, inMoreMenu: true },
    { id: 'lagu', label: 'Kidung & Lagu', icon: Music, inMoreMenu: true },
    { id: 'easyworship', label: 'Multimedia Live', icon: MonitorPlay, inMoreMenu: true },
    { id: 'assets', label: 'Asset', icon: Download, inMoreMenu: true },
  ];

  const isTabVisible = (id) => {
    if (id === 'event' || id === 'program') return pageVisibility.event !== false && pageVisibility.program !== false;
    if (id === 'form' || id === 'oprec') return pageVisibility.form !== false && pageVisibility.oprec !== false;
    return pageVisibility[id] !== false;
  };

  const navItems = allNavItems.filter(tab => isTabVisible(tab.id));
  const primaryNavItems = navItems.filter(tab => !tab.inMoreMenu);
  const moreNavItems = navItems.filter(tab => tab.inMoreMenu);
  const isMoreActive = moreNavItems.some(tab => tab.id === currentTab);
  const isFormVisible = isTabVisible('form');
  const isFormActive = currentTab === 'form' || currentTab === 'oprec';

  const handleSelectTab = (tabId) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
    setIsMoreOpen(false);
  };

  const navButtonStyle = (isActive) => ({
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
  });

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
      zIndex: 1000,
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-card)',
      boxShadow: isDark ? '0 10px 30px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 61, 121, 0.08)',
      transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
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
          {primaryNavItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id || (tab.id === 'event' && currentTab === 'program');
            return (
              <button key={tab.id} onClick={() => handleSelectTab(tab.id)} style={navButtonStyle(isActive)} aria-current={isActive ? 'page' : undefined}>
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {moreNavItems.length > 0 && (
            <div ref={moreMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(open => !open)}
                style={navButtonStyle(isMoreActive)}
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
              >
                <span>Lainnya</span>
                <ChevronDown size={13} style={{ transform: isMoreOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>
              {isMoreOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: '200px', zIndex: 1001,
                    display: 'flex', flexDirection: 'column', gap: '2px', padding: '6px',
                    background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)'
                  }}
                >
                  {moreNavItems.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        role="menuitem"
                        onClick={() => handleSelectTab(tab.id)}
                        style={{ ...navButtonStyle(isActive), width: '100%', padding: '9px 12px', gap: '8px', fontSize: '0.82rem' }}
                      >
                        <Icon size={15} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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
        <div className="navbar-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
            <div className="navbar-tenure-container" style={{ position: 'relative' }}>
              <select
                className="navbar-tenure-select"
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
                  outline: 'none',
                  maxWidth: '120px',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
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

      {/* Mobile Drawer Navigation Menu (Rendered via React Portal into document.body to avoid header backdrop-filter clipping) */}
      {isMobileMenuOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="mobile-drawer-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
          }}
        >
          <div 
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '100%',
              maxHeight: '100dvh',
              height: '100%',
              background: isDark ? '#060d1f' : '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              overflow: 'hidden'
            }}
          >
            {/* Drawer Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-card)',
              background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
              flexShrink: 0
            }}>
              <div 
                onClick={handleLogoClick}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              >
                <img 
                  src={isDark ? "/assets/mandiri-club-bapekkris-white.png" : "/assets/mandiri-club-bapekkris-original.png"} 
                  alt="Bapekkris Bank Mandiri"
                  style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
                />
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    BAPEKKRIS
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    Bank Mandiri
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  title="Ganti Tema Warna"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    border: '1px solid var(--border-card)',
                    color: isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {isDark ? <Sun size={17} /> : <Moon size={17} />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Tutup Menu"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              WebkitOverflowScrolling: 'touch'
            }}>
              {/* Quick Search Button in Drawer */}
              {onOpenQuickSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenQuickSearch();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-muted)',
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={16} />
                    <span>Pencarian Cepat Bapekkris...</span>
                  </div>
                  <kbd style={{
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                    color: 'var(--text-dim)',
                    fontFamily: 'monospace'
                  }}>
                    ⌘K
                  </kbd>
                </button>
              )}

              {/* All Navigation Items */}
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
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isActive 
                        ? (isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(0, 61, 121, 0.08)') 
                        : 'transparent',
                      color: isActive 
                        ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') 
                        : 'var(--text-main)',
                      border: 'none',
                      fontSize: '0.94rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={18} style={{ color: isActive ? 'var(--mandiri-gold)' : 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{tab.label}</span>
                    {isActive && (
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--mandiri-gold)'
                      }} />
                    )}
                  </button>
                );
              })}

              {/* Highlighted Registration Form Tab */}
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
                    marginTop: '10px',
                    boxShadow: '0 4px 14px rgba(255, 184, 0, 0.25)'
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

              {/* Tenure Switcher if multiple tenures */}
              {Array.isArray(tenures) && tenures.length > 1 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-card)' }}>
                  <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                    Pilih Periode Kepengurusan
                  </label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={activeTenure?.id || ''}
                      onChange={(e) => {
                        const selected = tenures.find(t => t.id === e.target.value);
                        if (selected && onSelectTenure) onSelectTenure(selected);
                        setIsMobileMenuOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 32px 10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.86rem',
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
                    <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid var(--border-card)',
              background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}>
              <span>Badan Pembinaan Kerohanian Kristen</span>
              <button
                type="button"
                onClick={() => handleSelectTab('admin')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--mandiri-gold)',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Admin Portal →
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
