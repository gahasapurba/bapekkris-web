import { describe, expect, it } from 'vitest';
import { matchBibleBooks, songNumberKey, rankSongs } from './searchUtils';

describe('matchBibleBooks', () => {
  it('matches Indonesian names, abbreviations and English names with a chapter', () => {
    expect(matchBibleBooks('yoh 3')[0]).toMatchObject({ book: { id: 'JHN' }, chapter: 3 });
    expect(matchBibleBooks('Yohanes 3:16')[0]).toMatchObject({ book: { id: 'JHN' }, chapter: 3 });
    expect(matchBibleBooks('genesis 1')[0]).toMatchObject({ book: { id: 'GEN' }, chapter: 1 });
    expect(matchBibleBooks('mazmur')[0]).toMatchObject({ book: { name: 'Mazmur' }, chapter: 1 });
  });
  it('handles numbered books and clamps the chapter', () => {
    const kor = matchBibleBooks('1 kor 13')[0];
    expect(kor.book.name).toBe('1 Korintus');
    expect(kor.chapter).toBe(13);
    expect(matchBibleBooks('yudas 9')[0].chapter).toBe(1);
  });
  it('ignores queries that are not book names', () => {
    expect(matchBibleBooks('a')).toEqual([]);
    expect(matchBibleBooks('zzz 1')).toEqual([]);
  });
});

describe('songNumberKey', () => {
  it('treats padded and spaced hymn numbers as equal', () => {
    expect(songNumberKey('KJ 001')).toBe(songNumberKey('kj 1'));
    expect(songNumberKey('PKJ 012')).toBe(songNumberKey('pkj12'));
    expect(songNumberKey('KJ 10')).not.toBe(songNumberKey('KJ 1'));
  });
});

describe('rankSongs', () => {
  const songs = [
    { title: 'KJ 100 - Muliakanlah', songNumber: 'KJ 100', lyrics: 'Muliakanlah Tuhan Allah' },
    { title: 'KJ 010 - Pujilah Tuhan', songNumber: 'KJ 010', lyrics: '' },
    { title: 'KJ 001 - Haleluya, Pujilah', songNumber: 'KJ 001', lyrics: 'Langit buana' },
    { title: 'Pujilah Tuhan', songNumber: '', lyrics: 'kj 1 disebut di lirik' }
  ];
  it('puts the exact hymn number first ("KJ 1" = "KJ 001")', () => {
    expect(rankSongs(songs, 'KJ 1')[0].songNumber).toBe('KJ 001');
    expect(rankSongs(songs, 'kj001')[0].songNumber).toBe('KJ 001');
  });
  it('ranks title matches above lyric matches and drops non-matches', () => {
    expect(rankSongs(songs, 'pujilah').map((s) => s.title)).toEqual(['Pujilah Tuhan', 'KJ 010 - Pujilah Tuhan', 'KJ 001 - Haleluya, Pujilah']);
    expect(rankSongs(songs, 'tidak ada')).toEqual([]);
  });
});
