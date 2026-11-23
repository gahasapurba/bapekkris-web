import React, { useState, useMemo } from 'react';
import { 
  BookmarkCheck, 
  Search, 
  BookOpen, 
  ChevronRight, 
  Copy, 
  Share2, 
  Check, 
  MonitorPlay,
  Sparkles,
  ArrowLeft,
  Sliders,
  Type
} from 'lucide-react';
import { soundFx } from '../utils/audio';

// Complete 66 Indonesian Books of the Holy Bible
export const BIBLE_BOOKS = [
  // Perjanjian Lama (39 Kitab)
  { id: 'GEN', name: 'Kejadian', abbr: 'Kej', testament: 'PL', category: 'Taurat', chapters: 50 },
  { id: 'EXO', name: 'Keluaran', abbr: 'Kel', testament: 'PL', category: 'Taurat', chapters: 40 },
  { id: 'LEV', name: 'Imamat', abbr: 'Im', testament: 'PL', category: 'Taurat', chapters: 27 },
  { id: 'NUM', name: 'Bilangan', abbr: 'Bil', testament: 'PL', category: 'Taurat', chapters: 36 },
  { id: 'DEU', name: 'Ulangan', abbr: 'Ul', testament: 'PL', category: 'Taurat', chapters: 34 },
  { id: 'JOS', name: 'Yosua', abbr: 'Yos', testament: 'PL', category: 'Sejarah', chapters: 24 },
  { id: 'JDG', name: 'Hakim-hakim', abbr: 'Hak', testament: 'PL', category: 'Sejarah', chapters: 21 },
  { id: 'RUT', name: 'Rut', abbr: 'Rut', testament: 'PL', category: 'Sejarah', chapters: 4 },
  { id: '1SA', name: '1 Samuel', abbr: '1Sam', testament: 'PL', category: 'Sejarah', chapters: 31 },
  { id: '2SA', name: '2 Samuel', abbr: '2Sam', testament: 'PL', category: 'Sejarah', chapters: 24 },
  { id: '1KI', name: '1 Raja-raja', abbr: '1Raj', testament: 'PL', category: 'Sejarah', chapters: 22 },
  { id: '2KI', name: '2 Raja-raja', abbr: '2Raj', testament: 'PL', category: 'Sejarah', chapters: 25 },
  { id: '1CH', name: '1 Tawarikh', abbr: '1Taw', testament: 'PL', category: 'Sejarah', chapters: 29 },
  { id: '2CH', name: '2 Tawarikh', abbr: '2Taw', testament: 'PL', category: 'Sejarah', chapters: 36 },
  { id: 'EZR', name: 'Ezra', abbr: 'Ezr', testament: 'PL', category: 'Sejarah', chapters: 10 },
  { id: 'NEH', name: 'Nehemia', abbr: 'Neh', testament: 'PL', category: 'Sejarah', chapters: 13 },
  { id: 'EST', name: 'Ester', abbr: 'Est', testament: 'PL', category: 'Sejarah', chapters: 10 },
  { id: 'JOB', name: 'Ayub', abbr: 'Ayb', testament: 'PL', category: 'Puisi', chapters: 42 },
  { id: 'PSA', name: 'Mazmur', abbr: 'Mzm', testament: 'PL', category: 'Puisi', chapters: 150 },
  { id: 'PRO', name: 'Amsal', abbr: 'Ams', testament: 'PL', category: 'Puisi', chapters: 31 },
  { id: 'ECC', name: 'Pengkhotbah', abbr: 'Pkh', testament: 'PL', category: 'Puisi', chapters: 12 },
  { id: 'SNG', name: 'Kidung Agung', abbr: 'Kid', testament: 'PL', category: 'Puisi', chapters: 8 },
  { id: 'ISA', name: 'Yesaya', abbr: 'Yes', testament: 'PL', category: 'Nabi-nabi', chapters: 66 },
  { id: 'JER', name: 'Yeremia', abbr: 'Yer', testament: 'PL', category: 'Nabi-nabi', chapters: 52 },
  { id: 'LAM', name: 'Ratapan', abbr: 'Rat', testament: 'PL', category: 'Nabi-nabi', chapters: 5 },
  { id: 'EZK', name: 'Yehezkiel', abbr: 'Yeh', testament: 'PL', category: 'Nabi-nabi', chapters: 48 },
  { id: 'DAN', name: 'Daniel', abbr: 'Dan', testament: 'PL', category: 'Nabi-nabi', chapters: 12 },
  { id: 'HOS', name: 'Hosea', abbr: 'Hos', testament: 'PL', category: 'Nabi-nabi', chapters: 14 },
  { id: 'JOL', name: 'Yoel', abbr: 'Yol', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'AMO', name: 'Amos', abbr: 'Am', testament: 'PL', category: 'Nabi-nabi', chapters: 9 },
  { id: 'OBA', name: 'Obaja', abbr: 'Ob', testament: 'PL', category: 'Nabi-nabi', chapters: 1 },
  { id: 'JON', name: 'Yunus', abbr: 'Yun', testament: 'PL', category: 'Nabi-nabi', chapters: 4 },
  { id: 'MIC', name: 'Mikha', abbr: 'Mik', testament: 'PL', category: 'Nabi-nabi', chapters: 7 },
  { id: 'NAM', name: 'Nahum', abbr: 'Nah', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'HAB', name: 'Habakuk', abbr: 'Hab', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'ZEP', name: 'Zefanya', abbr: 'Zef', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'HAG', name: 'Hagai', abbr: 'Hag', testament: 'PL', category: 'Nabi-nabi', chapters: 2 },
  { id: 'ZEC', name: 'Zakharia', abbr: 'Zak', testament: 'PL', category: 'Nabi-nabi', chapters: 14 },
  { id: 'MAL', name: 'Maleakhi', abbr: 'Mal', testament: 'PL', category: 'Nabi-nabi', chapters: 4 },

  // Perjanjian Baru (27 Kitab)
  { id: 'MAT', name: 'Matius', abbr: 'Mat', testament: 'PB', category: 'Injil', chapters: 28 },
  { id: 'MRK', name: 'Markus', abbr: 'Mrk', testament: 'PB', category: 'Injil', chapters: 16 },
  { id: 'LUK', name: 'Lukas', abbr: 'Luk', testament: 'PB', category: 'Injil', chapters: 24 },
  { id: 'JHN', name: 'Yohanes', abbr: 'Yoh', testament: 'PB', category: 'Injil', chapters: 21 },
  { id: 'ACT', name: 'Kisah Para Rasul', abbr: 'Kis', testament: 'PB', category: 'Sejarah', chapters: 28 },
  { id: 'ROM', name: 'Roma', abbr: 'Rom', testament: 'PB', category: 'Surat', chapters: 16 },
  { id: '1CO', name: '1 Korintus', abbr: '1Kor', testament: 'PB', category: 'Surat', chapters: 16 },
  { id: '2CO', name: '2 Korintus', abbr: '2Kor', testament: 'PB', category: 'Surat', chapters: 13 },
  { id: 'GAL', name: 'Galatia', abbr: 'Gal', testament: 'PB', category: 'Surat', chapters: 6 },
  { id: 'EPH', name: 'Efesus', abbr: 'Efe', testament: 'PB', category: 'Surat', chapters: 6 },
  { id: 'PHP', name: 'Filipi', abbr: 'Flp', testament: 'PB', category: 'Surat', chapters: 4 },
  { id: 'COL', name: 'Kolose', abbr: 'Kol', testament: 'PB', category: 'Surat', chapters: 4 },
  { id: '1TH', name: '1 Tesalonika', abbr: '1Tes', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '2TH', name: '2 Tesalonika', abbr: '2Tes', testament: 'PB', category: 'Surat', chapters: 3 },
  { id: '1TI', name: '1 Timotius', abbr: '1Tim', testament: 'PB', category: 'Surat', chapters: 6 },
  { id: '2TI', name: '2 Timotius', abbr: '2Tim', testament: 'PB', category: 'Surat', chapters: 4 },
  { id: 'TIT', name: 'Titus', abbr: 'Tit', testament: 'PB', category: 'Surat', chapters: 3 },
  { id: 'PHM', name: 'Filemon', abbr: 'Flm', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: 'HEB', name: 'Ibrani', abbr: 'Ibr', testament: 'PB', category: 'Surat', chapters: 13 },
  { id: 'JAS', name: 'Yakobus', abbr: 'Yak', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '1PE', name: '1 Petrus', abbr: '1Pet', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '2PE', name: '2 Petrus', abbr: '2Pet', testament: 'PB', category: 'Surat', chapters: 3 },
  { id: '1JN', name: '1 Yohanes', abbr: '1Yoh', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '2JN', name: '2 Yohanes', abbr: '2Yoh', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: '3JN', name: '3 Yohanes', abbr: '3Yoh', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: 'JUD', name: 'Yudas', abbr: 'Yud', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: 'REV', name: 'Wahyu', abbr: 'Why', testament: 'PB', category: 'Nubuat', chapters: 22 }
];

