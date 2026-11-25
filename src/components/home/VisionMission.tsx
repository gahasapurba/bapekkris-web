import type { AppItem } from '../../lib/supabase';
import { Container, Section } from './shared';

export function VisionMission({ activeTenure }: { activeTenure?: AppItem | null }) {
  const missions: string[] = Array.isArray(activeTenure?.misi) ? activeTenure.misi : [];
  const period = activeTenure?.code ? ` ${activeTenure.code}` : '';
  return (
    <Section tone="subtle" labelledBy="vision-title">
      <Container className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-16">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-gold-ink">Visi{period}</p>
          <h2 id="vision-title" className="sr-only">Visi dan misi Bapekkris Bank Mandiri{period}</h2>
          {activeTenure?.visi ? (
            <blockquote className="mt-5 border-l-2 border-gold pl-6 font-display text-[clamp(1.35rem,2.6vw,1.85rem)] font-medium italic leading-snug text-ink">
              “{activeTenure.visi}”
            </blockquote>
          ) : (
            <p className="mt-5 text-muted">Visi belum ditetapkan untuk periode ini.</p>
          )}
        </div>
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-gold-ink">Misi{period}</p>
          {missions.length > 0 ? (
            <ol className="mt-5 flex list-none flex-col divide-y divide-line">
              {missions.map((m, i) => (
                <li key={i} className="flex gap-5 py-4 first:pt-0">
                  <span className="font-display text-[1.35rem] font-semibold leading-none text-gold-ink" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[1rem] leading-relaxed text-ink">{m}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-muted">Misi belum ditetapkan untuk periode ini.</p>
          )}
        </div>
      </Container>
    </Section>
  );
}
