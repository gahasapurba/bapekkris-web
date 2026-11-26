import { useState, useMemo, useEffect } from 'react';
import { usePageIntent } from '../../lib/pageIntent';
import { soundFx } from '../../utils/audio';
import { BIBLE_SONG_COLLECTION } from '../../data/hymnalLibrary';

/** Hymnal + custom songs, filters and actions of the songbook; markup in WorshipSongSection.tsx. */
export function useWorshipSongs({
  songs = [],
  theme,
  onSendToEasyWorship
}) {
  const isDark = theme === 'dark';
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(80);

  // Reset display limit when search query or category changes
  useEffect(() => {
    setDisplayLimit(80);
  }, [searchQuery, selectedCategory]);

  // Kombinasi Pustaka Himne Kanonik (KJ, PKJ, NKB, PW) dengan lagu kustom dari Supabase (jika ada)
  const songList = useMemo(() => {
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

  const [activeSongId, setActiveSongId] = useState(songList[0]?.id || null);
  // Opened from site search: show the hymn with no filter hiding it
  usePageIntent('lagu', ({ songId }) => {
    setSelectedCategory('ALL');
    setSearchQuery('');
    setActiveSongId(songId);
  });

  const activeSong = songList.find(s => s.id === activeSongId) || songList[0] || null;

  const categoryCounts = useMemo(() => {
    const counts = { ALL: songList.length };
    songList.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [songList]);

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

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    copied,
    displayLimit,
    setDisplayLimit,
    songList,
    activeSong,
    setActiveSongId,
    categoryCounts,
    filteredSongs,
    handleCopySong,
    handleSendToProjector,
    onSendToEasyWorship
  };
}
