// Builds the stored shape of devotions and songs from form values (create form and edit dialog).
import type { AppItem } from '../lib/supabase';
import { DEFAULT_DEVOTION_AUTHOR, DEFAULT_SONG_KEY } from '../data/contentOptions';

const clean = (value: unknown) => String(value ?? '').trim();

export type DevotionValues = {
  devotionDate: string;
  title: string;
  theme: string;
  scriptureRef: string;
  scriptureText: string;
  body: string;
  prayer: string;
  author: string;
};

export type SongValues = {
  title: string;
  songNumber: string;
  category: string;
  keySignature: string;
  author: string;
  youtubeUrl: string;
  lyrics: string;
};

/** Form values or an edited item; only the devotion fields are read. */
type ValuesOf<T> = { [K in keyof T]?: unknown } & Record<string, unknown>;

export function toDevotionItem(base: AppItem, values: ValuesOf<DevotionValues>): AppItem {
  return {
    ...base,
    devotionDate: clean(values.devotionDate),
    title: clean(values.title),
    theme: clean(values.theme),
    scriptureRef: clean(values.scriptureRef),
    scriptureText: clean(values.scriptureText),
    body: clean(values.body),
    prayer: clean(values.prayer),
    author: clean(values.author) || DEFAULT_DEVOTION_AUTHOR
  };
}

export function toSongItem(base: AppItem, values: ValuesOf<SongValues>): AppItem {
  return {
    ...base,
    title: clean(values.title),
    songNumber: clean(values.songNumber),
    category: clean(values.category),
    keySignature: clean(values.keySignature) || DEFAULT_SONG_KEY,
    author: clean(values.author),
    youtubeUrl: clean(values.youtubeUrl),
    lyrics: clean(values.lyrics)
  };
}
