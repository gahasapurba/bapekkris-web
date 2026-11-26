import React, { useState, useMemo } from 'react';
import { soundFx } from '../../utils/audio';
import { BIBLE_BOOKS } from '../../data/bibleBooks';
import { usePageIntent } from '../../lib/pageIntent';

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
  // Opened from site search ("Yoh 3")
  usePageIntent('alkitab', ({ bookId, chapter }) => {
    const book = BIBLE_BOOKS.find(b => b.id === bookId);
    if (!book) return;
    setSelectedBook(book);
    setSelectedChapter(Math.min(Math.max(1, chapter || 1), book.chapters));
  });
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
