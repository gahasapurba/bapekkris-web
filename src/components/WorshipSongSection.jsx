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
export const DEFAULT_HYMNS = [
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
    id: 'hymn-kj-064',
    songNumber: 'KJ 064',
    title: 'Bila Kulihat Bintang Gemerlapan (How Great Thou Art)',
    category: 'Kidung Jemaat',
    keySignature: 'Do = Bes, 4/4',
    author: 'Carl Boberg / Stuart K. Hine',
    lyrics: `Bait 1:
Bila kulihat bintang gemerlapan dan kudengar derunya guruh gempar,
ya Tuhanku, tak putus aku heran melihat ciptaan-Mu yang besar.

Reff / Chorus:
Maka jiwaku pun memuji-Mu: "Sungguh besar Kau, Allahku!"
Maka jiwaku pun memuji-Mu: "Sungguh besar Kau, Allahku!"

Bait 2:
Ya Tuhanku, pabila kurenungkan pemberian-Mu dalam Penebus,
‘ku tertegun: bagiku dicurahkan oleh Putra-Mu darah yang kudus.

Reff / Chorus:
Maka jiwaku pun memuji-Mu: "Sungguh besar Kau, Allahku!"
Maka jiwaku pun memuji-Mu: "Sungguh besar Kau, Allahku!"`
  },
  {
    id: 'hymn-kj-392',
    songNumber: 'KJ 392',
    title: '\'Ku Berbahagia (Blessed Assurance)',
    category: 'Kidung Jemaat',
    keySignature: 'Do = D, 9/8',
    author: 'Fanny J. Crosby / Phoebe P. Knapp',
    lyrics: `Bait 1:
‘Ku berbahagia, yakin teguh: Yesus abadi kepunyaanku!
Aku waris-Nya, ‘ku ditebus, ciptaan baru Rohulkudus.

Reff / Chorus:
Aku bernyanyi bahagia memuji Yesus selamanya.
Aku bernyanyi bahagia memuji Yesus selamanya.

Bait 2:
Pasrah sempurna, nikmat penuh; suka sorgawi melimpahiku.
Hawa sorgawi diturunkan, kasih dan rahmat dibawakan.

Reff / Chorus:
Aku bernyanyi bahagia memuji Yesus selamanya.
Aku bernyanyi bahagia memuji Yesus selamanya.`
  },
  {
    id: 'hymn-kj-393',
    songNumber: 'KJ 393',
    title: 'Tuhan, Betapa Banyaknya',
    category: 'Kidung Jemaat',
    keySignature: 'Do = G, 4/4',
    author: 'Subronto Kusumo Atmodjo',
    lyrics: `Bait 1:
Tuhan, betapa banyaknya berkat yang Kau beri,
teristimewa rahmat-Mu dan hidup abadi.

Reff / Chorus:
T'rima kasih, ya Tuhanku atas keselamatanku!
Padaku telah Kau beri hidup bahagia abadi.

Bait 2:
Sanak saudara dan teman Kauberi padaku;
berkat terindah ialah: ‘ku jadi anak-Mu.

Reff / Chorus:
T'rima kasih, ya Tuhanku atas keselamatanku!
Padaku telah Kau beri hidup bahagia abadi.`
  },
  {
    id: 'hymn-kj-400',
    songNumber: 'KJ 400',
    title: 'Kudaki Jalan Mulia (Higher Ground)',
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
    title: 'Hujan Berkat Kan Tercurah (Showers of Blessing)',
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
    id: 'hymn-kj-457',
    songNumber: 'KJ 457',
    title: 'Ya Tuhan, Tiap Jam (I Need Thee Every Hour)',
    category: 'Kidung Jemaat',
    keySignature: 'Do = As, 3/4',
    author: 'Annie S. Hawks / Robert Lowry',
    lyrics: `Bait 1:
Ya Tuhan, tiap jam ‘ku memerlukan-Mu,
Engkaulah yang memb’ri sejahtera penuh.

Reff / Chorus:
Setiap jam, ya Tuhan, Dikau kuperlukan;
‘ku datang, Jurus’lamat, berkatilah!

Bait 2:
Ya Tuhan, tiap jam, di suka-dukaku,
jikalau Tuhan jauh, percuma hidupku.

Reff / Chorus:
Setiap jam, ya Tuhan, Dikau kuperlukan;
‘ku datang, Jurus’lamat, berkatilah!`
  },
  {
    id: 'hymn-pkj-002',
    songNumber: 'PKJ 002',
    title: 'Mulia, Mulia Nama-Nya',
    category: 'Pelengkap Kidung Jemaat',
    keySignature: 'Do = G, 4/4',
    author: 'Claude Fraysse',
    lyrics: `Bait 1:
Mulia, mulia nama-Nya! Bagi Yesus kemuliaan, puji, sembah!
Mulia, kekuasaan-Nya memb'ri berkat bagi jemaat, bersyukurlah!

Reff / Chorus:
Pujilah, tinggikanlah Rajamu Yesus.
Dialah selamanya Sang Penebus!
Mulia, mulia nama-Nya! Bagi Yesus yang t'lah wafat, bagikanlah!`
  },
  {
    id: 'hymn-pkj-014',
    songNumber: 'PKJ 014',
    title: 'Jadilah, Tuhan, Kehendak-Mu',
    category: 'Pelengkap Kidung Jemaat',
    keySignature: 'Do = D, 9/4',
    author: 'Adelaide A. Pollard / George C. Stebbins',
    lyrics: `Bait 1:
Jadilah, Tuhan, kehendak-Mu! Kaulah Penjunan, ‘ku tanah liat.
Bentuklah aku sesuka-Mu, ‘kan kunantikan dengan taat.

Bait 2:
Jadilah, Tuhan, kehendak-Mu! Sucikan hati, ujilah ‘ku.
Kini ‘ku sujud di kaki-Mu, basuhlah aku seputih salju.`
  },
  {
    id: 'hymn-pkj-242',
    songNumber: 'PKJ 242',
    title: 'Seindah Siang Disinari Terang',
    category: 'Pelengkap Kidung Jemaat',
    keySignature: 'Do = F, 4/4',
    author: 'J.T. Silangit',
    lyrics: `Bait 1:
Seindah siang disinari terang cara Tuhan mengasihiku;
seindah petang dengan angin sejuk cara Tuhan mengasihiku.

Reff / Chorus:
Tuhanku lembut dan penyayang, Dia mengasihi diriku.
Kasih-Nya sanggup menghibur aku dekat pada-Nya ‘ku aman tenteram.`
  },
  {
    id: 'hymn-nkb-003',
    songNumber: 'NKB 003',
    title: 'Terpujilah Allah',
    category: 'Nyanyikanlah Kidung Baru',
    keySignature: 'Do = As, 3/4',
    author: 'Fanny J. Crosby / William H. Doane',
    lyrics: `Bait 1:
Terpujilah Allah, hikmat-Nya besar; begitu kasih-Nya ‘tuk dunia cemar,
sehingga dib'rilah Putra-Nya kudus mengangkat manusia serta menebus.

Reff / Chorus:
Pujilah, pujilah! Buatlah dunia bergemar, bergemar mendengar suara-Nya.
Dapatkanlah Allah demi Putra-Nya, b'ri puji pada-Nya sebab hikmat-Nya.`
  },
  {
    id: 'hymn-nkb-034',
    songNumber: 'NKB 034',
    title: 'Setia-Mu, Tuhanku (Great Is Thy Faithfulness)',
    category: 'Nyanyikanlah Kidung Baru',
    keySignature: 'Do = Es, 3/4',
    author: 'Thomas O. Chisholm / William M. Runyan',
    lyrics: `Bait 1:
Setia-Mu, Tuhanku, menghalau raguku; satu pun tiada yang dapat berubah.
Kasih-Mu yang limpah tetap selamanya, Kau tidak berubah, setia s’lalu.

Reff / Chorus:
Besar setia-Mu! Besar setia-Mu! Tiap pagi rahmat-Mu nyata bagiku.
Segala yang kubutuhkan Kau sediakan, besar setia-Mu kepadaku!`
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
  },
  {
    id: 'hymn-pw-005',
    songNumber: 'PW 05',
    title: 'Bagi Tuhan Tak Ada Yang Mustahil',
    category: 'Praise & Worship',
    keySignature: 'Do = G, 4/4',
    author: 'Sari Simorangkir',
    lyrics: `Bait 1:
Ku yakin saat Kau berfirman, ku menang saat Kau bertindak
Hidupku hanya ditentukan oleh kuasa-Mu

Reff / Chorus:
Bagi Tuhan tak ada yang mustahil
Bagi Tuhan tak ada yang tak mungkin
Mukjizat-Nya disediakan bagiku
Ku diangkat dan dipulihkan-Nya`
  },
  {
    id: 'hymn-pw-006',
    songNumber: 'PW 06',
    title: 'Janji-Mu Sperti Fajar',
    category: 'Praise & Worship',
    keySignature: 'Do = E, 4/4',
    author: 'Herlin Pirena / Pongky Prasetyo',
    lyrics: `Bait 1:
Ketika kuhadapi kehidupan ini
Jalan mana yang harus kupilih
Kutahu sungguh Engkau bertindak
Memb'ri jalan keluar bagiku

Reff / Chorus:
Janji-Mu sperti fajar pagi hari
Dan tiada pernah terlambat bersinar
Cinta-Mu sperti sungai yang mengalir
Dan kutahu betapa dalam kasih-Mu`
  },
  {
    id: 'hymn-pw-007',
    songNumber: 'PW 07',
    title: 'Doa Mengubah Segala Sesuatu',
    category: 'Praise & Worship',
    keySignature: 'Do = D, 4/4',
    author: 'Vonda B.',
    lyrics: `Bait 1:
Saat keadaan sek’lilingku ada di luar kemampuanku
Kuberdiam diri mencari-Mu, doa mengubah segala sesuatu

Reff / Chorus:
Saat ku berdoa, mukjizat terjadi
Saat ku berdoa, hadirat-Mu melimpah
Kutahu sungguh kuasa doa
Mengubah segala sesuatu`
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
    return combinedSongs.filter(song => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (song.title || '').toLowerCase().includes(q) ||
        (song.songNumber || '').toLowerCase().includes(q) ||
        (song.lyrics || '').toLowerCase().includes(q) ||
        (song.author || '').toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'ALL' || song.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [combinedSongs, searchQuery, selectedCategory]);

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
            Kumpulan lagu pujian dan penyembahan jemaat Bapekkris Bank Mandiri. Dilengkapi lirik lengkap, nada dasar, video YouTube, dan integrasi proyektor EasyWorship ibadah.
          </p>
        </div>

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
          <div className="glass-panel" style={{
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      {activeSong.songNumber && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'var(--mandiri-gold)',
                          color: '#001a33',
                          fontSize: '0.84rem',
                          fontWeight: 900,
                          fontFamily: 'monospace'
                        }}>
                          {activeSong.songNumber}
                        </span>
                      )}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: 'var(--neon-cyan)',
                        fontSize: '0.78rem',
                        fontWeight: 700
                      }}>
                        {activeSong.category}
                      </span>
                    </div>

                    <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2.2rem)', fontWeight: 900, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                      {activeSong.title}
                    </h2>

                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {activeSong.keySignature && (
                        <span>Nada Dasar: <strong style={{ color: 'var(--mandiri-gold)' }}>{activeSong.keySignature}</strong></span>
                      )}
                      {activeSong.author && (
                        <span>Karya: <em>{activeSong.author}</em></span>
                      )}
                    </div>
                  </div>

                  {/* Top Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleCopySong(activeSong)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-main)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                      <span>{copied ? 'Tersalin' : 'Salin Lirik'}</span>
                    </button>

                    <button
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

      </div>
    </div>
  );
}
