import React, { useState, useMemo } from 'react';
import { soundFx } from '../../utils/audio';

// Complete 66 Books of the Holy Bible with Indonesian and English designations
export const BIBLE_BOOKS = [
  // Perjanjian Lama (39 Kitab)
  { id: 'GEN', name: 'Kejadian', en: 'Genesis', abbr: 'Kej', testament: 'PL', category: 'Taurat', chapters: 50, slug: 'kejadian' },
  { id: 'EXO', name: 'Keluaran', en: 'Exodus', abbr: 'Kel', testament: 'PL', category: 'Taurat', chapters: 40, slug: 'keluaran' },
  { id: 'LEV', name: 'Imamat', en: 'Leviticus', abbr: 'Im', testament: 'PL', category: 'Taurat', chapters: 27, slug: 'imamat' },
  { id: 'NUM', name: 'Bilangan', en: 'Numbers', abbr: 'Bil', testament: 'PL', category: 'Taurat', chapters: 36, slug: 'bilangan' },
  { id: 'DEU', name: 'Ulangan', en: 'Deuteronomy', abbr: 'Ul', testament: 'PL', category: 'Taurat', chapters: 34, slug: 'ulangan' },
  { id: 'JOS', name: 'Yosua', en: 'Joshua', abbr: 'Yos', testament: 'PL', category: 'Sejarah', chapters: 24, slug: 'yosua' },
  { id: 'JDG', name: 'Hakim-hakim', en: 'Judges', abbr: 'Hak', testament: 'PL', category: 'Sejarah', chapters: 21, slug: 'hakim_hakim' },
  { id: 'RUT', name: 'Rut', en: 'Ruth', abbr: 'Rut', testament: 'PL', category: 'Sejarah', chapters: 4, slug: 'rut' },
  { id: '1SA', name: '1 Samuel', en: '1 Samuel', abbr: '1Sam', testament: 'PL', category: 'Sejarah', chapters: 31, slug: '1_samuel' },
  { id: '2SA', name: '2 Samuel', en: '2 Samuel', abbr: '2Sam', testament: 'PL', category: 'Sejarah', chapters: 24, slug: '2_samuel' },
  { id: '1KI', name: '1 Raja-raja', en: '1 Kings', abbr: '1Raj', testament: 'PL', category: 'Sejarah', chapters: 22, slug: '1_raja_raja' },
  { id: '2KI', name: '2 Raja-raja', en: '2 Kings', abbr: '2Raj', testament: 'PL', category: 'Sejarah', chapters: 25, slug: '2_raja_raja' },
  { id: '1CH', name: '1 Tawarikh', en: '1 Chronicles', abbr: '1Taw', testament: 'PL', category: 'Sejarah', chapters: 29, slug: '1_tawarikh' },
  { id: '2CH', name: '2 Tawarikh', en: '2 Chronicles', abbr: '2Taw', testament: 'PL', category: 'Sejarah', chapters: 36, slug: '2_tawarikh' },
  { id: 'EZR', name: 'Ezra', en: 'Ezra', abbr: 'Ezr', testament: 'PL', category: 'Sejarah', chapters: 10, slug: 'ezra' },
  { id: 'NEH', name: 'Nehemia', en: 'Nehemiah', abbr: 'Neh', testament: 'PL', category: 'Sejarah', chapters: 13, slug: 'nehemia' },
  { id: 'EST', name: 'Ester', en: 'Esther', abbr: 'Est', testament: 'PL', category: 'Sejarah', chapters: 10, slug: 'ester' },
  { id: 'JOB', name: 'Ayub', en: 'Job', abbr: 'Ayb', testament: 'PL', category: 'Puisi', chapters: 42, slug: 'ayub' },
  { id: 'PSA', name: 'Mazmur', en: 'Psalms', abbr: 'Mzm', testament: 'PL', category: 'Puisi', chapters: 150, slug: 'mazmur' },
  { id: 'PRO', name: 'Amsal', en: 'Proverbs', abbr: 'Ams', testament: 'PL', category: 'Puisi', chapters: 31, slug: 'amsal' },
  { id: 'ECC', name: 'Pengkhotbah', en: 'Ecclesiastes', abbr: 'Pkh', testament: 'PL', category: 'Puisi', chapters: 12, slug: 'pengkotbah' },
  { id: 'SNG', name: 'Kidung Agung', en: 'Song of Solomon', abbr: 'Kid', testament: 'PL', category: 'Puisi', chapters: 8, slug: 'kidung_agung' },
  { id: 'ISA', name: 'Yesaya', en: 'Isaiah', abbr: 'Yes', testament: 'PL', category: 'Nabi-nabi', chapters: 66, slug: 'yesaya' },
  { id: 'JER', name: 'Yeremia', en: 'Jeremiah', abbr: 'Yer', testament: 'PL', category: 'Nabi-nabi', chapters: 52, slug: 'yeremia' },
  { id: 'LAM', name: 'Ratapan', en: 'Lamentations', abbr: 'Rat', testament: 'PL', category: 'Nabi-nabi', chapters: 5, slug: 'ratapan' },
  { id: 'EZK', name: 'Yehezkiel', en: 'Ezekiel', abbr: 'Yeh', testament: 'PL', category: 'Nabi-nabi', chapters: 48, slug: 'yehezkiel' },
  { id: 'DAN', name: 'Daniel', en: 'Daniel', abbr: 'Dan', testament: 'PL', category: 'Nabi-nabi', chapters: 12, slug: 'daniel' },
  { id: 'HOS', name: 'Hosea', en: 'Hosea', abbr: 'Hos', testament: 'PL', category: 'Nabi-nabi', chapters: 14, slug: 'hosea' },
  { id: 'JOL', name: 'Yoel', en: 'Joel', abbr: 'Yol', testament: 'PL', category: 'Nabi-nabi', chapters: 3, slug: 'yoel' },
  { id: 'AMO', name: 'Amos', en: 'Amos', abbr: 'Am', testament: 'PL', category: 'Nabi-nabi', chapters: 9, slug: 'amos' },
  { id: 'OBA', name: 'Obaja', en: 'Obadiah', abbr: 'Ob', testament: 'PL', category: 'Nabi-nabi', chapters: 1, slug: 'obaja' },
  { id: 'JON', name: 'Yunus', en: 'Jonah', abbr: 'Yun', testament: 'PL', category: 'Nabi-nabi', chapters: 4, slug: 'yunus' },
  { id: 'MIC', name: 'Mikha', en: 'Micah', abbr: 'Mik', testament: 'PL', category: 'Nabi-nabi', chapters: 7, slug: 'mikha' },
  { id: 'NAM', name: 'Nahum', en: 'Nahum', abbr: 'Nah', testament: 'PL', category: 'Nabi-nabi', chapters: 3, slug: 'nahum' },
  { id: 'HAB', name: 'Habakuk', en: 'Habakkuk', abbr: 'Hab', testament: 'PL', category: 'Nabi-nabi', chapters: 3, slug: 'habakuk' },
  { id: 'ZEP', name: 'Zefanya', en: 'Zephaniah', abbr: 'Zef', testament: 'PL', category: 'Nabi-nabi', chapters: 3, slug: 'zefanya' },
  { id: 'HAG', name: 'Hagai', en: 'Haggai', abbr: 'Hag', testament: 'PL', category: 'Nabi-nabi', chapters: 2, slug: 'hagai' },
  { id: 'ZEC', name: 'Zakharia', en: 'Zechariah', abbr: 'Zak', testament: 'PL', category: 'Nabi-nabi', chapters: 14, slug: 'zakaria' },
  { id: 'MAL', name: 'Maleakhi', en: 'Malachi', abbr: 'Mal', testament: 'PL', category: 'Nabi-nabi', chapters: 4, slug: 'maleakhi' },

  // Perjanjian Baru (27 Kitab)
  { id: 'MAT', name: 'Matius', en: 'Matthew', abbr: 'Mat', testament: 'PB', category: 'Injil', chapters: 28, slug: 'matius' },
  { id: 'MRK', name: 'Markus', en: 'Mark', abbr: 'Mrk', testament: 'PB', category: 'Injil', chapters: 16, slug: 'markus' },
  { id: 'LUK', name: 'Lukas', en: 'Luke', abbr: 'Luk', testament: 'PB', category: 'Injil', chapters: 24, slug: 'lukas' },
  { id: 'JHN', name: 'Yohanes', en: 'John', abbr: 'Yoh', testament: 'PB', category: 'Injil', chapters: 21, slug: 'yohanes' },
  { id: 'ACT', name: 'Kisah Para Rasul', en: 'Acts', abbr: 'Kis', testament: 'PB', category: 'Sejarah', chapters: 28, slug: 'kisah_para_rasul' },
  { id: 'ROM', name: 'Roma', en: 'Romans', abbr: 'Rom', testament: 'PB', category: 'Surat', chapters: 16, slug: 'roma' },
  { id: '1CO', name: '1 Korintus', en: '1 Corinthians', abbr: '1Kor', testament: 'PB', category: 'Surat', chapters: 16, slug: '1_korintus' },
  { id: '2CO', name: '2 Korintus', en: '2 Corinthians', abbr: '2Kor', testament: 'PB', category: 'Surat', chapters: 13, slug: '2_korintus' },
  { id: 'GAL', name: 'Galatia', en: 'Galatians', abbr: 'Gal', testament: 'PB', category: 'Surat', chapters: 6, slug: 'galatia' },
  { id: 'EPH', name: 'Efesus', en: 'Ephesians', abbr: 'Efe', testament: 'PB', category: 'Surat', chapters: 6, slug: 'efesus' },
  { id: 'PHP', name: 'Filipi', en: 'Philippians', abbr: 'Flp', testament: 'PB', category: 'Surat', chapters: 4, slug: 'filipi' },
  { id: 'COL', name: 'Kolose', en: 'Colossians', abbr: 'Kol', testament: 'PB', category: 'Surat', chapters: 4, slug: 'kolose' },
  { id: '1TH', name: '1 Tesalonika', en: '1 Thessalonians', abbr: '1Tes', testament: 'PB', category: 'Surat', chapters: 5, slug: '1_tesalonika' },
  { id: '2TH', name: '2 Tesalonika', en: '2 Thessalonians', abbr: '2Tes', testament: 'PB', category: 'Surat', chapters: 3, slug: '2_tesalonika' },
  { id: '1TI', name: '1 Timotius', en: '1 Timothy', abbr: '1Tim', testament: 'PB', category: 'Surat', chapters: 6, slug: '1_timotius' },
  { id: '2TI', name: '2 Timotius', en: '2 Timothy', abbr: '2Tim', testament: 'PB', category: 'Surat', chapters: 4, slug: '2_timotius' },
  { id: 'TIT', name: 'Titus', en: 'Titus', abbr: 'Tit', testament: 'PB', category: 'Surat', chapters: 3, slug: 'titus' },
  { id: 'PHM', name: 'Filemon', en: 'Philemon', abbr: 'Flm', testament: 'PB', category: 'Surat', chapters: 1, slug: 'filemon' },
  { id: 'HEB', name: 'Ibrani', en: 'Hebrews', abbr: 'Ibr', testament: 'PB', category: 'Surat', chapters: 13, slug: 'ibrani' },
  { id: 'JAS', name: 'Yakobus', en: 'James', abbr: 'Yak', testament: 'PB', category: 'Surat', chapters: 5, slug: 'yakobus' },
  { id: '1PE', name: '1 Petrus', en: '1 Peter', abbr: '1Pet', testament: 'PB', category: 'Surat', chapters: 5, slug: '1_petrus' },
  { id: '2PE', name: '2 Petrus', en: '2 Peter', abbr: '2Pet', testament: 'PB', category: 'Surat', chapters: 3, slug: '2_petrus' },
  { id: '1JN', name: '1 Yohanes', en: '1 John', abbr: '1Yoh', testament: 'PB', category: 'Surat', chapters: 5, slug: '1_yohanes' },
  { id: '2JN', name: '2 Yohanes', en: '2 John', abbr: '2Yoh', testament: 'PB', category: 'Surat', chapters: 1, slug: '2_yohanes' },
  { id: '3JN', name: '3 Yohanes', en: '3 John', abbr: '3Yoh', testament: 'PB', category: 'Surat', chapters: 1, slug: '3_yohanes' },
  { id: 'JUD', name: 'Yudas', en: 'Jude', abbr: 'Yud', testament: 'PB', category: 'Surat', chapters: 1, slug: 'yudas' },
  { id: 'REV', name: 'Wahyu', en: 'Revelation', abbr: 'Why', testament: 'PB', category: 'Nubuat', chapters: 22, slug: 'wahyu' }
];

