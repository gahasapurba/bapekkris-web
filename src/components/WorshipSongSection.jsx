import React, { useState, useMemo } from 'react';
import { 
  Music, 
  Search, 
  Play, 
  Copy, 
  Check, 
  Share2, 
  MonitorPlay, 
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { soundFx } from '../utils/audio';

export default function WorshipSongSection({
  songs = [],
  theme,
  onSendToEasyWorship
}) {
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Pure data from Supabase without mock/dummy/fallback hymns
  const songList = useMemo(() => {
    return [...(songs || [])].sort((a, b) => (a.songNumber || a.title || '').localeCompare(b.songNumber || b.title || ''));
  }, [songs]);

  const [activeSongId, setActiveSongId] = useState(songList[0]?.id || null);

  const activeSong = songList.find(s => s.id === activeSongId) || songList[0] || null;

  const filteredSongs = useMemo(() => {
    return songList.filter(song => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (song.title || '').toLowerCase().includes(q) ||
        (song.songNumber || '').toLowerCase().includes(q) ||
        (song.lyrics || '').toLowerCase().includes(q) ||
        (song.author || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || song.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [songList, searchQuery, selectedCategory]);

  const handleCopySong = (song) => {
    if (!song) return;
    const text = `🎵 *${song.songNumber ? `${song.songNumber} - ` : ''}${song.title}*\nNada Dasar: ${song.keySignature || '-'}\nKategori: ${song.category || 'Lagu Rohani'}\n\n${song.lyrics}\n\n_Bapekkris Bank Mandiri_\nhttps://bapekkris-mandiri.netlify.app/#lagu`;
    try {
      navigator.clipboard.writeText(text);
      soundFx.playClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handleSendToProjector = (song) => {
    if (!onSendToEasyWorship || !song) return;
    soundFx.playClick();
    onSendToEasyWorship({
      type: 'song',
      title: `${song.songNumber ? `${song.songNumber} - ` : ''}${song.title}`,
      text: song.lyrics,
      keySignature: song.keySignature
    });
  };

  return (
    <div className="worship-song-section" style={{ padding: '40px 0 80px 0', position: 'relative', zIndex: 10 }}>
      <div className="container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 clamp(16px, 2vw, 32px)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 36px auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 184, 0, 0.15)',
            border: '1px solid rgba(255, 184, 0, 0.35)',
            color: 'var(--mandiri-gold)',
            fontSize: '0.78rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            <Music size={14} />
            <span>Kidung Jemaat, PKJ, NKB & Praise</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 900,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
            marginBottom: '14px'
          }}>
            KIDUNG JEMAAT & <span style={{
              background: 'linear-gradient(135deg, #ffb800 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>LAGU ROHANI</span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            Kumpulan lagu pujian dan penyembahan jemaat Bapekkris Bank Mandiri. Dilengkapi lirik lengkap, nada dasar, dan integrasi proyektor EasyWorship ibadah.
          </p>
        </div>

        {songList.length === 0 ? (
          <div className="glass-panel" style={{
            textAlign: 'center',
            padding: '64px 24px',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--border-card)',
            maxWidth: '680px',
            margin: '0 auto',
            width: '100%'
          }}>
            <Music size={48} color="var(--mandiri-gold)" style={{ opacity: 0.6, margin: '0 auto 16px auto', display: 'block' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
              Belum Ada Lagu Rohani / Kidung Jemaat
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
              Daftar pujian dan kidung jemaat di database masih kosong. Silakan tambahkan lagu rohani melalui Admin Portal.
            </p>
          </div>
        ) : (
          <>
            {/* Category Pills & Search */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '28px'
            }}>
              {/* Categories */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['ALL', 'Kidung Jemaat', 'Pelengkap Kidung Jemaat', 'Nyanyikanlah Kidung Baru', 'Praise & Worship'].map(cat => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedCategory(cat);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                        color: isSelected ? '#001a33' : 'var(--text-main)',
                        border: isSelected ? '1px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                        fontSize: '0.82rem',
                        fontWeight: isSelected ? 800 : 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cat === 'ALL' ? 'Semua Lagu' : cat}
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div style={{ position: 'relative', width: 'clamp(240px, 30vw, 360px)' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input
                  type="text"
                  placeholder="Cari judul lagu, lirik, nomor KJ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.84rem'
                  }}
                />
              </div>
            </div>

            {/* 2-Column Layout: Song List & Active Song Display */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 420px) minmax(0, 1fr)',
              gap: '24px',
              alignItems: 'start'
            }} className="worship-grid-layout">
              
              {/* Left Column: Song List */}
              <div className="glass-panel worship-list-col" style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-card)',
                padding: '16px',
                maxHeight: '680px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0 4px 10px 4px',
                  borderBottom: '1px solid var(--border-card)',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  fontWeight: 700
                }}>
                  <span>DAFTAR LAGU ({filteredSongs.length})</span>
                  <span>PILIH UNTUK LIHAT LIRIK</span>
                </div>

                {filteredSongs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-dim)' }}>
                    <Music size={32} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: '0.88rem' }}>Tidak menemukan lagu yang cocok dengan pencarian.</p>
                  </div>
                ) : (
                  filteredSongs.map(song => {
                    const isSelected = activeSong?.id === song.id;
                    return (
                      <button
                        key={song.id}
                        onClick={() => {
                          soundFx.playClick();
                          setActiveSongId(song.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSelected ? (isDark ? 'rgba(255, 184, 0, 0.14)' : 'rgba(0, 61, 121, 0.08)') : 'transparent',
                          border: isSelected ? '1px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                          color: isSelected ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') : 'var(--text-main)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            {song.songNumber && (
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: isDark ? 'rgba(255, 184, 0, 0.2)' : 'rgba(0, 61, 121, 0.1)',
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                fontFamily: 'monospace'
                              }}>
                                {song.songNumber}
                              </span>
                            )}
                            <span style={{
                              fontWeight: isSelected ? 800 : 600,
                              fontSize: '0.88rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {song.title}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                            {song.category} {song.keySignature ? `• ${song.keySignature}` : ''}
                          </div>
                        </div>
                        <ChevronRight size={16} style={{ color: isSelected ? 'var(--mandiri-gold)' : 'var(--text-dim)', flexShrink: 0 }} />
                      </button>
                    );
                  })
                )}
              </div>

              {/* Right Column: Song Lyric & Action Screen */}
              <div className="glass-panel" style={{
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--border-card)',
                padding: 'clamp(20px, 3vw, 36px)',
                minHeight: '680px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                {activeSong ? (
                  <div>
                    {/* Header Info */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid var(--border-card)',
                      paddingBottom: '20px',
                      marginBottom: '24px',
                      flexWrap: 'wrap',
                      gap: '16px'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                          {activeSong.songNumber && (
                            <span className="badge-gold" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                              {activeSong.songNumber}
                            </span>
                          )}
                          <span className="badge-cyan" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                            {activeSong.category || 'Lagu Rohani'}
                          </span>
                          {activeSong.keySignature && (
                            <span style={{
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              color: 'var(--mandiri-gold)',
                              background: 'rgba(255, 184, 0, 0.1)',
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-full)'
                            }}>
                              Nada: {activeSong.keySignature}
                            </span>
                          )}
                        </div>

                        <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                          {activeSong.title}
                        </h2>
                        {activeSong.author && (
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                            Karya / Syair: <strong>{activeSong.author}</strong>
                          </p>
                        )}
                      </div>

                      {/* Top Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleCopySong(activeSong)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--input-bg)',
                            border: '1px solid var(--border-card)',
                            color: copied ? '#10b981' : 'var(--text-main)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copied ? 'Tersalin' : 'Salin Lirik'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendToProjector(activeSong)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'linear-gradient(135deg, #003d79 0%, #0284c7 100%)',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                          }}
                        >
                          <MonitorPlay size={14} />
                          <span>Tampilkan di Proyektor</span>
                        </button>
                      </div>
                    </div>

                    {/* Lyrics Body */}
                    <div style={{
                      background: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.6)',
                      padding: 'clamp(20px, 3vw, 32px)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-card)',
                      whiteSpace: 'pre-line',
                      fontFamily: 'inherit',
                      fontSize: 'clamp(1rem, 1.4vw, 1.15rem)',
                      lineHeight: 1.8,
                      color: 'var(--text-main)'
                    }}>
                      {activeSong.lyrics}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                    <BookOpen size={48} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
                    <p>Pilih lagu dari daftar di sebelah kiri untuk melihat lirik.</p>
                  </div>
                )}

                {/* Bottom Bar Info */}
                <div style={{
                  marginTop: '28px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  color: 'var(--text-dim)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <span>Kidung Jemaat & Nyanyian Rohani Bapekkris Bank Mandiri</span>
                  <span>Terintegrasi EasyWorship Live</span>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
