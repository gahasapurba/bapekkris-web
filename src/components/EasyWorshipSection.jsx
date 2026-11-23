import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MonitorPlay, 
  Tv, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Music, 
  BookOpen, 
  Type, 
  Sliders, 
  Maximize2, 
  Layers, 
  Radio, 
  Sparkles,
  ExternalLink,
  Save,
  Check,
  ChevronRight
} from 'lucide-react';
import { soundFx } from '../utils/audio';
import { BIBLE_BOOKS } from './BibleSection';
import { BIBLE_SONG_COLLECTION } from '../data/hymnalLibrary';

// Helper to break song lyrics into distinct slide stanzas
function parseTextToSlides(rawText = '') {
  if (!rawText) return [];
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  // Split by double newline or Stanza labels
  const parts = normalized.split(/\n\s*\n/);
  return parts.map((part, index) => {
    const trimmed = part.trim();
    let label = `Slide ${index + 1}`;
    if (/^bait\s*\d+/i.test(trimmed)) {
      const match = trimmed.match(/^bait\s*(\d+)/i);
      label = `Bait ${match ? match[1] : index + 1}`;
    } else if (/^reff|^chorus/i.test(trimmed)) {
      label = 'Reff / Chorus';
    } else if (/^bridge/i.test(trimmed)) {
      label = 'Bridge';
    } else if (/^ending|^coda/i.test(trimmed)) {
      label = 'Ending';
    }
    return {
      index,
      label,
      text: trimmed
    };
  });
}

