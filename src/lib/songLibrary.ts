import { BIBLE_SONG_COLLECTION } from '../data/hymnalLibrary';
import type { Song } from '../types/content';

/**
 * The built-in hymnal with the custom songs from Supabase applied on top: a custom song with the
 * same id or hymn number replaces the built-in entry, others are added. Sorted by number, then title.
 */
export function mergeSongLibrary(customSongs: Song[] = []): Song[] {
  const list: Song[] = [...BIBLE_SONG_COLLECTION];
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
