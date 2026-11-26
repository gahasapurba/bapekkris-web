import { describe, expect, it } from 'vitest';
import { buildPageMeta, toSchemaDate, SITE_NAME } from './seo';

describe('toSchemaDate', () => {
  it('adds the WIB offset to wall-clock times and keeps date-only values', () => {
    expect(toSchemaDate('2026-12-20T09:00')).toBe('2026-12-20T09:00:00+07:00');
    expect(toSchemaDate('2026-12-20 09:00:30')).toBe('2026-12-20T09:00:30+07:00');
    expect(toSchemaDate('2026-12-20')).toBe('2026-12-20');
    expect(toSchemaDate('Menyesuaikan')).toBeUndefined();
  });
});

describe('buildPageMeta', () => {
  it('gives every public tab its own title and indexes it', () => {
    const meta = buildPageMeta('renungan');
    expect(meta.title).toBe(`Renungan Harian — ${SITE_NAME}`);
    expect(meta.noindex).toBe(false);
    expect(meta.path).toBe('/#renungan');
  });

  it('keeps admin, stats and projector out of search results', () => {
    for (const tab of ['admin', 'event-stats', 'projector']) {
      expect(buildPageMeta(tab).noindex).toBe(true);
    }
  });

  it('describes a shared event with Event structured data', () => {
    const meta = buildPageMeta('event', {
      event: { id: 'E1', title: 'Ibadah Natal', description: 'Ibadah bersama', startDate: '2026-12-20T09:00', endDate: '2026-12-20T12:00', location: 'Plaza Mandiri' }
    });
    expect(meta.title).toBe(`Ibadah Natal — ${SITE_NAME}`);
    expect(meta.path).toBe('/?event=E1');
    expect(meta.jsonLd).toMatchObject({ '@type': 'Event', name: 'Ibadah Natal', startDate: '2026-12-20T09:00:00+07:00' });
  });

  it('lists upcoming events on the event page and truncates long descriptions', () => {
    const meta = buildPageMeta('event', { events: [{ id: 'A', title: 'A', startDate: '2026-12-01' }] });
    expect(meta.jsonLd).toMatchObject({ '@type': 'ItemList' });
    const long = buildPageMeta('form', { form: { id: 'F', title: 'Form', description: 'x'.repeat(400) } });
    expect(long.description.length).toBeLessThanOrEqual(160);
  });
});
