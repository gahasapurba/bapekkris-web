import { useState, useEffect, useRef } from 'react';
import { BookOpen, Cross, Music } from 'lucide-react';
import { cn } from '../ui';
import { normalizeRoomCode, sanitizeLiveState, useProjectorRoomScreen, ROOM_CODE_LENGTH, type ProjectorLiveState, type ScreenConnection } from '../lib/projectorSync';
import { buildPageMeta, useDocumentMeta } from '../lib/seo';

const CONNECTION_LABEL: Partial<Record<ScreenConnection, string>> = {
  connecting: 'Menyambungkan ke konsol operator…',
  connected: 'Tersambung ke konsol operator',
  error: 'Gagal tersambung. Periksa koneksi internet atau kode ruang.'
};

/**
 * Corner panel of the projector screen: shows the room connection, or lets the operator type a room
 * code when the screen was opened without one. Hidden while connected unless the pointer moves.
 */
function RoomPanel({ roomCode, connection, onConnect }: { roomCode: string | null; connection: ScreenConnection; onConnect: (code: string) => void }) {
  const [visible, setVisible] = useState(true);
  const [draft, setDraft] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const reveal = () => {
      setVisible(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 3000);
    };
    reveal();
    window.addEventListener('mousemove', reveal);
    window.addEventListener('touchstart', reveal);
    return () => {
      clearTimeout(timerRef.current);
      window.removeEventListener('mousemove', reveal);
      window.removeEventListener('touchstart', reveal);
    };
  }, []);

  const pinned = !roomCode || connection !== 'connected';
  if (!visible && !pinned) return null;
  const code = normalizeRoomCode(draft);

  return (
    <div className="fixed bottom-5 right-5 z-[1000000] max-w-[360px] rounded-xl border border-[rgba(255,255,255,0.18)] bg-[rgba(5,12,28,0.88)] px-4 py-3.5 font-sans text-[0.9rem] leading-snug text-white">
      {roomCode ? (
        <div role="status">
          <strong className="block tracking-[0.2em]">RUANG {roomCode}</strong>
          <span className={connection === 'error' ? 'text-[#fca5a5]' : 'text-[#cbd5e1]'}>{CONNECTION_LABEL[connection] || ''}</span>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (code) onConnect(code); }} className="flex flex-col gap-2">
          <label htmlFor="projector-room-code" className="text-[#cbd5e1]">Sambungkan ke konsol di perangkat lain</label>
          <div className="flex gap-2">
            <input id="projector-room-code" value={draft} onChange={(e) => setDraft(e.target.value.toUpperCase())} maxLength={ROOM_CODE_LENGTH + 2} placeholder="KODE RUANG" autoComplete="off"
              className="min-w-0 flex-1 rounded-lg border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.08)] px-2.5 py-2 font-bold tracking-[0.2em] text-white placeholder:text-[rgba(255,255,255,0.5)]" />
            <button type="submit" disabled={!code}
              className={cn('rounded-lg border-0 px-3.5 py-2 font-bold text-[#0b1320]', code ? 'cursor-pointer bg-[#e3b341]' : 'cursor-not-allowed bg-[#64748b]')}>Sambungkan</button>
          </div>
        </form>
      )}
    </div>
  );
}

const DEFAULT_LIVE_STATE: ProjectorLiveState = {
  type: 'logo',
  title: 'BAPEKKRIS BANK MANDIRI',
  text: 'Badan Pembinaan Kerohanian Kristen PT Bank Mandiri (Persero) Tbk.',
  ref: '',
  isBlackout: false,
  isClearText: false,
  isLogo: true,
  isLowerThird: false,
  bgTheme: 'cathedral',
  fontSize: 48
};

