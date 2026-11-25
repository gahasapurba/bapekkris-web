import { describe, expect, it } from 'vitest';
import { buildTabUrl, parseLocationRoute } from './appNavigation';

const route = (url: string) => {
  const u = new URL(url, 'https://example.test');
  return parseLocationRoute({ pathname: u.pathname, search: u.search, hash: u.hash });
};

describe('parseLocationRoute', () => {
  it('reads shared links', () => {
    expect(route('/?event=E1#event')).toEqual({ tab: 'event', formId: null, eventId: 'E1', galleryId: null });
    expect(route('/?form=F1#form')).toEqual({ tab: 'form', formId: 'F1', eventId: null, galleryId: null });
    expect(route('/?gallery=G1#galeri')).toEqual({ tab: 'galeri', formId: null, eventId: null, galleryId: 'G1' });
    expect(route('/?stats=E1#event-stats').tab).toBe('event-stats');
  });

  it('accepts legacy forms of the links', () => {
    expect(route('/?galeri=G9#galeri').galleryId).toBe('G9');
    expect(route('/#program').tab).toBe('event');
    expect(route('/#oprec').tab).toBe('form');
    expect(route('/#form?form=F2').formId).toBe('F2');
  });

  it('routes the admin portal and unknown pages', () => {
    expect(route('/admin/').tab).toBe('admin');
    expect(route('/#admin').tab).toBe('admin');
    expect(route('/#does-not-exist').tab).toBe('home');
  });
});

describe('buildTabUrl', () => {
  it('builds absolute links that drop any stale query', () => {
    expect(buildTabUrl({ tab: 'home' }, '/')).toBe('/#home');
    expect(buildTabUrl({ tab: 'program' }, '/')).toBe('/#event');
    expect(buildTabUrl({ tab: 'form', formId: 'a b' }, '/')).toBe('/?form=a%20b#form');
    expect(buildTabUrl({ tab: 'admin' }, '/admin')).toBe('/admin');
  });

  it('round-trips through parseLocationRoute', () => {
    for (const target of [{ tab: 'event', eventId: 'E1' }, { tab: 'galeri', galleryId: 'G1' }, { tab: 'organisasi' }]) {
      const parsed = route(buildTabUrl(target, '/'));
      expect(parsed.tab).toBe(target.tab);
    }
  });
});
