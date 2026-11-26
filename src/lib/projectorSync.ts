// Cross-device projector sync over Supabase Realtime Broadcast (no database writes).
// The operator console and any number of projector screens join the channel of a short room code;
// the operator broadcasts the live slide state and answers screens that ask for the current state.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface ProjectorLiveState {
  type: string;
  title: string;
  text: string;
  ref?: string;
  isBlackout: boolean;
  isClearText: boolean;
  isLogo: boolean;
  isLowerThird: boolean;
  bgTheme: string;
  fontSize: number;
}

// Unambiguous characters only (no 0/O, 1/I/L), so codes are easy to read off a screen.
const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;
const BG_THEMES = ['cathedral', 'heavenly', 'celestial', 'cross', 'minimal'];

export function createRoomCode(): string {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ROOM_ALPHABET[b % ROOM_ALPHABET.length]).join('');
}

/** Uppercases and strips anything that cannot be part of a room code; null when incomplete. */
export function normalizeRoomCode(raw: string | null | undefined): string | null {
  const code = String(raw || '').toUpperCase().split('').filter((c) => ROOM_ALPHABET.includes(c)).join('');
  return code.length === ROOM_CODE_LENGTH ? code : null;
}

export function projectorRoomUrl(origin: string, code: string): string {
  return `${origin}/?mode=projector&room=${code}#projector`;
}

/**
 * Anyone who knows a room code can broadcast to it, so screens accept only the known fields with
 * sane types and lengths and ignore everything else.
 */
export function sanitizeLiveState(payload: unknown): ProjectorLiveState | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
  const fontSize = Number(p.fontSize);
  return {
    type: str(p.type, 20) || 'custom',
    title: str(p.title, 200),
    text: str(p.text, 5000),
    ref: str(p.ref, 200),
    isBlackout: p.isBlackout === true,
    isClearText: p.isClearText === true,
    isLogo: p.isLogo === true,
    isLowerThird: p.isLowerThird === true,
    bgTheme: BG_THEMES.includes(String(p.bgTheme)) ? String(p.bgTheme) : 'cathedral',
    fontSize: Number.isFinite(fontSize) ? Math.min(120, Math.max(16, fontSize)) : 48
  };
}

const channelName = (code: string) => `projector:${code}`;

/** Operator side: broadcasts state to the room and reports how many screens are connected. */
export function useProjectorRoomOperator(roomCode: string | null, liveState: ProjectorLiveState) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const readyRef = useRef(false);
  const stateRef = useRef(liveState);
  stateRef.current = liveState;
  const [connectedScreens, setConnectedScreens] = useState(0);

  const sendState = useCallback((state: ProjectorLiveState) => {
    if (!readyRef.current || !channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'state', payload: state });
  }, []);

  useEffect(() => {
    if (!roomCode) {
      setConnectedScreens(0);
      return undefined;
    }
    const channel = supabase.channel(channelName(roomCode), {
      config: { broadcast: { self: false }, presence: { key: `operator-${createRoomCode()}` } }
    });
    channelRef.current = channel;
    channel
      .on('broadcast', { event: 'request_state' }, () => sendState(stateRef.current))
      .on('presence', { event: 'sync' }, () => {
        const screens = Object.values(channel.presenceState()).flat().filter((m) => (m as { role?: string }).role === 'screen');
        setConnectedScreens(screens.length);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          readyRef.current = true;
          channel.track({ role: 'operator' });
          sendState(stateRef.current);
        }
      });
    return () => {
      readyRef.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [roomCode, sendState]);

  return { connectedScreens, sendState };
}

export type ScreenConnection = 'idle' | 'connecting' | 'connected' | 'error';

/** Projector side: joins the room, asks for the current state and applies every update. */
export function useProjectorRoomScreen(roomCode: string | null, onState: (state: ProjectorLiveState) => void): ScreenConnection {
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const [connection, setConnection] = useState<ScreenConnection>('idle');

  useEffect(() => {
    if (!roomCode) {
      setConnection('idle');
      return undefined;
    }
    setConnection('connecting');
    const channel = supabase.channel(channelName(roomCode), {
      config: { broadcast: { self: false }, presence: { key: `screen-${createRoomCode()}` } }
    });
    channel
      .on('broadcast', { event: 'state' }, ({ payload }) => {
        const state = sanitizeLiveState(payload);
        if (state) onStateRef.current(state);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnection('connected');
          channel.track({ role: 'screen' });
          channel.send({ type: 'broadcast', event: 'request_state', payload: {} });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setConnection('error');
        }
      });
    return () => { supabase.removeChannel(channel); };
  }, [roomCode]);

  return connection;
}
