// Pure helpers for site search (unit-tested in searchUtils.test.ts).

import { BIBLE_BOOKS } from '../data/bibleBooks';

export type Song = { id: string; title: string; songNumber?: string; category?: string; lyrics?: string };

// "KJ 1", "kj001" and "KJ 001" all mean the same hymn number.
export const songNumberKey = (v: unknown) => String(v || '').toLowerCase().replace(/\s+/g, '').replace(/(\D)0+(\d)/g, '$1$2');
export const fold = (v: unknown) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Parses "yoh 3", "Yohanes 3:16", "1 kor 13", "genesis 1" into matching books and a chapter. */
export function matchBibleBooks(query: string) {
  const m = fold(query).trim().match(/^((?:[1-3]\s*)?[a-z]+(?:\s+[a-z]+)?)\s*(\d+)?/);
  if (!m) return [];
  const name = m[1].replace(/\s+/g, '');
  if (name.length < 2) return [];
  const chapter = m[2] ? Number(m[2]) : 1;
  return BIBLE_BOOKS
    .filter((b) => [b.name, b.abbr, b.en].some((n) => fold(n).replace(/\s+/g, '').startsWith(name)))
    .slice(0, 4)
    .map((b) => ({ book: b, chapter: Math.min(Math.max(1, chapter), b.chapters) }));
}

