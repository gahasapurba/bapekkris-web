// The built-in hymnal (1,000+ songs, ~770 KB) is loaded on demand, so pages render their header
// before the data arrives; TanStack Query keeps a single copy for every page that needs it.

import { useQuery } from '@tanstack/react-query';
import type { Song } from '../types/content';

export function loadHymnal(): Promise<Song[]> {
  return import('../data/hymnalLibrary').then((mod) => mod.BIBLE_SONG_COLLECTION);
}

/** The built-in hymnal; `data` is undefined while it loads. */
export function useHymnal() {
  return useQuery({ queryKey: ['hymnal'], queryFn: loadHymnal, staleTime: Infinity, gcTime: Infinity });
}

/**
 * The built-in hymnal with the custom songs from Supabase applied on top: a custom song with the
 * same id or hymn number replaces the built-in entry, others are added. Sorted by number, then title.
 */
export function mergeSongLibrary(hymnal: Song[], customSongs: Song[] = []): Song[] {
  const list: Song[] = [...hymnal];
  customSongs.forEach((custom) => {
    const idx = list.findIndex((s) =>
      (custom.id && s.id === custom.id) ||
      (custom.songNumber && s.songNumber?.toLowerCase() === custom.songNumber.toLowerCase())
    );
    if (idx >= 0) list[idx] = { ...list[idx], ...custom };
    else list.push(custom);
  });
  return list.sort((a, b) => (a.songNumber || a.title || '').localeCompare(b.songNumber || b.title || ''));
}