export default function EasyWorshipSection({
  songs = [],
  theme,
  initialItem
}) {
  const isDark = theme === 'dark';

  // Koleksi lagu lengkap (Pustaka Himne Kanonik + custom dari Supabase)
  const availableSongs = useMemo(() => {
    const list = [...BIBLE_SONG_COLLECTION];
    (songs || []).forEach(customSong => {
      const idx = list.findIndex(s => 
        (customSong.id && s.id === customSong.id) ||
        (customSong.songNumber && s.songNumber?.toLowerCase() === customSong.songNumber?.toLowerCase())
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...customSong };
      } else {
        list.push(customSong);
      }
    });
    return list.sort((a, b) => (a.songNumber || a.title || '').localeCompare(b.songNumber || b.title || ''));
  }, [songs]);

  // Master Playlist / Service Order state
  const [playlist, setPlaylist] = useState(() => {
    try {
      const saved = localStorage.getItem('bapekkris_ew_playlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeItemId, setActiveItemId] = useState(playlist[0]?.id || null);
  const activeItem = playlist.find(p => p.id === activeItemId) || playlist[0] || null;

  // Slides of the currently selected playlist item
  const slides = useMemo(() => {
    return parseTextToSlides(activeItem?.text || '');
  }, [activeItem]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Live Presentation State (What is displayed on the projector)
  const [liveState, setLiveState] = useState(() => {
    try {
      const saved = localStorage.getItem('bapekkris_ew_live_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      type: 'logo',
      title: 'BAPEKKRIS BANK MANDIRI',
      text: 'Badan Pembinaan Kerohanian Kristen PT Bank Mandiri (Persero) Tbk.',
      isBlackout: false,
      isClearText: false,
      isLogo: true,
      isLowerThird: false,
      bgTheme: 'cathedral',
      fontSize: 48
    };
  });

  // Modal Add Item states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState('song'); // 'song' | 'bible' | 'custom'
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [selectedBibleBook, setSelectedBibleBook] = useState(BIBLE_BOOKS[0]);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState(1);
  const [selectedBibleVerse, setSelectedBibleVerse] = useState('1');
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const filteredAvailableSongs = useMemo(() => {
    const q = songSearchQuery.toLowerCase().trim();
    if (!q) return availableSongs.slice(0, 50);
    return availableSongs.filter(s => 
      (s.title || '').toLowerCase().includes(q) || 
      (s.songNumber || '').toLowerCase().includes(q) || 
      (s.lyrics || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }, [availableSongs, songSearchQuery]);

  // Handle incoming initialItem (e.g. from Alkitab or Kidung Jemaat "Kirim ke EasyWorship")
  useEffect(() => {
    if (initialItem && initialItem.title) {
      const newItem = {
        id: `ew-${Date.now()}`,
        type: initialItem.type || 'custom',
        title: initialItem.title,
        subtitle: initialItem.type === 'bible' ? 'Pembacaan Alkitab' : 'Lagu Pujian',
        text: initialItem.lyrics || initialItem.text || ''
      };
      setPlaylist(prev => [newItem, ...prev]);
      setActiveItemId(newItem.id);
      setActiveSlideIndex(0);
      handleGoLive(newItem, 0);
    }
  }, [initialItem]);

  // Sync live state to BroadcastChannel & LocalStorage
  const broadcastLiveState = (nextState) => {
    setLiveState(nextState);
    try {
      localStorage.setItem('bapekkris_ew_live_state', JSON.stringify(nextState));
      const channel = new BroadcastChannel('bapekkris_easyworship');
      channel.postMessage(nextState);
      channel.close();
    } catch (e) {}
  };

  // Push specific slide to LIVE
  const handleGoLive = (item, slideIdx = 0) => {
    soundFx.playClick();
    const targetItem = item || activeItem;
    if (!targetItem) return;
    const itemSlides = parseTextToSlides(targetItem.text);
    const targetSlide = itemSlides[slideIdx] || itemSlides[0];

    const next = {
      ...liveState,
      type: targetItem.type,
      title: targetItem.title,
      text: targetSlide ? targetSlide.text : targetItem.text,
      isBlackout: false,
      isClearText: false,
      isLogo: false
    };
    broadcastLiveState(next);
  };

  // Keyboard navigation for presentation slides
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea', 'select'].includes(e.target.tagName?.toLowerCase())) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (slides.length > 0 && activeSlideIndex < slides.length - 1) {
          const nextIdx = activeSlideIndex + 1;
          setActiveSlideIndex(nextIdx);
          handleGoLive(activeItem, nextIdx);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (slides.length > 0 && activeSlideIndex > 0) {
          const prevIdx = activeSlideIndex - 1;
          setActiveSlideIndex(prevIdx);
          handleGoLive(activeItem, prevIdx);
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleToggleBlackout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides, activeSlideIndex, activeItem, liveState]);

  // Master Action Controls
  const handleToggleBlackout = () => {
    soundFx.playClick();
    broadcastLiveState({ ...liveState, isBlackout: !liveState.isBlackout });
  };

  const handleToggleClearText = () => {
    soundFx.playClick();
    broadcastLiveState({ ...liveState, isClearText: !liveState.isClearText });
  };

  const handleToggleLogo = () => {
    soundFx.playClick();
    broadcastLiveState({ ...liveState, isLogo: !liveState.isLogo, isBlackout: false, isClearText: false });
  };

  const handleOpenProjectorWindow = () => {
    soundFx.playClick();
    window.open('/?mode=projector#projector', 'BapekkrisProjectorOutput', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleSavePlaylist = () => {
    try {
      localStorage.setItem('bapekkris_ew_playlist', JSON.stringify(playlist));
      soundFx.playClick();
      setToastMsg('Susunan Tata Ibadah berhasil disimpan!');
      setTimeout(() => setToastMsg(''), 2500);
    } catch (e) {}
  };

  const handleAddItemToPlaylist = (newItem) => {
    setPlaylist(prev => [...prev, newItem]);
    setActiveItemId(newItem.id);
    setActiveSlideIndex(0);
    setIsAddModalOpen(false);
  };

  return (
    <div className="easyworship-wrapper" style={{ padding: '30px 0 80px 0', position: 'relative', zIndex: 10 }}>
      <div className="container" style={{ maxWidth: '1500px', margin: '0 auto', padding: '0 clamp(14px, 2vw, 28px)' }}>
        
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '18px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 184, 0, 0.15)',
              color: 'var(--mandiri-gold)',
              fontSize: '0.74rem',
              fontWeight: 800,
              marginBottom: '6px'
            }}>
              <Radio size={14} className="pulse-glow" />
              <span>MULTIMEDIA WORSHIP CONSOLE (EASYWORSHIP-STYLE)</span>
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
              Sistem Presentasi Multimedia Ibadah
            </h1>
          </div>

          {/* Quick Action Top Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenProjectorWindow}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #0284c7 0%, #003d79 100%)',
                color: '#ffffff',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                fontSize: '0.84rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.4)'
              }}
              title="Buka Layar Penuh di Monitor Kedua / Proyektor HDMI"
            >
              <ExternalLink size={15} />
              <span>Buka Layar Proyektor (Window)</span>
            </button>

            <button
              type="button"
              onClick={handleSavePlaylist}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--input-bg)',
                border: '1px solid var(--border-card)',
                color: 'var(--text-main)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Save size={15} />
              <span>{toastMsg ? 'Tersimpan!' : 'Simpan Tata Ibadah'}</span>
            </button>
          </div>
        </div>

        {/* 3-Panel Main Layout: 
            1. Left: Order of Service (Playlist)
            2. Middle: Slide Breakdown
            3. Right: Live Output Monitor & Controls */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 340px) minmax(320px, 420px) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }} className="easyworship-3col-layout">
          
          {/* PANEL 1: TATA IBADAH (PLAYLIST) */}
          <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '820px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="var(--mandiri-gold)" />
                <span>Tata Ibadah ({playlist.length})</span>
              </h3>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--mandiri-gold)',
                  color: '#040914',
                  border: 'none',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                <span>Tambah Item</span>
              </button>
            </div>

            {/* Playlist Items Scroll */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {playlist.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '36px 14px',
                  color: 'var(--text-muted)',
                  border: '1px dashed var(--border-card)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <BookOpen size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.82rem', margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>Tata Ibadah Masih Kosong</p>
                  <p style={{ fontSize: '0.74rem', margin: '4px 0 0 0', color: 'var(--text-dim)' }}>
                    Klik "+ Tambah Item" atau kirim lagu/ayat dari menu Kidung Jemaat & Alkitab.
                  </p>
                </div>
              ) : playlist.map((item, idx) => {
                const isSelected = activeItem?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      soundFx.playClick();
                      setActiveItemId(item.id);
                      setActiveSlideIndex(0);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? (isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(0, 61, 121, 0.09)') : 'var(--input-bg)',
                      border: isSelected ? '1.5px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '4px',
                        background: isSelected ? 'var(--mandiri-gold)' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#040914' : 'var(--text-dim)',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                          {item.subtitle || item.type}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylist(prev => prev.filter(p => p.id !== item.id));
                      }}
                      title="Hapus item dari tata ibadah"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PANEL 2: SLIDE BREAKDOWN (PREVIEW / STAGING) */}
          <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '820px'
          }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                Pecahan Slide: {activeItem?.title || 'Pilih Item'}
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: 0 }}>
                Klik pada bait/ayat untuk langsung mengirimkannya ke Layar Live (Gunakan tombol Panah Bawah / Atas).
              </p>
            </div>

            {/* Slides Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {slides.map((s, sIdx) => {
                const isCurrentSlide = activeSlideIndex === sIdx;
                return (
                  <div
                    key={sIdx}
                    onClick={() => {
                      setActiveSlideIndex(sIdx);
                      handleGoLive(activeItem, sIdx);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: isCurrentSlide ? (isDark ? 'rgba(255, 184, 0, 0.16)' : 'rgba(255, 184, 0, 0.12)') : 'var(--input-bg)',
                      border: isCurrentSlide ? '2px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: isCurrentSlide ? 'var(--mandiri-gold)' : 'rgba(255,255,255,0.06)',
                        color: isCurrentSlide ? '#040914' : 'var(--mandiri-gold)',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        fontFamily: 'monospace'
                      }}>
                        {s.label}
                      </span>

                      {isCurrentSlide && (
                        <span style={{ fontSize: '0.66rem', color: '#10b981', fontWeight: 800 }}>
                          ● TAMPIL DI LIVE
                        </span>
                      )}
                    </div>

                    <p style={{
                      fontSize: '0.82rem',
                      lineHeight: 1.5,
                      color: 'var(--text-main)',
                      margin: 0,
                      whiteSpace: 'pre-line'
                    }}>
                      {s.text}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Slide Navigation Buttons */}
            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-card)', paddingTop: '12px' }}>
              <button
                type="button"
                disabled={activeSlideIndex <= 0}
                onClick={() => {
                  const prev = Math.max(0, activeSlideIndex - 1);
                  setActiveSlideIndex(prev);
                  handleGoLive(activeItem, prev);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: activeSlideIndex <= 0 ? 'var(--text-dim)' : 'var(--text-main)',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: activeSlideIndex <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ▲ Slide Sebelumnya
              </button>

              <button
                type="button"
                disabled={activeSlideIndex >= slides.length - 1}
                onClick={() => {
                  const next = Math.min(slides.length - 1, activeSlideIndex + 1);
                  setActiveSlideIndex(next);
                  handleGoLive(activeItem, next);
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--mandiri-gold)',
                  border: 'none',
                  color: '#040914',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: activeSlideIndex >= slides.length - 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ▼ Slide Berikutnya
              </button>
            </div>
          </div>

          {/* PANEL 3: LIVE OUTPUT MONITOR & CONTROLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Monitor Frame */}
            <div className="glass-panel" style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '2px solid var(--border-card)',
              background: '#040914',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: liveState.isBlackout ? '#64748b' : '#ef4444',
                    boxShadow: liveState.isBlackout ? 'none' : '0 0 10px #ef4444'
                  }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.05em' }}>
                    {liveState.isBlackout ? 'LAYAR PADAM (BLACKOUT)' : (liveState.isLogo ? 'LAYAR LOGO' : 'LIVE ON AIR')}
                  </span>
                </div>

                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                  16:9 HD Display Output
                </span>
              </div>

              {/* Rendered Live Screen Display */}
              <div style={{
                aspectRatio: '16/9',
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: liveState.isLowerThird ? 'flex-end' : 'center',
                alignItems: 'center',
                padding: '24px',
                textAlign: 'center',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                background: liveState.isBlackout 
                  ? '#000000' 
                  : (liveState.bgTheme === 'heavenly' 
                      ? 'linear-gradient(135deg, #001c3d 0%, #003d79 40%, #ffb800 100%)' 
                      : (liveState.bgTheme === 'celestial' 
                          ? 'radial-gradient(circle at center, #003d79 0%, #021226 70%, #010814 100%)' 
                          : 'linear-gradient(135deg, #040914 0%, #002244 45%, #003d79 80%, #040914 100%)'))
              }}>
                {liveState.isLogo && !liveState.isClearText && (
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>✝️</div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '0 0 4px 0' }}>BAPEKKRIS BANK MANDIRI</h2>
                    <p style={{ fontSize: '0.8rem', color: '#ffb800', margin: 0 }}>Badan Pembinaan Kerohanian Kristen</p>
                  </div>
                )}

                {!liveState.isLogo && !liveState.isClearText && (
                  <div style={{
                    width: '100%',
                    padding: liveState.isLowerThird ? '12px 18px' : '0',
                    background: liveState.isLowerThird ? 'rgba(0, 20, 45, 0.9)' : 'transparent',
                    borderTop: liveState.isLowerThird ? '2px solid #ffb800' : 'none'
                  }}>
                    {liveState.title && (
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffb800', marginBottom: '8px' }}>
                        {liveState.title}
                      </div>
                    )}
                    <div style={{
                      fontSize: liveState.isLowerThird ? '0.9rem' : '1.15rem',
                      fontWeight: 800,
                      lineHeight: 1.45,
                      textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                      whiteSpace: 'pre-line'
                    }}>
                      {liveState.text}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Operator Control Deck */}
            <div className="glass-panel" style={{
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Tombol Kontrol Cepat Operator:
              </h4>

              {/* Master Push Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleToggleBlackout}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: liveState.isBlackout ? '#ef4444' : 'var(--input-bg)',
                    color: liveState.isBlackout ? '#ffffff' : 'var(--text-main)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {liveState.isBlackout ? '✕ Matikan Hitam' : '◼ Layar Hitam (F5)'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleClearText}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: liveState.isClearText ? '#f59e0b' : 'var(--input-bg)',
                    color: liveState.isClearText ? '#040914' : 'var(--text-main)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {liveState.isClearText ? 'Tampilkan Teks' : 'Bersihkan Teks'}
                </button>

                <button
                  type="button"
                  onClick={handleToggleLogo}
                  style={{
                    padding: '10px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: liveState.isLogo ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                    color: liveState.isLogo ? '#040914' : 'var(--text-main)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  ✝️ Layar Logo
                </button>
              </div>

              {/* Theme & Layout Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    Tema Latar Belakang:
                  </label>
                  <select
                    value={liveState.bgTheme || 'cathedral'}
                    onChange={(e) => broadcastLiveState({ ...liveState, bgTheme: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.78rem'
                    }}
                  >
                    <option value="cathedral">Cathedral Stained Glass (Default)</option>
                    <option value="heavenly">Heavenly Golden Dawn</option>
                    <option value="celestial">Celestial Deep Navy</option>
                    <option value="minimal">Minimalist Black</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    Mode Tampilan:
                  </label>
                  <button
                    type="button"
                    onClick={() => broadcastLiveState({ ...liveState, isLowerThird: !liveState.isLowerThird })}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: liveState.isLowerThird ? 'rgba(56, 189, 248, 0.2)' : 'var(--input-bg)',
                      border: `1px solid ${liveState.isLowerThird ? 'var(--neon-cyan)' : 'var(--border-card)'}`,
                      color: liveState.isLowerThird ? 'var(--neon-cyan)' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {liveState.isLowerThird ? '✓ Mode Lower-Third (OBS)' : 'Mode Layar Penuh'}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* MODAL: TAMBAH ITEM KE PLAYLIST TATA IBADAH */}
        {isAddModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '600px',
              borderRadius: 'var(--radius-md)',
              padding: '24px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Tambah Item ke Tata Ibadah
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1.2rem' }}
                >
                  ✕
                </button>
              </div>

              {/* Source Tabs */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'song', label: 'Lagu Pujian / KJ' },
                  { id: 'bible', label: 'Ayat Alkitab' },
                  { id: 'custom', label: 'Teks / Pengumuman' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setAddTab(t.id)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: 'var(--radius-sm)',
                      background: addTab === t.id ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                      color: addTab === t.id ? '#040914' : 'var(--text-muted)',
                      border: '1px solid var(--border-card)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab 1: Song Picker */}
              {addTab === 'song' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Ketik judul lagu atau nomor (misal KJ 001)..."
                    value={songSearchQuery}
                    onChange={(e) => setSongSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem'
                    }}
                  />

                  <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {filteredAvailableSongs.length === 0 ? (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                        Tidak menemukan lagu yang cocok. Anda dapat menambahkan slide kustom pada tab Teks Kustom di atas.
                      </div>
                    ) : filteredAvailableSongs.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleAddItemToPlaylist({
                          id: `ew-${Date.now()}`,
                          type: 'song',
                          title: `${s.songNumber ? `${s.songNumber} - ` : ''}${s.title}`,
                          subtitle: s.category || 'Lagu Pujian',
                          text: s.lyrics || s.text || ''
                        })}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: 'var(--text-main)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
                          <div>
                            <span style={{ color: 'var(--mandiri-gold)', marginRight: '6px', fontFamily: 'monospace' }}>
                              {s.songNumber ? `[${s.songNumber}]` : ''}
                            </span>
                            <span>{s.title}</span>
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 500, flexShrink: 0 }}>
                            {s.category}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Bible Picker */}
              {addTab === 'bible' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '8px' }}>
                    <select
                      value={selectedBibleBook.id}
                      onChange={(e) => setSelectedBibleBook(BIBLE_BOOKS.find(b => b.id === e.target.value) || BIBLE_BOOKS[0])}
                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    >
                      {BIBLE_BOOKS.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Pasal"
                      value={selectedBibleChapter}
                      onChange={(e) => setSelectedBibleChapter(Number(e.target.value) || 1)}
                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    />

                    <input
                      type="text"
                      placeholder="Ayat (1-3)"
                      value={selectedBibleVerse}
                      onChange={(e) => setSelectedBibleVerse(e.target.value)}
                      style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.8rem' }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddItemToPlaylist({
                      id: `ew-${Date.now()}`,
                      type: 'bible',
                      title: `${selectedBibleBook.name} ${selectedBibleChapter}:${selectedBibleVerse}`,
                      subtitle: 'Pembacaan Alkitab',
                      text: `${selectedBibleBook.name} ${selectedBibleChapter}:${selectedBibleVerse}`
                    })}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--mandiri-gold)',
                      color: '#040914',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    + Tambahkan Ayat ke Playlist
                  </button>
                </div>
              )}

              {/* Tab 3: Custom Text */}
              {addTab === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input
                    type="text"
                    placeholder="Judul Slide (misal: Warta Jemaat / Tema Khotbah)"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem'
                    }}
                  />

                  <textarea
                    rows={4}
                    placeholder="Isi teks atau pengumuman yang ingin ditampilkan di layar..."
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: 'var(--text-main)',
                      fontSize: '0.82rem'
                    }}
                  />

                  <button
                    type="button"
                    disabled={!customTitle.trim()}
                    onClick={() => {
                      handleAddItemToPlaylist({
                        id: `ew-${Date.now()}`,
                        type: 'custom',
                        title: customTitle,
                        subtitle: 'Pengumuman / Liturgi',
                        text: customText
                      });
                      setCustomTitle('');
                      setCustomText('');
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--mandiri-gold)',
                      color: '#040914',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      cursor: !customTitle.trim() ? 'not-allowed' : 'pointer'
                    }}
                  >
                    + Tambahkan Slide Custom
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

