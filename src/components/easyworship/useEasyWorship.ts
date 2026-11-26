import { useState, useEffect, useMemo } from 'react';
import { createRoomCode, useProjectorRoomOperator, type ProjectorLiveState } from '../../lib/projectorSync';
import { mergeSongLibrary, useHymnal } from '../../lib/songLibrary';
import type { ProjectorItem, Song } from '../../types/content';
import type { AppItem } from '../../lib/supabase';
import { usePageIntent } from '../../lib/pageIntent';
import { soundFx } from '../../utils/audio';
import { BIBLE_BOOKS } from '../../data/bibleBooks';

/** One entry of the service order. */
export interface PlaylistItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  text: string;
}

export interface Slide { index: number; label: string; text: string }

interface UseEasyWorshipProps {
  songs?: Song[];
  initialItem?: ProjectorItem | null;
  /** Saved service orders (easy_worship_schedules), readable by everyone. */
  schedules?: AppItem[];
  /** Present for signed-in admins only: saves the current service order as a schedule. */
  onSaveSchedule?: (schedule: AppItem) => unknown;
}

/** Keeps only well-formed slides from a stored schedule. */
function toPlaylist(items: unknown): PlaylistItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i): i is Partial<PlaylistItem> => Boolean(i) && typeof i === 'object' && typeof (i as PlaylistItem).title === 'string')
    .map((i, index) => ({ id: i.id || `ew-${Date.now()}-${index}`, type: i.type || 'custom', title: i.title || '', subtitle: i.subtitle, text: i.text || '' }));
}

const DEFAULT_LIVE_STATE: ProjectorLiveState = {
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

// Helper to break song lyrics into distinct slide stanzas
function parseTextToSlides(rawText: string = ''): Slide[] {
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
export function useEasyWorship({ songs = [], initialItem, schedules = [], onSaveSchedule }: UseEasyWorshipProps) {
  // Built-in hymnal with the custom songs from Supabase
  const { data: hymnal } = useHymnal();
  const availableSongs = useMemo(() => mergeSongLibrary(hymnal || [], songs), [hymnal, songs]);

  // Service order, kept in this browser
  const [playlist, setPlaylist] = useState<PlaylistItem[]>(() => {
    try {
      const saved = localStorage.getItem('bapekkris_ew_playlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeItemId, setActiveItemId] = useState<string | null>(playlist[0]?.id || null);
  const activeItem = playlist.find(p => p.id === activeItemId) || playlist[0] || null;

  // Slides of the currently selected playlist item
  const slides = useMemo(() => {
    return parseTextToSlides(activeItem?.text || '');
  }, [activeItem]);

  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Live Presentation State (What is displayed on the projector)
  const [liveState, setLiveState] = useState<ProjectorLiveState>(() => {
    try {
      const saved = localStorage.getItem('bapekkris_ew_live_state');
      if (saved) return { ...DEFAULT_LIVE_STATE, ...JSON.parse(saved) };
    } catch { /* storage unavailable or corrupt */ }
    return DEFAULT_LIVE_STATE;
  });

  // Cross-device projector room (Supabase Realtime); the code survives a page refresh in this tab
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    try { return sessionStorage.getItem('bapekkris_ew_room') || null; } catch { return null; }
  });
  const { connectedScreens, sendState: sendRemoteState } = useProjectorRoomOperator(roomCode, liveState);

  const startRemoteRoom = () => {
    const code = roomCode || createRoomCode();
    setRoomCode(code);
    try { sessionStorage.setItem('bapekkris_ew_room', code); } catch { /* storage unavailable */ }
    return code;
  };
  const stopRemoteRoom = () => {
    setRoomCode(null);
    try { sessionStorage.removeItem('bapekkris_ew_room'); } catch { /* storage unavailable */ }
  };

  // Modal Add Item states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addTab, setAddTab] = useState<'song' | 'bible' | 'custom'>('song');
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
      const newItem: PlaylistItem = {
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
  const broadcastLiveState = (nextState: ProjectorLiveState) => {
    setLiveState(nextState);
    sendRemoteState(nextState);
    try {
      localStorage.setItem('bapekkris_ew_live_state', JSON.stringify(nextState));
      const channel = new BroadcastChannel('bapekkris_easyworship');
      channel.postMessage(nextState);
      channel.close();
    } catch { /* storage or BroadcastChannel unavailable */ }
  };

  // Push specific slide to LIVE
  const handleGoLive = (item: PlaylistItem | null, slideIdx = 0) => {
    soundFx.playClick();
    const targetItem = item || activeItem;
    if (!targetItem) return;
    const itemSlides = parseTextToSlides(targetItem.text);
    const targetSlide = itemSlides[slideIdx] || itemSlides[0];

    const next: ProjectorLiveState = {
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
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (['input', 'textarea', 'select'].includes(target?.tagName?.toLowerCase() || '')) return;
      // Keys pressed inside a dialog (e.g. Space on a button) belong to the dialog.
      if (target?.closest?.('[role="dialog"]')) return;

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
    } catch { /* storage unavailable */ }
  };

  // Saved schedules: load into the console (anyone) or save the current order (admins)
  const loadSchedule = (schedule: AppItem) => {
    const items = toPlaylist(schedule.items);
    setPlaylist(items);
    setActiveItemId(items[0]?.id || null);
    setActiveSlideIndex(0);
    try { localStorage.setItem('bapekkris_ew_playlist', JSON.stringify(items)); } catch { /* storage unavailable */ }
  };
  const saveSchedule = onSaveSchedule
    ? (title: string, serviceDate: string) => onSaveSchedule({ id: `ews-${Date.now()}`, title, serviceDate, items: playlist, sortOrder: 0 })
    : undefined;
  // "Buka di konsol" from the admin portal; applied once the schedules have loaded
  const [pendingScheduleId, setPendingScheduleId] = useState<string | null>(null);
  usePageIntent('easyworship', ({ scheduleId }) => setPendingScheduleId(scheduleId));
  useEffect(() => {
    if (!pendingScheduleId) return;
    const schedule = schedules.find((s) => s.id === pendingScheduleId);
    if (!schedule) return;
    setPendingScheduleId(null);
    loadSchedule(schedule);
  }, [pendingScheduleId, schedules]);

  const handleAddItemToPlaylist = (newItem: PlaylistItem) => {
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
    schedules,
    loadSchedule,
    saveSchedule,
    roomCode,
    connectedScreens,
    startRemoteRoom,
    stopRemoteRoom
  };
}
