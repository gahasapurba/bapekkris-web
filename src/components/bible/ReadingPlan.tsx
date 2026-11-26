import { useMemo, useState } from 'react';
import { CalendarCheck, Check, ChevronLeft, ChevronRight, ListChecks, X } from 'lucide-react';
import { Badge, Button, Card, cn } from '../../ui';
import {
  READING_PLANS, buildSchedule, currentPlanDay, formatReading, getPlan, loadProgress, saveProgress, type PlanProgress
} from '../../lib/readingPlans';
import { BIBLE_BOOKS } from '../../data/bibleBooks';
import { toWibIsoDate } from '../../utils/dateUtils';

interface ReadingPlanProps {
  /** Opens a chapter in the reader below. */
  onOpenChapter: (bookId: string, chapter: number) => void;
}

/** Reading-plan panel of the Bible page; progress is stored on this device. */
export default function ReadingPlan({ onOpenChapter }: ReadingPlanProps) {
  const [progress, setProgressState] = useState<PlanProgress | null>(loadProgress);
  const [choosing, setChoosing] = useState(false);
  const plan = progress ? getPlan(progress.planId) : undefined;
  const schedule = useMemo(() => (plan ? buildSchedule(plan) : []), [plan]);
  const today = plan && progress ? currentPlanDay(plan, progress.startDate) : 1;
  const [viewDay, setViewDay] = useState<number | null>(null);
  const day = viewDay ?? today;

  const setProgress = (next: PlanProgress | null) => { saveProgress(next); setProgressState(next); setViewDay(null); };
  const start = (planId: string) => { setProgress({ planId, startDate: toWibIsoDate(), done: [] }); setChoosing(false); };
  const toggleDone = (d: number) => {
    if (!progress) return;
    const done = progress.done.includes(d) ? progress.done.filter((x) => x !== d) : [...progress.done, d].sort((a, b) => a - b);
    setProgress({ ...progress, done });
    setViewDay(d);
  };

  if (!plan || !progress || choosing) {
    return (
      <Card padding="md" className="mb-8">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-[1.25rem] font-semibold text-ink"><ListChecks size={20} aria-hidden="true" className="text-gold-ink" />Rencana baca Alkitab</h2>
            <p className="mt-1 text-[0.9rem] text-muted">Pilih rencana untuk membaca teratur setiap hari. Progres tersimpan di perangkat ini.</p>
          </div>
          {choosing && <Button size="sm" variant="ghost" icon={<X size={14} aria-hidden="true" />} onClick={() => setChoosing(false)}>Batal</Button>}
        </div>
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
          {READING_PLANS.map((p) => (
            <li key={p.id} className="flex flex-col justify-between gap-3 rounded-lg border border-line bg-page p-4">
              <div>
                <p className="font-semibold text-ink">{p.title}</p>
                <p className="mt-1 text-[0.84rem] text-muted">{p.description}</p>
              </div>
              <Button size="sm" variant={p.id === progress?.planId ? 'secondary' : 'primary'} onClick={() => start(p.id)}>
                {p.id === progress?.planId ? 'Mulai ulang' : 'Mulai rencana'}
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  const reading = schedule[day - 1] || [];
  const isDone = progress.done.includes(day);
  const percent = Math.round((progress.done.length / plan.days) * 100);
  const bookName = (id: string) => BIBLE_BOOKS.find((b) => b.id === id)?.name || id;

  return (
    <Card padding="md" className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-gold-ink">Rencana baca</p>
          <h2 className="font-display text-[1.25rem] font-semibold text-ink">{plan.title}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setChoosing(true)}>Ganti rencana</Button>
          <Button size="sm" variant="ghost" onClick={() => setProgress(null)}>Hentikan</Button>
        </div>
      </div>

      <div className="mt-4" aria-label={`Progres ${progress.done.length} dari ${plan.days} hari`}>
        <div className="flex justify-between text-[0.8rem] text-muted"><span>{progress.done.length} dari {plan.days} hari selesai</span><span>{percent}%</span></div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuemin={0} aria-valuemax={plan.days} aria-valuenow={progress.done.length} aria-label="Progres rencana baca">
          <div className="h-full rounded-full bg-gold" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-lg border border-line bg-page p-4">
        <div className="flex items-center justify-between gap-2">
          <button type="button" aria-label="Hari sebelumnya" disabled={day <= 1} onClick={() => setViewDay(day - 1)}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} aria-hidden="true" /></button>
          <p className="text-center">
            <span className="block font-semibold text-ink" aria-live="polite">Hari ke-{day}{day === today && ' · hari ini'}</span>
            <span className="text-[0.86rem] text-muted">{formatReading(reading)}</span>
          </p>
          <button type="button" aria-label="Hari berikutnya" disabled={day >= plan.days} onClick={() => setViewDay(day + 1)}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} aria-hidden="true" /></button>
        </div>
        <div role="group" aria-label="Pasal bacaan" className="flex flex-wrap justify-center gap-1.5">
          {reading.map((c) => (
            <button key={`${c.bookId}-${c.chapter}`} type="button" onClick={() => onOpenChapter(c.bookId, c.chapter)}
              className="h-8 cursor-pointer rounded-full border border-line bg-surface px-3 text-[0.8rem] font-semibold text-ink hover:border-line-strong focus-visible:outline-2 focus-visible:outline-navy-ink">
              {bookName(c.bookId)} {c.chapter}
            </button>
          ))}
        </div>
        <div className="flex justify-center">
          <Button size="sm" variant={isDone ? 'secondary' : 'gold'} icon={isDone ? <Check size={14} aria-hidden="true" /> : <CalendarCheck size={14} aria-hidden="true" />} onClick={() => toggleDone(day)}>
            {isDone ? 'Sudah dibaca (batalkan)' : 'Tandai selesai dibaca'}
          </Button>
        </div>
        {progress.done.length === plan.days && <p className="text-center"><Badge tone="success">Rencana selesai. Puji Tuhan!</Badge></p>}
      </div>
      <p className={cn('mt-3 text-[0.78rem] text-dim')}>Dimulai {progress.startDate.split('-').reverse().join('/')} · menghapus data browser juga menghapus progres.</p>
    </Card>
  );
}
