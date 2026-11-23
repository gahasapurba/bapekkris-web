import React, { useState, useMemo } from 'react';
import { 
  Music, 
  Search, 
  Play, 
  Copy, 
  Check, 
  Share2, 
  MonitorPlay, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { soundFx } from '../utils/audio';

// Built-in Curated Christian Songbook (KJ, PKJ, NKB, & Contemporary Praise)
const DEFAULT_HYMNS = [
  {
    id: 'hymn-kj-001',
    songNumber: 'KJ 001',
    title: 'Haleluya! Pujilah',
    category: 'Kidung Jemaat',
    keySignature: 'Do = F, 4/4',
    author: 'Tradisional / Yayasan Musik Gereja (YAMUGER)',
    lyrics: `Bait 1:
Haleluya! Pujilah Allah Yang Mahatinggi!
Sang Pencipta semesta, Khalik langit dan bumi.
Mahaagung nama-Nya, patutlah disembah.
Puji Dia selamanya, haleluya!

Bait 2:
Haleluya! Pujilah Yesus Kristus Penebus!
Oleh darah yang kudus, dosa kita terhapus.
Bangkit dari kubur-Nya, menang atas maut!
Puji Dia selamanya, haleluya!

Bait 3:
Haleluya! Pujilah Roh Kudus Penghibur hati!
Membimbing umat-Nya setia sampai mati.
Puji Allah Tritunggal, Mahakuasa dan kekal,
Puji Dia selamanya, haleluya!`
  },
  {
    id: 'hymn-kj-400',
    songNumber: 'KJ 400',
    title: 'Kudaki Jalan Mulia',
    category: 'Kidung Jemaat',
    keySignature: 'Do = G, 3/4',
    author: 'Johnson Oatman Jr. / Charles H. Gabriel',
    lyrics: `Bait 1:
Kudaki jalan mulia; tetap doaku serta:
"Tuhan, tempatkan langkahku di tempat tinggi dan teguh."

Reff / Chorus:
Ya Tuhan, angkat jiwaku lebih dekat kepada-Mu;
Di tempat tinggi dan teguh, Tuhan, tempatkan langkahku!

Bait 2:
Kutak mau tinggal tercengang di jurang ragu dan bimbang;
Tujuanku tetap baka: di tempat tinggi dan teguh!

Reff / Chorus:
Ya Tuhan, angkat jiwaku lebih dekat kepada-Mu;
Di tempat tinggi dan teguh, Tuhan, tempatkan langkahku!

Bait 3:
Kuingin hidup yang benar, bebas dari racun cemar;
Umat kudus bersukacita: di tempat tinggi dan teguh!`
  },
  {
    id: 'hymn-kj-403',
    songNumber: 'KJ 403',
    title: 'Hujan Berkat Kan Tercurah',
    category: 'Kidung Jemaat',
    keySignature: 'Do = Bes, 6/8',
    author: 'Daniel W. Whittle / James McGranahan',
    lyrics: `Bait 1:
Hujan berkat ‘kan tercurah, itulah janji kudus:
hidup segar dari sorga ‘kan diberi Penebus.

Reff / Chorus:
Hujan berkat-Mu, itu yang kami perlu:
Sudah menetes berkat-Mu, biar tercurah penuh!

Bait 2:
Hujan berkat ‘kan tercurah, hidup kembali segar;
Di atas bukit dan lembah bunyi derai terdengar.

Reff / Chorus:
Hujan berkat-Mu, itu yang kami perlu:
Sudah menetes berkat-Mu, biar tercurah penuh!`
  },
  {
    id: 'hymn-pw-001',
    songNumber: 'PW 01',
    title: 'Sentuh Hatiku',
    category: 'Praise & Worship',
    keySignature: 'Do = C, 4/4',
    author: 'Jason Irwanto',
    lyrics: `Bait 1:
Betapa kumencintai segala yang tlah Terjadi
Tak pernah terpikir olehku takdir-Mu jadi begini
Engkau berikan batu ujian 'tuk membuktikan imanku
Sampai kusadar tiada yang mustahil bagi-Mu

Reff / Chorus:
Sentuh hatiku, ubah hidupku menjadi yang Kau mau
Biar kemuliaan-Mu nyata di dalam hidupku
Kuasa darah-Mu pulihkan jiwa yang hancur dan luluh
Jadikan hidupku alat kebenaran-Mu`
  },
  {
    id: 'hymn-pw-002',
    songNumber: 'PW 02',
    title: 'Kebaikan-Mu (Goodness of God)',
    category: 'Praise & Worship',
    keySignature: 'Do = G, 4/4',
    author: 'Bethel Music / Terjemahan Indonesia',
    lyrics: `Bait 1:
Kukasihi Kau, kemurahan-Mu tak gagal
Sepanjang hidupku dalam tangan-Mu
Dari saat kubangun hingga ku terlelap
Kukan bernyanyi tentang kebaikan-Mu

Reff / Chorus:
Seumur hidupku Kau setia
Seumur hidupku Kau sungguh baik
Dengan tiap nafas yang kuhembuskan
Kukan bernyanyi tentang kebaikan-Mu

Bait 2:
Kusuka suara-Mu, pimpin 'ku lewat api
Di saat tergelap, Kau hadir dekatku
Kutahu Kau Bapa, kutahu Kau Sahabat
Kutlah hidup dalam kebaikan-Mu`
  },
  {
    id: 'hymn-pw-003',
    songNumber: 'PW 03',
    title: 'Seperti Rusa Rindu Sungai-Mu',
    category: 'Praise & Worship',
    keySignature: 'Do = D, 4/4',
    author: 'Martin J. Nystrom',
    lyrics: `Bait 1:
Seperti rusa rindu sungai-Mu, jiwaku rindu Engkau
Kaulah Tuhan hasrat hatiku, kurindu menyembah-Mu

Reff / Chorus:
Kaulah kekuatanku dan perisaiku
Kepada-Mu rohku berserah
Kaulah Tuhan hasrat hatiku, kurindu menyembah-Mu`
  },
  {
    id: 'hymn-pw-004',
    songNumber: 'PW 04',
    title: 'Hidup Ini Adalah Kesempatan',
    category: 'Praise & Worship',
    keySignature: 'Do = F, 4/4',
    author: 'Pdt. Wilhelmus Latumahina',
    lyrics: `Bait 1:
Hidup ini adalah kesempatan
Hidup ini untuk melayani Tuhan
Jangan sia-siakan waktu yang Tuhan bri
Hidup ini harus jadi berkat

Reff / Chorus:
Oh Tuhan pakailah hidupku
Selagi aku masih kuat
Bila saatnya nanti ku tak berdaya lagi
Hidup ini sudah jadi berkat`
  }
];

export default function WorshipSongSection({
  songs = [],
  theme,
  onSendToEasyWorship
}) {
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Combine custom songs from Supabase with built-in hymnal library
  const combinedSongs = useMemo(() => {
    const list = [...(songs || [])];
    DEFAULT_HYMNS.forEach(dh => {
      if (!list.some(s => (s.songNumber && s.songNumber.toLowerCase() === dh.songNumber.toLowerCase()) || s.title.toLowerCase() === dh.title.toLowerCase())) {
        list.push(dh);
      }
    });
    return list.sort((a, b) => (a.songNumber || a.title || '').localeCompare(b.songNumber || b.title || ''));
  }, [songs]);

  const [activeSongId, setActiveSongId] = useState(combinedSongs[0]?.id || null);

  const activeSong = combinedSongs.find(s => s.id === activeSongId) || combinedSongs[0] || null;

  const filteredSongs = useMemo(() => {
    return combinedSongs.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (s.title || '').toLowerCase().includes(q) ||
        (s.songNumber || '').toLowerCase().includes(q) ||
        (s.lyrics || '').toLowerCase().includes(q) ||
        (s.author || '').toLowerCase().includes(q);
      const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [combinedSongs, searchQuery, selectedCategory]);

  const handleCopyLyrics = (song) => {
    if (!song) return;
    const text = `🎵 ${song.songNumber ? `[${song.songNumber}] ` : ''}${song.title}\nNada Dasar: ${song.keySignature || 'C'}\n\n${song.lyrics}\n\n(Bapekkris Bank Mandiri)`;
    try {
      navigator.clipboard.writeText(text);
      soundFx.playClick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {}
  };

  const handleSendToEasyWorship = (song) => {
    if (!onSendToEasyWorship || !song) return;
    soundFx.playClick();
    onSendToEasyWorship({
      type: 'song',
      title: `${song.songNumber ? `${song.songNumber} - ` : ''}${song.title}`,
      keySignature: song.keySignature,
      lyrics: song.lyrics
    });
  };

  return (
    <div className="worship-song-wrapper" style={{ padding: '40px 0 80px 0', position: 'relative', zIndex: 10 }}>
      <div className="container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 clamp(16px, 2vw, 32px)' }}>
        
        {/* Header Title */}
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
            <span>Kidung Jemaat & Lagu Rohani</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 900,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
            marginBottom: '14px'
          }}>
            LAGU <span style={{
              background: 'linear-gradient(135deg, #ffb800 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>PUJIAN & PENYEMBAHAN</span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            Buku kidung jemaat, nyanyian rohani, dan lagu penyembahan persekutuan Bapekkris Bank Mandiri. Siap ditampilkan langsung ke proyektor / EasyWorship.
          </p>
        </div>

        {/* 2-Column Layout: Left Song Directory, Right Lyrics View */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 400px) minmax(0, 1fr)',
          gap: '24px',
          alignItems: 'start'
        }} className="songbook-grid-layout">
          
          {/* Column 1: Search & Song Catalog */}
          <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '800px'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music size={16} color="var(--mandiri-gold)" />
              <span>Daftar Lagu ({filteredSongs.length})</span>
            </h3>

            {/* Category Filter */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'Kidung Jemaat', label: 'KJ' },
                { id: 'Pelengkap Kidung Jemaat', label: 'PKJ' },
                { id: 'Nyanyikanlah Kidung Baru', label: 'NKB' },
                { id: 'Praise & Worship', label: 'Praise & Worship' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCategory === cat.id ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                    color: selectedCategory === cat.id ? '#040914' : 'var(--text-muted)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Cari nomor lagu (KJ 400), judul, lirik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 34px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.8rem'
                }}
              />
            </div>

            {/* Song Items Scroll */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {filteredSongs.map(s => {
                const isSelected = activeSong?.id === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      soundFx.playClick();
                      setActiveSongId(s.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? (isDark ? 'rgba(255, 184, 0, 0.15)' : 'rgba(255, 184, 0, 0.12)') : 'transparent',
                      color: isSelected ? (isDark ? 'var(--mandiri-gold)' : '#003d79') : 'var(--text-main)',
                      border: isSelected ? '1px solid var(--mandiri-gold)' : '1px solid transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        {s.songNumber && (
                          <span style={{
                            fontSize: '0.66rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            background: 'rgba(255, 184, 0, 0.2)',
                            color: 'var(--mandiri-gold)',
                            fontFamily: 'monospace'
                          }}>
                            {s.songNumber}
                          </span>
                        )}
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          {s.category}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.title}
                      </div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Active Song Details & Lyrics Presentation */}
          {activeSong ? (
            <div className="glass-panel" style={{
              padding: 'clamp(24px, 3.5vw, 40px)',
              borderRadius: 'var(--radius-md)',
              border: '1.5px solid var(--mandiri-gold)',
              minHeight: '600px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              position: 'relative'
            }}>
              {/* Header Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-card)',
                paddingBottom: '18px',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    {activeSong.songNumber && (
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '4px',
                        background: 'var(--mandiri-gold)',
                        color: '#040914',
                        fontWeight: 900,
                        fontSize: '0.78rem',
                        fontFamily: 'monospace'
                      }}>
                        {activeSong.songNumber}
                      </span>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                      {activeSong.category}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                    {activeSong.title}
                  </h2>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>Nada: <strong style={{ color: 'var(--mandiri-gold)' }}>{activeSong.keySignature || 'C'}</strong></span>
                    {activeSong.author && <span>• Cipt/Pencipta: {activeSong.author}</span>}
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyLyrics(activeSong)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border-card)',
                      color: copied ? '#10b981' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Tersalin!' : 'Salin Lirik'}</span>
                  </button>

                  {onSendToEasyWorship && (
                    <button
                      type="button"
                      onClick={() => handleSendToEasyWorship(activeSong)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 18px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
                      }}
                    >
                      <MonitorPlay size={15} />
                      <span>Tampilkan di EasyWorship Live</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Formatted Lyrics Stanzas */}
              <div style={{
                fontSize: '1.05rem',
                lineHeight: 1.85,
                color: 'var(--text-main)',
                whiteSpace: 'pre-line',
                fontFamily: 'var(--font-sans)',
                padding: '10px 0'
              }}>
                {activeSong.lyrics}
              </div>

              {/* YouTube Video Accompaniment if provided */}
              {activeSong.youtubeUrl && (
                <div style={{
                  borderTop: '1px solid var(--border-card)',
                  paddingTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <a
                    href={activeSong.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#f43f5e',
                      fontSize: '0.84rem',
                      fontWeight: 700,
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>Dengarkan Iringan Musik di YouTube</span>
                  </a>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎵</div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>Pilih Lagu Pujian</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Pilih lagu dari daftar di sebelah kiri untuk melihat lirik lengkap.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