export const BIBLE_VERSIONS = [
  { id: 'TB', name: 'TB (Terjemahan Baru)', short: 'TB', source: 'LAI' },
  { id: 'KJV', name: 'KJV (King James)', short: 'KJV', source: 'English' },
  { id: 'WEB', name: 'WEB (World English)', short: 'WEB', source: 'English' }
];

/** State, verse loading (with cache) and actions of the Bible reader; markup in BibleSection.tsx. */
export function useBible({
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

  // Downloaded Terjemahan Baru books by book id ({ "1": [...verses], ... }) and verses per version/chapter
  const bookCacheRef = React.useRef({});
  const [apiVerses, setApiVerses] = useState({});
  const apiVersesRef = React.useRef(apiVerses);
  apiVersesRef.current = apiVerses;
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);

  React.useEffect(() => {
    const cacheKey = `${selectedVersion}-${selectedBook.name}-${selectedChapter}`;
    if (apiVersesRef.current[cacheKey]) {
      setIsLoadingVerses(false);
      return undefined;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const cleanVerses = (list) => (Array.isArray(list) ? list : []).map(v => ({ verse: v.verse, text: (v.text || '').trim() }));

    const loadEnglish = async () => {
      const bookQuery = selectedBook.en || selectedBook.name;
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(bookQuery)}+${selectedChapter}?translation=${selectedVersion.toLowerCase()}`, { signal });
      if (!res.ok) throw new Error(`bible-api.com status ${res.status}`);
      return cleanVerses((await res.json())?.verses);
    };

    // Terjemahan Baru (LAI) text from the open alkitab-api dataset: jsDelivr first, GitHub raw as fallback
    const loadTerjemahanBaru = async () => {
      let chapters = bookCacheRef.current[selectedBook.id];
      if (!chapters) {
        const slug = selectedBook.slug || selectedBook.name.toLowerCase().replace(/[\s-]+/g, '_');
        const dir = (selectedBook.testament || 'PL').toLowerCase();
        const sources = [
          `https://cdn.jsdelivr.net/gh/tobiasagyasta/alkitab-api@master/lib/${dir}/${slug}.json`,
          `https://raw.githubusercontent.com/tobiasagyasta/alkitab-api/master/lib/${dir}/${slug}.json`
        ];
        for (const source of sources) {
          try {
            const res = await fetch(source, { signal });
            if (!res.ok) continue;
            chapters = (await res.json())?.chapters;
            if (chapters) break;
          } catch (err) {
            if (err.name === 'AbortError') throw err;
          }
        }
        if (!chapters) throw new Error(`Kitab ${selectedBook.name} tidak dapat dimuat dari server Alkitab`);
        bookCacheRef.current[selectedBook.id] = chapters;
      }
      return cleanVerses(chapters[String(selectedChapter)]);
    };

    setIsLoadingVerses(true);
    (selectedVersion === 'TB' ? loadTerjemahanBaru() : loadEnglish())
      .then((verses) => {
        if (verses.length > 0) setApiVerses(prev => ({ ...prev, [cacheKey]: verses }));
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Alkitab fetch error:', err);
      })
      .finally(() => {
        if (!signal.aborted) setIsLoadingVerses(false);
      });

    return () => controller.abort();
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

  return {
    selectedBook,
    setSelectedBook,
    selectedChapter,
    setSelectedChapter,
    selectedVersion,
    setSelectedVersion,
    searchBookQuery,
    setSearchBookQuery,
    testamentFilter,
    setTestamentFilter,
    copiedVerse,
    fontSize,
    setFontSize,
    isLoadingVerses,
    filteredBooks,
    currentVerses,
    handleCopyVerse,
    handleShareWa,
    handleSendVerseToEasyWorship,
    onSendToEasyWorship
  };
}