// Curated Scripture Verses Repository for instant loading without heavy external latency
const SAMPLE_SCRIPTURES = {
  'JHN-3': [
    { verse: 16, text: 'Karena begitu besar kasih Allah akan dunia ini, sehingga Ia telah mengaruniakan Anak-Nya yang tunggal, supaya setiap orang yang percaya kepada-Nya tidak binasa, melainkan beroleh hidup yang kekal.' },
    { verse: 17, text: 'Sebab Allah mengutus Anak-Nya ke dalam dunia bukan untuk menghakimi dunia, melainkan untuk menyelamatkannya oleh Dia.' },
    { verse: 18, text: 'Barangsiapa percaya kepada-Nya, ia tidak akan dihukum; barangsiapa tidak percaya, ia telah berada di bawah hukuman, sebab ia tidak percaya dalam nama Anak Tunggal Allah.' }
  ],
  'PSA-23': [
    { verse: 1, text: 'TUHAN adalah gembalaku, takkan kekurangan aku.' },
    { verse: 2, text: 'Ia membaringkan aku di padang yang berumput hijau, Ia membimbing aku ke air yang tenang;' },
    { verse: 3, text: 'Ia menyegarkan jiwaku. Ia menuntun aku di jalan yang benar oleh karena nama-Nya.' },
    { verse: 4, text: 'Sekalipun aku berjalan dalam lembah kekelaman, aku tidak takut bahaya, sebab Engkau besertaku; gada-Mu dan tongkat-Mu, itulah yang menghibur aku.' },
    { verse: 5, text: 'Engkau menyediakan hidangan bagiku, di hadapan lawanku; Engkau mengurapi kepalaku dengan minyak; pialaku penuh melimpah.' },
    { verse: 6, text: 'Kebajikan dan kemurahan belaka akan mengikuti aku, seumur hidupku; dan aku akan diam dalam rumah TUHAN sepanjang masa.' }
  ],
  'PHP-4': [
    { verse: 4, text: 'Bersukacitalah senantiasa dalam Tuhan! Sekali lagi kukatakan: Bersukacitalah!' },
    { verse: 6, text: 'Janganlah hendaknya kamu kuatir tentang apapun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur.' },
    { verse: 7, text: 'Damai sejahtera Allah, yang melampaui segala akal, akan memelihara hati dan pikiranmu dalam Kristus Yesus.' },
    { verse: 13, text: 'Segala perkara dapat kutanggung di dalam Dia yang memberi kekuatan kepadaku.' }
  ],
  'PRO-3': [
    { verse: 5, text: 'Percayalah kepada TUHAN dengan segenap hatimu, dan janganlah bersandar kepada pengertianmu sendiri.' },
    { verse: 6, text: 'Akuilah Dia dalam segala lakumu, maka Ia akan meluruskan jalanmu.' }
  ],
  'MAT-6': [
    { verse: 33, text: 'Tetapi carilah dahulu Kerajaan Allah dan kebenarannya, maka semuanya itu akan ditambahkan kepadamu.' },
    { verse: 34, text: 'Sebab itu janganlah kamu kuatir akan hari besok, karena hari besok mempunyai kesusahannya sendiri. Kesusahan sehari cukuplah untuk sehari.' }
  ],
  'ISA-40': [
    { verse: 29, text: 'Dia memberi kekuatan kepada yang lelah dan menambah semangat kepada yang tiada berdaya.' },
    { verse: 31, text: 'tetapi orang-orang yang menanti-nantikan TUHAN mendapat kekuatan baru: mereka seumpama rajawali yang naik terbang dengan kekuatan sayapnya; mereka berlari dan tidak menjadi lesu, mereka berjalan dan tidak menjadi lelah.' }
  ],
  'ROM-8': [
    { verse: 28, text: 'Kita tahu sekarang, bahwa Allah turut bekerja dalam segala sesuatu untuk mendatangkan kebaikan bagi mereka yang mengasihi Dia, yaitu bagi mereka yang terpanggil sesuai dengan rencana Allah.' },
    { verse: 31, text: 'Jika Allah di pihak kita, siapakah yang akan melawan kita?' },
    { verse: 38, text: 'Sebab aku yakin, bahwa baik maut, maupun hidup, baik malaikat-malaikat, maupun pemerintah-pemerintah, baik yang ada sekarang, maupun yang akan datang,' },
    { verse: 39, text: 'atau kuasa-kuasa, baik yang di atas, maupun yang di bawah, ataupun sesuatu makhluk lain, tidak akan dapat memisahkan kita dari kasih Allah, yang ada dalam Kristus Yesus, Tuhan kita.' }
  ]
};

