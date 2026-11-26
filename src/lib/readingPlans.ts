// Bible reading plans: chapters of a set of books spread evenly over a number of days. Progress is
// kept per device (visitors have no account), keyed by plan.

import { BIBLE_BOOKS, type BibleBook } from '../data/bibleBooks';
import { toWibIsoDate } from '../utils/dateUtils';

export interface ReadingPlanDef {
  id: string;
  title: string;
  description: string;
  days: number;
  bookIds: string[];
}

export interface ChapterRef { bookId: string; chapter: number }

const GOSPELS = ['MAT', 'MRK', 'LUK', 'JHN'];
const ids = (filter: (b: BibleBook) => boolean) => BIBLE_BOOKS.filter(filter).map((b) => b.id);

export const READING_PLANS: ReadingPlanDef[] = [
  { id: 'injil-30', title: 'Injil dalam 30 hari', description: 'Matius, Markus, Lukas, dan Yohanes, sekitar 3 pasal sehari.', days: 30, bookIds: GOSPELS },
  { id: 'mazmur-amsal-31', title: 'Mazmur & Amsal dalam sebulan', description: '150 Mazmur dan 31 pasal Amsal, sekitar 6 pasal sehari.', days: 31, bookIds: ['PSA', 'PRO'] },
  { id: 'pb-90', title: 'Perjanjian Baru dalam 90 hari', description: 'Seluruh 27 kitab Perjanjian Baru, sekitar 3 pasal sehari.', days: 90, bookIds: ids((b) => b.testament === 'PB') },
  { id: 'alkitab-365', title: 'Alkitab dalam setahun', description: 'Kejadian sampai Wahyu, 3–4 pasal sehari.', days: 365, bookIds: ids(() => true) }
];

export function getPlan(planId: string): ReadingPlanDef | undefined {
  return READING_PLANS.find((p) => p.id === planId);
}

function planChapters(plan: ReadingPlanDef): ChapterRef[] {
  return plan.bookIds.flatMap((bookId) => {
    const book = BIBLE_BOOKS.find((b) => b.id === bookId);
    return book ? Array.from({ length: book.chapters }, (_, i) => ({ bookId, chapter: i + 1 })) : [];
  });
}

/** Chapters to read on each day (index 0 = day 1); every chapter appears exactly once, in order. */
export function buildSchedule(plan: ReadingPlanDef): ChapterRef[][] {
  const chapters = planChapters(plan);
  return Array.from({ length: plan.days }, (_, day) =>
    chapters.slice(Math.floor((day * chapters.length) / plan.days), Math.floor(((day + 1) * chapters.length) / plan.days)));
}

/** "Kejadian 1–3, Matius 1" style label for a day's chapters. */
export function formatReading(chapters: ChapterRef[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < chapters.length) {
    const { bookId, chapter } = chapters[i];
    let end = chapter;
    while (i + 1 < chapters.length && chapters[i + 1].bookId === bookId && chapters[i + 1].chapter === end + 1) { i++; end++; }
    const name = BIBLE_BOOKS.find((b) => b.id === bookId)?.name || bookId;
    parts.push(end > chapter ? `${name} ${chapter}–${end}` : `${name} ${chapter}`);
    i++;
  }
  return parts.join(', ');
}

/** Day number (1-based, capped to the plan length) of a plan started on startDate, in WIB. */
export function currentPlanDay(plan: ReadingPlanDef, startDate: string, today: string = toWibIsoDate()): number {
  const elapsed = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000);
  return Math.min(Math.max(elapsed + 1, 1), plan.days);
}

export interface PlanProgress { planId: string; startDate: string; done: number[] }

const STORAGE_KEY = 'bapekkris_reading_plan';

export function loadProgress(): PlanProgress | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return saved && getPlan(saved.planId) && Array.isArray(saved.done) ? saved : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress: PlanProgress | null) {
  try {
    if (progress) localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* storage unavailable: progress lasts for this visit only */ }
}
