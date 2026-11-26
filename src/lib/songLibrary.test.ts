import { describe, expect, it } from 'vitest';
import { BIBLE_SONG_COLLECTION } from '../data/hymnalLibrary';
import { mergeSongLibrary } from './songLibrary';

describe('mergeSongLibrary', () => {
  it('returns the built-in hymnal when there are no custom songs', () => {
    expect(mergeSongLibrary()).toHaveLength(BIBLE_SONG_COLLECTION.length);
  });

  it('replaces a hymn that has the same number (case-insensitive)', () => {
    const merged = mergeSongLibrary([{ id: 'custom-1', songNumber: 'kj 001', title: 'Versi gereja', lyrics: 'Bait baru' }]);
    expect(merged).toHaveLength(BIBLE_SONG_COLLECTION.length);
    const hymn = merged.find((s) => s.lyrics === 'Bait baru');
    expect(hymn).toMatchObject({ title: 'Versi gereja', category: 'Kidung Jemaat' });
  });

  it('adds new songs and keeps the list sorted', () => {
    const merged = mergeSongLibrary([{ id: 'custom-2', title: 'Zaman Baru', category: 'Praise & Worship' }]);
    expect(merged).toHaveLength(BIBLE_SONG_COLLECTION.length + 1);
    const keys = merged.map((s) => s.songNumber || s.title);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });
});
