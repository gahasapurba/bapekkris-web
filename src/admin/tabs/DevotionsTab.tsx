import { Trash2 } from 'lucide-react';
import { useAdminPortal } from '../AdminPortalContext';

export default function DevotionsTab() {
  const {
    activeTab,
    devotionAuthor,
    devotionBody,
    devotionDate,
    devotionPrayer,
    devotionScriptureRef,
    devotionScriptureText,
    devotionTheme,
    devotionTitle,
    devotions,
    onAddDevotion,
    onDeleteDevotion,
    setDevotionAuthor,
    setDevotionBody,
    setDevotionDate,
    setDevotionPrayer,
    setDevotionScriptureRef,
    setDevotionScriptureText,
    setDevotionTitle,
    showToast
  } = useAdminPortal();

  return (
    <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
          Kelola Renungan Harian ({devotions.length})
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
          Publikasikan santapan rohani harian yang akan tampil di halaman beranda dan menu Renungan Harian untuk jemaat Bank Mandiri.
        </p>
      </div>

      {/* Form Tulis Renungan */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!devotionTitle.trim() || !devotionBody.trim()) {
            showToast('Judul dan isi renungan wajib diisi', 'error');
            return;
          }
          if (onAddDevotion) {
            onAddDevotion({
              id: 'dev-' + Date.now(),
              devotionDate: devotionDate || new Date().toISOString().split('T')[0],
              title: devotionTitle.trim(),
              scriptureRef: devotionScriptureRef.trim(),
              scriptureText: devotionScriptureText.trim(),
              body: devotionBody.trim(),
              prayer: devotionPrayer.trim(),
              author: devotionAuthor.trim() || 'Bapekkris Bank Mandiri',
              theme: devotionTheme.trim() || 'Integritas & Karakter Kristiani'
            });
            setDevotionTitle('');
            setDevotionScriptureRef('');
            setDevotionScriptureText('');
            setDevotionBody('');
            setDevotionPrayer('');
            showToast('Renungan harian berhasil disimpan!');
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
          + Tulis Renungan Harian Baru
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tanggal Renungan *</label>
            <input
              type="date"
              value={devotionDate}
              onChange={(e) => setDevotionDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Judul Renungan *</label>
            <input
              type="text"
              placeholder="Contoh: Kesetiaan dalam Hal-Hal Kecil di Pekerjaan"
              value={devotionTitle}
              onChange={(e) => setDevotionTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Referensi Nats Alkitab</label>
            <input
              type="text"
              placeholder="Contoh: Matius 25:21"
              value={devotionScriptureRef}
              onChange={(e) => setDevotionScriptureRef(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Penulis / Pengkhotbah</label>
            <input
              type="text"
              placeholder="Contoh: Tim Kerohanian Bapekkris"
              value={devotionAuthor}
              onChange={(e) => setDevotionAuthor(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ayat Firman Tuhan (Nats Alkitab Lengkap)</label>
          <textarea
            rows={2}
            placeholder="Contoh: Baiklah orang bijak mendengar dan menambah ilmu dan baiklah orang yang berpengertian memperoleh bahan pertimbangan..."
            value={devotionScriptureText}
            onChange={(e) => setDevotionScriptureText(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Isi / Uraian Renungan *</label>
          <textarea
            rows={5}
            placeholder="Tuliskan renungan firman Tuhan di sini..."
            value={devotionBody}
            onChange={(e) => setDevotionBody(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--input-bg)', border: '1px solid var(--border-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Doa Penutup</label>
          <textarea
            rows={2}
            placeholder="Tuliskan pokok doa penutup renungan..."
            value={devotionPrayer}
            onChange={(e) => setDevotionPrayer(e.target.value)}
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
            + Simpan & Terbitkan Renungan
          </button>
        </div>
      </form>

      {/* Daftar Renungan */}
      <div>
        <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '12px' }}>
          Daftar Arsip Renungan ({devotions.length}):
        </h4>
        {devotions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
            Belum ada data renungan yang diinput.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {devotions.map((dev) => (
              <div key={dev.id} style={{
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
                    <span className="badge-gold" style={{ fontSize: '0.7rem' }}>{dev.devotionDate}</span>
                    {dev.scriptureRef && <span style={{ fontSize: '0.78rem', color: 'var(--neon-cyan)', fontWeight: 700 }}>{dev.scriptureRef}</span>}
                  </div>
                  <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{dev.title}</strong>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: '12px' }}>oleh: {dev.author}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus renungan "${dev.title}"?`)) {
                      if (onDeleteDevotion) onDeleteDevotion(dev.id);
                      showToast('Renungan berhasil dihapus.');
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
