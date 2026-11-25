import { Trash2 } from 'lucide-react';
import { useFeedback } from '../../ui';
import { useAdminPortal } from '../AdminPortalContext';

export default function SongsTab() {
  const {
    activeTab,
    onAddWorshipSong,
    onDeleteWorshipSong,
    setSongAuthor,
    setSongCategory,
    setSongKey,
    setSongLyrics,
    setSongNumber,
    setSongSearch,
    setSongTitle,
    setSongYoutube,
    showToast,
    songAuthor,
    songCategory,
    songKey,
    songLyrics,
    songNumber,
    songSearch,
    songTitle,
    songYoutube,
    worshipSongs
  } = useAdminPortal();
  const { confirm } = useFeedback();

  return (
    <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
          Kelola Kidung Jemaat & Lagu Rohani ({worshipSongs.length})
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Database lagu pujian dan penyembahan (KJ, PKJ, NKB, P&W) yang terintegrasi dengan EasyWorship Live Bapekkris Bank Mandiri.
        </p>
      </div>

      {/* Form Tambah Lagu */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!songTitle.trim() || !songLyrics.trim()) {
            showToast('Judul lagu dan lirik wajib diisi', 'error');
            return;
          }
          if (onAddWorshipSong) {
            onAddWorshipSong({
              id: 'song-' + Date.now(),
              title: songTitle.trim(),
              songNumber: songNumber.trim() || undefined,
              category: songCategory,
              keySignature: songKey.trim() || 'C',
              author: songAuthor.trim() || '',
              lyrics: songLyrics.trim(),
              youtubeUrl: songYoutube.trim() || undefined,
              sortOrder: worshipSongs.length
            });
            setSongTitle('');
            setSongNumber('');
            setSongAuthor('');
            setSongLyrics('');
            setSongYoutube('');
            showToast(`Lagu "${songTitle.trim()}" berhasil disimpan!`);
          }
        }}
        style={{
          background: 'rgba(255,255,255,0.02)',
          padding: '20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
          + Tambah Lagu Baru ke Songbook
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Lagu *</label>
            <input
              type="text"
              placeholder="Contoh: Suci, Suci, Suci"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nomor Lagu (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: KJ 002"
              value={songNumber}
              onChange={(e) => setSongNumber(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Kategori Lagu *</label>
            <select
              value={songCategory}
              onChange={(e) => setSongCategory(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            >
              <option value="KJ">Kidung Jemaat (KJ)</option>
              <option value="PKJ">Pelengkap Kidung Jemaat (PKJ)</option>
              <option value="NKB">Nyanyikanlah Kidung Baru (NKB)</option>
              <option value="Praise & Worship">Praise & Worship Kontemporer</option>
              <option value="Lainnya">Lagu Rohani Lainnya</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nada Dasar (Key)</label>
            <input
              type="text"
              placeholder="Contoh: C, D, F, G, dll."
              value={songKey}
              onChange={(e) => setSongKey(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Pencipta / Pengarang</label>
            <input
              type="text"
              placeholder="Contoh: Reginald Heber"
              value={songAuthor}
              onChange={(e) => setSongAuthor(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>URL YouTube (Opsional)</label>
            <input
              type="text"
              placeholder="Contoh: https://youtube.com/watch?v=..."
              value={songYoutube}
              onChange={(e) => setSongYoutube(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Lirik Lagu (Pisahkan bait dengan baris kosong) *</label>
          <textarea
            rows={6}
            placeholder="Bait 1:&#10;Suci, suci, suci, Tuhan Maha Kuasa...&#10;&#10;Reff:&#10;Kuduslah Tuhan..."
            value={songLyrics}
            onChange={(e) => setSongLyrics(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            style={{
              padding: '9px 24px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--mandiri-gold)',
              color: '#040914',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            + Simpan Lagu
          </button>
        </div>
      </form>

      {/* Daftar Lagu */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Daftar Lagu ({worshipSongs.length}):
          </h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Cari lagu..."
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {worshipSongs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            Belum ada data lagu di Songbook.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {worshipSongs.filter(s => !songSearch || (s.title || '').toLowerCase().includes(songSearch.toLowerCase()) || (s.songNumber || '').toLowerCase().includes(songSearch.toLowerCase())).map((song) => (
              <div key={song.id} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-card)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span className="badge-gold" style={{ fontSize: '0.68rem' }}>{song.category}</span>
                    {song.songNumber && <span style={{ fontSize: '0.78rem', color: 'var(--mandiri-gold)', fontWeight: 700 }}>{song.songNumber}</span>}
                    {song.keySignature && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Key: {song.keySignature}</span>}
                  </div>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{song.title}</strong>
                  {song.author && <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: '10px' }}>({song.author})</span>}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (await confirm({ title: `Hapus lagu "${song.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                      if (onDeleteWorshipSong) onDeleteWorshipSong(song.id);
                      showToast('Lagu berhasil dihapus.');
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
