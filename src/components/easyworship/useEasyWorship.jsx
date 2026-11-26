import { useState, useEffect, useMemo } from 'react';
import { createRoomCode, useProjectorRoomOperator } from '../../lib/projectorSync';
import { soundFx } from '../../utils/audio';
import { BIBLE_BOOKS } from '../bible/useBible';
import { BIBLE_SONG_COLLECTION } from '../../data/hymnalLibrary';

// Helper to break song lyrics into distinct slide stanzas
function parseTextToSlides(rawText = '') {
  if (!rawText) return [];
  const normalized = rawText.replace(/\r\n/g, '\n').trim();
  // Split by double newline or Stanza labels
  const parts = normalized.split(/\n\s*\n/);
  return parts.map((part, index) => {
    const trimmed = part.trim();
    let label = `Slide ${index + 1}`;
    if (/^bait\s*\d+/i.test(trimmed)) {
      const match = trimmed.match(/^bait\s*(\d+)/i);
      label = `Bait ${match ? match[1] : index + 1}`;
    } else if (/^reff|^chorus/i.test(trimmed)) {
      label = 'Reff / Chorus';
    } else if (/^bridge/i.test(trimmed)) {
      label = 'Bridge';
    } else if (/^ending|^coda/i.test(trimmed)) {
      label = 'Ending';
    }
    return {
      index,
      label,
      text: trimmed
    };
  });
}