// Pure Fullscreen Projector Display for 2nd Monitor / HDMI Projector
export default function ProjectorDisplay() {
  const [liveState, setLiveState] = useState<ProjectorLiveState>(() => {
    try {
      const cached = localStorage.getItem('bapekkris_ew_live_state');
      return (cached && sanitizeLiveState(JSON.parse(cached))) || DEFAULT_LIVE_STATE;
    } catch {
      return DEFAULT_LIVE_STATE;
    }
  });

  useDocumentMeta(buildPageMeta('projector'));

  // Room on another device (?room=CODE); otherwise windows on this device sync via BroadcastChannel
  const [roomCode, setRoomCode] = useState(() => normalizeRoomCode(new URLSearchParams(window.location.search).get('room')));
  const connection = useProjectorRoomScreen(roomCode, setLiveState);
  const connectRoom = (code: string) => {
    setRoomCode(code);
    const url = new URL(window.location.href);
    url.searchParams.set('room', code);
    window.history.replaceState(null, '', url);
  };
  const roomPanel = <RoomPanel roomCode={roomCode} connection={connection} onConnect={connectRoom} />;

  useEffect(() => {
    // Listen to BroadcastChannel for real-time instant cross-window sync
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('bapekkris_easyworship');
      channel.onmessage = (event: MessageEvent) => {
        const next = sanitizeLiveState(event.data);
        if (next) setLiveState(next);
      };
    } catch { /* BroadcastChannel unavailable */ }

    // Fallback storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== 'bapekkris_ew_live_state' || !e.newValue) return;
      try {
        const next = sanitizeLiveState(JSON.parse(e.newValue));
        if (next) setLiveState(next);
      } catch { /* malformed value */ }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const getBackgroundStyle = () => {
    if (liveState.isBlackout) return { background: '#000000' };

    switch (liveState.bgTheme) {
      case 'heavenly':
        return {
          background: 'linear-gradient(135deg, #001c3d 0%, #003d79 40%, #ffb800 100%)'
        };
      case 'celestial':
        return {
          background: 'radial-gradient(circle at center, #003d79 0%, #021226 70%, #010814 100%)'
        };
      case 'cross':
        return {
          background: 'linear-gradient(180deg, #051329 0%, #002244 50%, #003d79 100%)'
        };
      case 'minimal':
        return { background: '#050a14' };
      case 'cathedral':
      default:
        return {
          background: 'linear-gradient(135deg, #040914 0%, #002244 45%, #003d79 80%, #040914 100%)'
        };
    }
  };

  if (liveState.isBlackout) {
    return <div className="h-screen w-screen bg-black">{roomPanel}</div>;
  }

  const lowerThird = liveState.isLowerThird;
  return (
    <div className={cn('fixed inset-0 z-[999999] m-0 flex h-screen w-screen flex-col items-center overflow-hidden p-0 font-sans text-white transition-[background] duration-500',
      lowerThird ? 'justify-end' : 'justify-center')} style={getBackgroundStyle()}>
      {/* Soft light behind the text */}
      {!lowerThird && (
        <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,184,0,0.12)_0%,rgba(56,189,248,0.05)_50%,transparent_70%)]" />
      )}

      {liveState.isLogo && !liveState.isClearText && (
        <div className="z-[2] flex flex-col items-center justify-center p-10 text-center">
          <div className="mb-7 flex size-[120px] items-center justify-center rounded-[32px] border-[3px] border-[#ffb800] bg-[linear-gradient(135deg,#003d79_0%,#001c3d_100%)] shadow-[0_10px_40px_rgba(0,61,121,0.7)]">
            <Cross size={60} aria-hidden="true" className="text-[#ffb800]" />
          </div>
          <h1 className="m-0 mb-3.5 text-[clamp(2.5rem,5vw,4.5rem)] font-black tracking-[0.04em] text-white [text-shadow:0_4px_20px_rgba(0,0,0,0.8)]">BAPEKKRIS BANK MANDIRI</h1>
          <p className="m-0 text-[clamp(1.1rem,2vw,1.8rem)] font-bold text-[#ffb800] [text-shadow:0_2px_10px_rgba(0,0,0,0.8)]">Badan Pembinaan Kerohanian Kristen • PT Bank Mandiri (Persero) Tbk.</p>
        </div>
      )}

      {!liveState.isLogo && !liveState.isClearText && (
        <div className={cn('z-[2] text-center',
          lowerThird
            ? 'w-full border-t-[3px] border-[#ffb800] bg-[linear-gradient(180deg,rgba(0,30,60,0.88)_0%,rgba(0,15,35,0.96)_100%)] px-[60px] py-[30px] shadow-[0_-10px_30px_rgba(0,0,0,0.6)]'
            : 'w-[90%] max-w-[1400px] p-10')}>
          {liveState.title && (
            <div className={cn('inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[#ffb800] bg-[rgba(255,184,0,0.22)] px-5 py-1.5 font-extrabold text-[#ffb800] [text-shadow:0_2px_8px_rgba(0,0,0,0.7)]',
              lowerThird ? 'mb-3.5 text-[1.1rem]' : 'mb-7 text-[1.4rem]')}>
              {liveState.type === 'bible' ? <BookOpen size={22} aria-hidden="true" /> : <Music size={22} aria-hidden="true" />}
              <span>{liveState.title}</span>
            </div>
          )}
          {/* Font size follows the operator's setting (live state) */}
          <div className="whitespace-pre-line font-extrabold leading-[1.45] tracking-[0.01em] text-white [text-shadow:0_4px_16px_rgba(0,0,0,0.9),0_2px_4px_rgba(0,0,0,0.8)]"
            style={{ fontSize: lowerThird ? 'clamp(1.4rem, 2.5vw, 2.2rem)' : `clamp(2rem, ${liveState.fontSize || 48}px, 3.8rem)` }}>
            {liveState.text}
          </div>
        </div>
      )}
      {roomPanel}
    </div>
  );
}