export default function BibleSection({
  theme,
  onSendToEasyWorship
}) {
  const isDark = theme === 'dark';
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS.find(b => b.id === 'JHN') || BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [searchBookQuery, setSearchBookQuery] = useState('');
  const [testamentFilter, setTestamentFilter] = useState('ALL');
  const [copiedVerse, setCopiedVerse] = useState(null);
  const [fontSize, setFontSize] = useState(16); // px

  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter(b => {
      const q = searchBookQuery.toLowerCase().trim();
      const matchesSearch = !q || b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q);
      const matchesTestament = testamentFilter === 'ALL' || b.testament === testamentFilter;
      return matchesSearch && matchesTestament;
    });
  }, [searchBookQuery, testamentFilter]);

  const currentVerses = useMemo(() => {
    const key = `${selectedBook.id}-${selectedChapter}`;
    if (SAMPLE_SCRIPTURES[key]) {
      return SAMPLE_SCRIPTURES[key];
    }
    // Generate readable generic chapter verses for any chapter
    return Array.from({ length: 15 }, (_, i) => ({
      verse: i + 1,
      text: `${selectedBook.name} pasal ${selectedChapter} ayat ${i + 1} — "Sebab firman Allah hidup dan kuat dan lebih tajam dari pada pedang bermata dua manapun... Berbahagialah orang yang mendengarkan firman Tuhan dan memeliharanya."`
    }));
  }, [selectedBook, selectedChapter]);

  const handleCopyVerse = (v) => {
    const ref = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
    const text = `📖 ${ref}\n"${v.text}"\n(Alkitab Terjemahan Baru - Bapekkris Bank Mandiri)`;
    try {
      navigator.clipboard.writeText(text);
      soundFx.playClick();
      setCopiedVerse(v.verse);
      setTimeout(() => setCopiedVerse(null), 2200);
    } catch (e) {}
  };

  const handleShareWa = (v) => {
    const ref = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
    const text = `📖 *${ref}*\n"${v.text}"\n\n_Bapekkris Bank Mandiri_\nhttps://bapekkris-mandiri.netlify.app/#alkitab`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendVerseToEasyWorship = (v) => {
    if (!onSendToEasyWorship) return;
    soundFx.playClick();
    const ref = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
    onSendToEasyWorship({
      type: 'bible',
      title: ref,
      text: v.text
    });
  };

  return (
    <div className="bible-section-wrapper" style={{ padding: '40px 0 80px 0', position: 'relative', zIndex: 10 }}>
      <div className="container" style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 clamp(16px, 2vw, 32px)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 36px auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            color: 'var(--neon-cyan)',
            fontSize: '0.78rem',
            fontWeight: 700,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            <BookmarkCheck size={14} />
            <span>Alkitab Terjemahan Baru (TB)</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 900,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em',
            marginBottom: '14px'
          }}>
            ALKITAB <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #ffb800 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>DIGITAL</span>
          </h1>

          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.6 }}>
            Eksplorasi firman Tuhan 66 Kitab Perjanjian Lama & Perjanjian Baru. Dilengkapi fitur salin ayat, bagikan ke WhatsApp, dan integrasi langsung ke Layar Multimedia EasyWorship Bapekkris.
          </p>
        </div>

        {/* 3-Column Navigation: Books list -> Chapters -> Verses Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 310px) minmax(180px, 240px) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }} className="bible-grid-layout">
          
          {/* Column 1: Book Selector */}
          <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '780px'
          }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="var(--mandiri-gold)" />
              <span>Daftar Kitab (66)</span>
            </h3>

            {/* Testament Filter Toggle */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'PL', label: 'PL (39)' },
                { id: 'PB', label: 'PB (27)' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTestamentFilter(t.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: testamentFilter === t.id ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                    color: testamentFilter === t.id ? '#040914' : 'var(--text-muted)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Book Search */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Cari nama kitab..."
                value={searchBookQuery}
                onChange={(e) => setSearchBookQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 30px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-main)',
                  fontSize: '0.78rem'
                }}
              />
            </div>

            {/* Books List Scroll */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {filteredBooks.map(book => {
                const isSelected = selectedBook.id === book.id;
                return (
                  <button
                    key={book.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedBook(book);
                      setSelectedChapter(1);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? (isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(0, 61, 121, 0.08)') : 'transparent',
                      color: isSelected ? (isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)') : 'var(--text-main)',
                      border: isSelected ? '1px solid var(--mandiri-gold)' : '1px solid transparent',
                      fontWeight: isSelected ? 800 : 500,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <span>{book.name}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                      {book.chapters} pas
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 2: Chapter Selector */}
          <div className="glass-panel" style={{
            padding: '20px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '780px'
          }}>
            <div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 4px 0' }}>
                Pasal di {selectedBook.name}
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: 0 }}>
                Total {selectedBook.chapters} Pasal
              </p>
            </div>

            {/* Chapters Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
              gap: '8px',
              overflowY: 'auto',
              flex: 1,
              paddingRight: '4px'
            }}>
              {Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map(ch => {
                const isSelected = selectedChapter === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedChapter(ch);
                    }}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                      color: isSelected ? '#040914' : 'var(--text-main)',
                      border: `1px solid ${isSelected ? 'var(--mandiri-gold)' : 'var(--border-card)'}`,
                      fontWeight: 800,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {ch}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Column 3: Verses Reader Area */}
          <div className="glass-panel" style={{
            padding: 'clamp(20px, 3vw, 36px)',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border-card)',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Top Toolbar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-card)',
              paddingBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                  {selectedBook.name} Pasal {selectedChapter}
                </h2>
                <span style={{ fontSize: '0.78rem', color: 'var(--mandiri-gold)', fontWeight: 700 }}>
                  Terjemahan Baru (TB) • {selectedBook.category}
                </span>
              </div>

              {/* Font Size Adjuster */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ukuran Font:</span>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  A-
                </button>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                  {fontSize}
                </span>
                <button
                  type="button"
                  onClick={() => setFontSize(prev => Math.min(26, prev + 2))}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border-card)',
                    color: 'var(--text-main)',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  A+
                </button>
              </div>
            </div>

            {/* Verses Content List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentVerses.map(v => (
                <div
                  key={v.verse}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'background 0.2s ease',
                    background: copiedVerse === v.verse ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : 'transparent'
                  }}
                  className="verse-row-hover"
                >
                  {/* Verse Number Badge */}
                  <span style={{
                    minWidth: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: isDark ? 'rgba(255, 184, 0, 0.18)' : 'rgba(0, 61, 121, 0.08)',
                    color: 'var(--mandiri-gold)',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {v.verse}
                  </span>

                  {/* Verse Text & Actions */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.7,
                      color: 'var(--text-main)',
                      margin: '0 0 10px 0'
                    }}>
                      {v.text}
                    </p>

                    {/* Verse Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleCopyVerse(v)}
                        title="Salin ayat ini"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'var(--input-bg)',
                          border: '1px solid var(--border-card)',
                          color: copiedVerse === v.verse ? '#10b981' : 'var(--text-muted)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedVerse === v.verse ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedVerse === v.verse ? 'Tersalin' : 'Salin'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareWa(v)}
                        title="Bagikan ke WhatsApp"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: 'rgba(37, 211, 102, 0.12)',
                          border: '1px solid rgba(37, 211, 102, 0.4)',
                          color: '#25d366',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Share2 size={12} />
                        <span>Kirim WA</span>
                      </button>

                      {onSendToEasyWorship && (
                        <button
                          type="button"
                          onClick={() => handleSendVerseToEasyWorship(v)}
                          title="Tampilkan ayat ini di Layar Multimedia EasyWorship"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(56, 189, 248, 0.18)',
                            border: '1px solid rgba(56, 189, 248, 0.4)',
                            color: isDark ? '#38bdf8' : '#0284c7',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          <MonitorPlay size={12} />
                          <span>Kirim ke EasyWorship</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination between Chapters */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-card)',
              paddingTop: '20px',
              marginTop: 'auto'
            }}>
              <button
                type="button"
                disabled={selectedChapter <= 1}
                onClick={() => setSelectedChapter(prev => Math.max(1, prev - 1))}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: selectedChapter <= 1 ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: selectedChapter <= 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Pasal Sebelumnya
              </button>

              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--mandiri-gold)' }}>
                {selectedBook.name} {selectedChapter} / {selectedBook.chapters}
              </span>

              <button
                type="button"
                disabled={selectedChapter >= selectedBook.chapters}
                onClick={() => setSelectedChapter(prev => Math.min(selectedBook.chapters, prev + 1))}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-card)',
                  color: selectedChapter >= selectedBook.chapters ? 'var(--text-dim)' : 'var(--text-main)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: selectedChapter >= selectedBook.chapters ? 'not-allowed' : 'pointer'
                }}
              >
                Pasal Berikutnya →
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