/** Service order, slides, live projector state and controls; markup in EasyWorshipSection.tsx. */
export function useEasyWorship({
  songs = [],
  theme,
  initialItem
}) {
  const isDark = theme === 'dark';

  // Koleksi lagu lengkap (Pustaka Himne Kanonik + custom dari Supabase)
  const availableSongs = useMemo(() => {
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

  // Master Playlist / Service Order state
  const [playlist, setPlaylist] = useState(() => {
    try {
      const saved = localStorage.getItem('bapekkris_ew_playlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeItemId, setActiveItemId] = useState(playlist[0]?.id || null);
  const activeItem = playlist.find(p => p.id === activeItemId) || playlist[0] || null;

  // Slides of the currently selected playlist item
  const slides = useMemo(() => {
    return parseTextToSlides(activeItem?.text || '');
  }, [activeItem]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Live Presentation State (What is displayed on the projector)
  const [liveState, setLiveState] = useState(() => {
    try {
      const saved = localStorage.getItem('bapekkris_ew_live_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      type: 'logo',
      title: 'BAPEKKRIS BANK MANDIRI',
      text: 'Badan Pembinaan Kerohanian Kristen PT Bank Mandiri (Persero) Tbk.',
      isBlackout: false,
      isClearText: false,
      isLogo: true,
      isLowerThird: false,
      bgTheme: 'cathedral',
      fontSize: 48
    };
  });

  // Cross-device projector room (Supabase Realtime); the code survives a page refresh in this tab
  const [roomCode, setRoomCode] = useState(() => {
    try { return sessionStorage.getItem('bapekkris_ew_room') || null; } catch (e) { return null; }
  });
  const { connectedScreens, sendState: sendRemoteState } = useProjectorRoomOperator(roomCode, liveState);

  const startRemoteRoom = () => {
    const code = roomCode || createRoomCode();
    setRoomCode(code);
    try { sessionStorage.setItem('bapekkris_ew_room', code); } catch (e) { /* storage unavailable */ }
    return code;
  };
  const stopRemoteRoom = () => {
    setRoomCode(null);
    try { sessionStorage.removeItem('bapekkris_ew_room'); } catch (e) { /* storage unavailable */ }
  };

  // Modal Add Item states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState('song'); // 'song' | 'bible' | 'custom'
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [selectedBibleBook, setSelectedBibleBook] = useState(BIBLE_BOOKS[0]);
  const [selectedBibleChapter, setSelectedBibleChapter] = useState(1);
  const [selectedBibleVerse, setSelectedBibleVerse] = useState('1');
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const filteredAvailableSongs = useMemo(() => {
    const q = songSearchQuery.toLowerCase().trim();
    if (!q) return availableSongs.slice(0, 50);
    return availableSongs.filter(s => 
      (s.title || '').toLowerCase().includes(q) || 
      (s.songNumber || '').toLowerCase().includes(q) || 
      (s.lyrics || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }, [availableSongs, songSearchQuery]);

  // Handle incoming initialItem (e.g. from Alkitab or Kidung Jemaat "Kirim ke EasyWorship")
  useEffect(() => {
    if (initialItem && initialItem.title) {
      const newItem = {
        id: `ew-${Date.now()}`,
        type: initialItem.type || 'custom',
        title: initialItem.title,
        subtitle: initialItem.type === 'bible' ? 'Pembacaan Alkitab' : 'Lagu Pujian',
        text: initialItem.lyrics || initialItem.text || ''
      };
      setPlaylist(prev => [newItem, ...prev]);
      setActiveItemId(newItem.id);
      setActiveSlideIndex(0);
      handleGoLive(newItem, 0);
    }
  }, [initialItem]);

  // Sync live state to projector windows on this device (BroadcastChannel / storage) and to
  // screens on other devices joined to the room (Supabase Realtime)
  const broadcastLiveState = (nextState) => {
    setLiveState(nextState);
    sendRemoteState(nextState);
    try {
      localStorage.setItem('bapekkris_ew_live_state', JSON.stringify(nextState));
      const channel = new BroadcastChannel('bapekkris_easyworship');
      channel.postMessage(nextState);
      channel.close();
    } catch (e) { /* storage or BroadcastChannel unavailable */ }
  };

  // Push specific slide to LIVE
  const handleGoLive = (item, slideIdx = 0) => {
    soundFx.playClick();
    const targetItem = item || activeItem;
    if (!targetItem) return;
    const itemSlides = parseTextToSlides(targetItem.text);
    const targetSlide = itemSlides[slideIdx] || itemSlides[0];

    const next = {
      ...liveState,
      type: targetItem.type,
      title: targetItem.title,
      text: targetSlide ? targetSlide.text : targetItem.text,
      isBlackout: false,
      isClearText: false,
      isLogo: false
    };
    broadcastLiveState(next);
  };

  // Keyboard navigation for presentation slides
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea', 'select'].includes(e.target.tagName?.toLowerCase())) return;
      // Keys pressed inside a dialog (e.g. Space on a button) belong to the dialog.
      if (e.target.closest?.('[role="dialog"]')) return;

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        if (slides.length > 0 && activeSlideIndex < slides.length - 1) {
          const nextIdx = activeSlideIndex + 1;
          setActiveSlideIndex(nextIdx);
          handleGoLive(activeItem, nextIdx);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        if (slides.length > 0 && activeSlideIndex > 0) {
          const prevIdx = activeSlideIndex - 1;
          setActiveSlideIndex(prevIdx);
          handleGoLive(activeItem, prevIdx);
        }
      } else if (e.key === 'F5') {
        e.preventDefault();
        handleToggleBlackout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides, activeSlideIndex, activeItem, liveState]);

  // Master Action Controls
  const handleToggleBlackout = () => {
    soundFx.playClick();
    broadcastLiveState({ ...liveState, isBlackout: !liveState.isBlackout });
  };

  const handleToggleClearText = () => {
    soundFx.playClick();
    broadcastLiveState({ ...liveState, isClearText: !liveState.isClearText });
  };

  const handleToggleLogo = () => {
    soundFx.playClick();
    broadcastLiveState({ ...liveState, isLogo: !liveState.isLogo, isBlackout: false, isClearText: false });
  };

  const handleOpenProjectorWindow = () => {
    soundFx.playClick();
    window.open('/?mode=projector#projector', 'BapekkrisProjectorOutput', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  };

  const handleSavePlaylist = () => {
    try {
      localStorage.setItem('bapekkris_ew_playlist', JSON.stringify(playlist));
      soundFx.playClick();
      setToastMsg('Susunan Tata Ibadah berhasil disimpan!');
      setTimeout(() => setToastMsg(''), 2500);
    } catch (e) {}
  };

  const handleAddItemToPlaylist = (newItem) => {
    setPlaylist(prev => [...prev, newItem]);
    setActiveItemId(newItem.id);
    setActiveSlideIndex(0);
    setIsAddModalOpen(false);
  };

  return {
    playlist,
    setPlaylist,
    activeItem,
    setActiveItemId,
    slides,
    activeSlideIndex,
    setActiveSlideIndex,
    liveState,
    isAddModalOpen,
    setIsAddModalOpen,
    addTab,
    setAddTab,
    songSearchQuery,
    setSongSearchQuery,
    selectedBibleBook,
    setSelectedBibleBook,
    selectedBibleChapter,
    setSelectedBibleChapter,
    selectedBibleVerse,
    setSelectedBibleVerse,
    customTitle,
    setCustomTitle,
    customText,
    setCustomText,
    toastMsg,
    filteredAvailableSongs,
    broadcastLiveState,
    handleGoLive,
    handleToggleBlackout,
    handleToggleClearText,
    handleToggleLogo,
    handleOpenProjectorWindow,
    handleSavePlaylist,
    handleAddItemToPlaylist,
    roomCode,
    connectedScreens,
    startRemoteRoom,
    stopRemoteRoom
  };
}
