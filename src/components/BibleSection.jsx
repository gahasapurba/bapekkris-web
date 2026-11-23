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

// Complete 66 Books of the Holy Bible with Indonesian and English designations
export const BIBLE_BOOKS = [
  // Perjanjian Lama (39 Kitab)
  { id: 'GEN', name: 'Kejadian', en: 'Genesis', abbr: 'Kej', testament: 'PL', category: 'Taurat', chapters: 50 },
  { id: 'EXO', name: 'Keluaran', en: 'Exodus', abbr: 'Kel', testament: 'PL', category: 'Taurat', chapters: 40 },
  { id: 'LEV', name: 'Imamat', en: 'Leviticus', abbr: 'Im', testament: 'PL', category: 'Taurat', chapters: 27 },
  { id: 'NUM', name: 'Bilangan', en: 'Numbers', abbr: 'Bil', testament: 'PL', category: 'Taurat', chapters: 36 },
  { id: 'DEU', name: 'Ulangan', en: 'Deuteronomy', abbr: 'Ul', testament: 'PL', category: 'Taurat', chapters: 34 },
  { id: 'JOS', name: 'Yosua', en: 'Joshua', abbr: 'Yos', testament: 'PL', category: 'Sejarah', chapters: 24 },
  { id: 'JDG', name: 'Hakim-hakim', en: 'Judges', abbr: 'Hak', testament: 'PL', category: 'Sejarah', chapters: 21 },
  { id: 'RUT', name: 'Rut', en: 'Ruth', abbr: 'Rut', testament: 'PL', category: 'Sejarah', chapters: 4 },
  { id: '1SA', name: '1 Samuel', en: '1 Samuel', abbr: '1Sam', testament: 'PL', category: 'Sejarah', chapters: 31 },
  { id: '2SA', name: '2 Samuel', en: '2 Samuel', abbr: '2Sam', testament: 'PL', category: 'Sejarah', chapters: 24 },
  { id: '1KI', name: '1 Raja-raja', en: '1 Kings', abbr: '1Raj', testament: 'PL', category: 'Sejarah', chapters: 22 },
  { id: '2KI', name: '2 Raja-raja', en: '2 Kings', abbr: '2Raj', testament: 'PL', category: 'Sejarah', chapters: 25 },
  { id: '1CH', name: '1 Tawarikh', en: '1 Chronicles', abbr: '1Taw', testament: 'PL', category: 'Sejarah', chapters: 29 },
  { id: '2CH', name: '2 Tawarikh', en: '2 Chronicles', abbr: '2Taw', testament: 'PL', category: 'Sejarah', chapters: 36 },
  { id: 'EZR', name: 'Ezra', en: 'Ezra', abbr: 'Ezr', testament: 'PL', category: 'Sejarah', chapters: 10 },
  { id: 'NEH', name: 'Nehemia', en: 'Nehemiah', abbr: 'Neh', testament: 'PL', category: 'Sejarah', chapters: 13 },
  { id: 'EST', name: 'Ester', en: 'Esther', abbr: 'Est', testament: 'PL', category: 'Sejarah', chapters: 10 },
  { id: 'JOB', name: 'Ayub', en: 'Job', abbr: 'Ayb', testament: 'PL', category: 'Puisi', chapters: 42 },
  { id: 'PSA', name: 'Mazmur', en: 'Psalms', abbr: 'Mzm', testament: 'PL', category: 'Puisi', chapters: 150 },
  { id: 'PRO', name: 'Amsal', en: 'Proverbs', abbr: 'Ams', testament: 'PL', category: 'Puisi', chapters: 31 },
  { id: 'ECC', name: 'Pengkhotbah', en: 'Ecclesiastes', abbr: 'Pkh', testament: 'PL', category: 'Puisi', chapters: 12 },
  { id: 'SNG', name: 'Kidung Agung', en: 'Song of Solomon', abbr: 'Kid', testament: 'PL', category: 'Puisi', chapters: 8 },
  { id: 'ISA', name: 'Yesaya', en: 'Isaiah', abbr: 'Yes', testament: 'PL', category: 'Nabi-nabi', chapters: 66 },
  { id: 'JER', name: 'Yeremia', en: 'Jeremiah', abbr: 'Yer', testament: 'PL', category: 'Nabi-nabi', chapters: 52 },
  { id: 'LAM', name: 'Ratapan', en: 'Lamentations', abbr: 'Rat', testament: 'PL', category: 'Nabi-nabi', chapters: 5 },
  { id: 'EZK', name: 'Yehezkiel', en: 'Ezekiel', abbr: 'Yeh', testament: 'PL', category: 'Nabi-nabi', chapters: 48 },
  { id: 'DAN', name: 'Daniel', en: 'Daniel', abbr: 'Dan', testament: 'PL', category: 'Nabi-nabi', chapters: 12 },
  { id: 'HOS', name: 'Hosea', en: 'Hosea', abbr: 'Hos', testament: 'PL', category: 'Nabi-nabi', chapters: 14 },
  { id: 'JOL', name: 'Yoel', en: 'Joel', abbr: 'Yol', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'AMO', name: 'Amos', en: 'Amos', abbr: 'Am', testament: 'PL', category: 'Nabi-nabi', chapters: 9 },
  { id: 'OBA', name: 'Obaja', en: 'Obadiah', abbr: 'Ob', testament: 'PL', category: 'Nabi-nabi', chapters: 1 },
  { id: 'JON', name: 'Yunus', en: 'Jonah', abbr: 'Yun', testament: 'PL', category: 'Nabi-nabi', chapters: 4 },
  { id: 'MIC', name: 'Mikha', en: 'Micah', abbr: 'Mik', testament: 'PL', category: 'Nabi-nabi', chapters: 7 },
  { id: 'NAM', name: 'Nahum', en: 'Nahum', abbr: 'Nah', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'HAB', name: 'Habakuk', en: 'Habakkuk', abbr: 'Hab', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'ZEP', name: 'Zefanya', en: 'Zephaniah', abbr: 'Zef', testament: 'PL', category: 'Nabi-nabi', chapters: 3 },
  { id: 'HAG', name: 'Hagai', en: 'Haggai', abbr: 'Hag', testament: 'PL', category: 'Nabi-nabi', chapters: 2 },
  { id: 'ZEC', name: 'Zakharia', en: 'Zechariah', abbr: 'Zak', testament: 'PL', category: 'Nabi-nabi', chapters: 14 },
  { id: 'MAL', name: 'Maleakhi', en: 'Malachi', abbr: 'Mal', testament: 'PL', category: 'Nabi-nabi', chapters: 4 },

  // Perjanjian Baru (27 Kitab)
  { id: 'MAT', name: 'Matius', en: 'Matthew', abbr: 'Mat', testament: 'PB', category: 'Injil', chapters: 28 },
  { id: 'MRK', name: 'Markus', en: 'Mark', abbr: 'Mrk', testament: 'PB', category: 'Injil', chapters: 16 },
  { id: 'LUK', name: 'Lukas', en: 'Luke', abbr: 'Luk', testament: 'PB', category: 'Injil', chapters: 24 },
  { id: 'JHN', name: 'Yohanes', en: 'John', abbr: 'Yoh', testament: 'PB', category: 'Injil', chapters: 21 },
  { id: 'ACT', name: 'Kisah Para Rasul', en: 'Acts', abbr: 'Kis', testament: 'PB', category: 'Sejarah', chapters: 28 },
  { id: 'ROM', name: 'Roma', en: 'Romans', abbr: 'Rom', testament: 'PB', category: 'Surat', chapters: 16 },
  { id: '1CO', name: '1 Korintus', en: '1 Corinthians', abbr: '1Kor', testament: 'PB', category: 'Surat', chapters: 16 },
  { id: '2CO', name: '2 Korintus', en: '2 Corinthians', abbr: '2Kor', testament: 'PB', category: 'Surat', chapters: 13 },
  { id: 'GAL', name: 'Galatia', en: 'Galatians', abbr: 'Gal', testament: 'PB', category: 'Surat', chapters: 6 },
  { id: 'EPH', name: 'Efesus', en: 'Ephesians', abbr: 'Efe', testament: 'PB', category: 'Surat', chapters: 6 },
  { id: 'PHP', name: 'Filipi', en: 'Philippians', abbr: 'Flp', testament: 'PB', category: 'Surat', chapters: 4 },
  { id: 'COL', name: 'Kolose', en: 'Colossians', abbr: 'Kol', testament: 'PB', category: 'Surat', chapters: 4 },
  { id: '1TH', name: '1 Tesalonika', en: '1 Thessalonians', abbr: '1Tes', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '2TH', name: '2 Tesalonika', en: '2 Thessalonians', abbr: '2Tes', testament: 'PB', category: 'Surat', chapters: 3 },
  { id: '1TI', name: '1 Timotius', en: '1 Timothy', abbr: '1Tim', testament: 'PB', category: 'Surat', chapters: 6 },
  { id: '2TI', name: '2 Timotius', en: '2 Timothy', abbr: '2Tim', testament: 'PB', category: 'Surat', chapters: 4 },
  { id: 'TIT', name: 'Titus', en: 'Titus', abbr: 'Tit', testament: 'PB', category: 'Surat', chapters: 3 },
  { id: 'PHM', name: 'Filemon', en: 'Philemon', abbr: 'Flm', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: 'HEB', name: 'Ibrani', en: 'Hebrews', abbr: 'Ibr', testament: 'PB', category: 'Surat', chapters: 13 },
  { id: 'JAS', name: 'Yakobus', en: 'James', abbr: 'Yak', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '1PE', name: '1 Petrus', en: '1 Peter', abbr: '1Pet', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '2PE', name: '2 Petrus', en: '2 Peter', abbr: '2Pet', testament: 'PB', category: 'Surat', chapters: 3 },
  { id: '1JN', name: '1 Yohanes', en: '1 John', abbr: '1Yoh', testament: 'PB', category: 'Surat', chapters: 5 },
  { id: '2JN', name: '2 Yohanes', en: '2 John', abbr: '2Yoh', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: '3JN', name: '3 Yohanes', en: '3 John', abbr: '3Yoh', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: 'JUD', name: 'Yudas', en: 'Jude', abbr: 'Yud', testament: 'PB', category: 'Surat', chapters: 1 },
  { id: 'REV', name: 'Wahyu', en: 'Revelation', abbr: 'Why', testament: 'PB', category: 'Nubuat', chapters: 22 }
];

