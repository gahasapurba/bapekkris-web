import { describe, expect, it } from 'vitest';
import { BIBLE_BOOKS } from '../data/bibleBooks';
import { READING_PLANS, buildSchedule, currentPlanDay, formatReading, getPlan } from './readingPlans';

describe('reading plans', () => {
  it('cover every chapter of their books exactly once, in order, without empty days', () => {
    for (const plan of READING_PLANS) {
      const schedule = buildSchedule(plan);
      const flat = schedule.flat();
      const expected = plan.bookIds.reduce((n, id) => n + (BIBLE_BOOKS.find((b) => b.id === id)?.chapters || 0), 0);
      expect(schedule).toHaveLength(plan.days);
      expect(flat).toHaveLength(expected);
      expect(new Set(flat.map((c) => `${c.bookId}:${c.chapter}`)).size).toBe(expected);
      expect(schedule.every((day) => day.length > 0)).toBe(true);
    }
    expect(buildSchedule(getPlan('alkitab-365')!).flat()).toHaveLength(1189);
  });

  it('labels consecutive chapters as ranges', () => {
    expect(formatReading([{ bookId: 'GEN', chapter: 1 }, { bookId: 'GEN', chapter: 2 }, { bookId: 'GEN', chapter: 3 }])).toBe('Kejadian 1–3');
    expect(formatReading([{ bookId: 'MAL', chapter: 4 }, { bookId: 'MAT', chapter: 1 }])).toBe('Maleakhi 4, Matius 1');
  });

  it('counts plan days in WIB calendar days, capped to the plan', () => {
    const plan = getPlan('injil-30')!;
    expect(currentPlanDay(plan, '2026-11-01', '2026-11-01')).toBe(1);
    expect(currentPlanDay(plan, '2026-11-01', '2026-11-26')).toBe(26);
    expect(currentPlanDay(plan, '2026-11-01', '2027-01-01')).toBe(30);
    expect(currentPlanDay(plan, '2026-11-26', '2026-11-01')).toBe(1);
  });
});