export const BIBLE_VERSIONS = [
  { id: 'TB', name: 'TB (Terjemahan Baru)', short: 'TB', source: 'LAI 1974' },
  { id: 'TB2', name: 'TB2 (Edisi 2)', short: 'TB2', source: 'LAI 2023' },
  { id: 'BIMK', name: 'BIMK (Masa Kini)', short: 'BIMK', source: 'Kabar Baik' },
  { id: 'KJV', name: 'KJV (King James)', short: 'KJV', source: 'English' },
  { id: 'WEB', name: 'WEB (World English)', short: 'WEB', source: 'English' }
];

// Zero mock data repository
const SAMPLE_SCRIPTURES = {};

export default function BibleSection({
  theme,
  onSendToEasyWorship
}) {
  const isDark = theme === 'dark';
  const [selectedBook, setSelectedBook] = useState(BIBLE_BOOKS.find(b => b.id === 'JHN') || BIBLE_BOOKS[0]);
  const [selectedChapter, setSelectedChapter] = useState(3);
  const [selectedVersion, setSelectedVersion] = useState('TB');
  const [searchBookQuery, setSearchBookQuery] = useState('');
  const [testamentFilter, setTestamentFilter] = useState('ALL');
  const [copiedVerse, setCopiedVerse] = useState(null);
  const [fontSize, setFontSize] = useState(16); // px

  // API verses fetch state
  const [apiVerses, setApiVerses] = useState({});
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

  // Fetch real verses on book/chapter/version change
  React.useEffect(() => {
    const cacheKey = `${selectedVersion}-${selectedBook.name}-${selectedChapter}`;
    if (apiVerses[cacheKey]) return;

    let isMounted = true;
    setIsLoadingVerses(true);

    if (selectedVersion === 'KJV' || selectedVersion === 'WEB') {
      const bookQuery = selectedBook.en || selectedBook.name;
      fetch(`https://bible-api.com/${encodeURIComponent(bookQuery)}+${selectedChapter}?translation=${selectedVersion.toLowerCase()}`)
        .then(res => {
          if (!res.ok) throw new Error('API error');
          return res.json();
        })
        .then(json => {
          if (!isMounted) return;
          if (json?.verses && Array.isArray(json.verses)) {
            const cleaned = json.verses.map(v => ({
              verse: v.verse,
              text: (v.text || '').trim()
            }));
            if (cleaned.length > 0) {
              setApiVerses(prev => ({ ...prev, [cacheKey]: cleaned }));
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingVerses(false);
        });
    } else {
      fetch(`https://beeble.vercel.app/api/v1/passage/${encodeURIComponent(selectedBook.name)}/${selectedChapter}`)
        .then(res => {
          if (!res.ok) throw new Error('Network error');
          return res.json();
        })
        .then(json => {
          if (!isMounted) return;
          if (json?.data?.verses && Array.isArray(json.data.verses)) {
            const cleaned = json.data.verses
              .filter(v => v.type === 'content' && v.verse > 0)
              .map(v => ({
                verse: v.verse,
                text: v.content
              }));
            if (cleaned.length > 0) {
              setApiVerses(prev => ({ ...prev, [cacheKey]: cleaned }));
            }
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingVerses(false);
        });
    }

    return () => { isMounted = false; };
  }, [selectedBook, selectedChapter, selectedVersion]);

  const filteredBooks = useMemo(() => {
    return BIBLE_BOOKS.filter(b => {
      const q = searchBookQuery.toLowerCase().trim();
      const matchesSearch = !q || b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q) || (b.en && b.en.toLowerCase().includes(q));
      const matchesTestament = testamentFilter === 'ALL' || b.testament === testamentFilter;
      return matchesSearch && matchesTestament;
    });
  }, [searchBookQuery, testamentFilter]);

  const currentVerses = useMemo(() => {
    const cacheKey = `${selectedVersion}-${selectedBook.name}-${selectedChapter}`;
    if (apiVerses[cacheKey] && apiVerses[cacheKey].length > 0) {
      return apiVerses[cacheKey];
    }
    return [];
  }, [selectedBook, selectedChapter, selectedVersion, apiVerses]);

  const handleCopyVerse = (v) => {
    const ref = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
    const text = `📖 ${ref} (${selectedVersion})\n"${v.text}"\n(Alkitab Digital Bapekkris Bank Mandiri)`;
    try {
      navigator.clipboard.writeText(text);
      soundFx.playClick();
      setCopiedVerse(v.verse);
      setTimeout(() => setCopiedVerse(null), 2200);
    } catch (e) {}
  };

  const handleShareWa = (v) => {
    const ref = `${selectedBook.name} ${selectedChapter}:${v.verse}`;
    const text = `📖 *${ref} (${selectedVersion})*\n"${v.text}"\n\n_Bapekkris Bank Mandiri_\nhttps://bapekkris-mandiri.netlify.app/#alkitab`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const handleSendVerseToEasyWorship = (v) => {
    if (!onSendToEasyWorship) return;
    soundFx.playClick();
    const ref = `${selectedBook.name} ${selectedChapter}:${v.verse} (${selectedVersion})`;
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
                  {BIBLE_VERSIONS.find(v => v.id === selectedVersion)?.name || selectedVersion} • {selectedBook.category}
                </span>
              </div>

              {/* Version Selector & Font Size */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* Version Selector Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginRight: '2px' }}>Versi:</span>
                  {BIBLE_VERSIONS.map(ver => {
                    const isSel = selectedVersion === ver.id;
                    return (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => {
                          soundFx.playClick();
                          setSelectedVersion(ver.id);
                        }}
                        title={ver.name}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: isSel ? 'var(--mandiri-gold)' : 'var(--input-bg)',
                          color: isSel ? '#001a33' : 'var(--text-main)',
                          border: isSel ? '1px solid var(--mandiri-gold)' : '1px solid var(--border-card)',
                          fontSize: '0.74rem',
                          fontWeight: isSel ? 800 : 600,
                          cursor: 'pointer'
                        }}
                      >
                        {ver.short}
                      </button>
                    );
                  })}
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
            </div>

            {/* Verses Content List */}
            {isLoadingVerses ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Sparkles size={28} className="pulse-glow" style={{ margin: '0 auto 12px auto' }} />
                <p style={{ fontWeight: 600 }}>Memuat nats firman Tuhan...</p>
              </div>
            ) : currentVerses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <BookOpen size={36} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
                <p style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--text-main)', marginBottom: '4px' }}>
                  Teks ayat belum dapat dimuat dari server Alkitab.
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', maxWidth: '420px', margin: '0 auto' }}>
                  Pastikan koneksi internet aktif atau coba pilih versi terjemahan lainnya di atas.
                </p>
              </div>
            ) : (
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
          )}

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

