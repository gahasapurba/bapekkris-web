import type { AppItem } from '../../lib/supabase';
import { Container, Section, SectionHeading, initials } from './shared';

interface LeadershipSectionProps {
  leaders: AppItem[];
  periodLabel: string;
  showOrganisation: boolean;
  go: (tab: string) => void;
}

export function LeadershipSection({ leaders, periodLabel, showOrganisation, go }: LeadershipSectionProps) {
  return (
    <Section labelledBy="leaders-title">
      <Container>
        <SectionHeading
          id="leaders-title"
          eyebrow="Pimpinan & Pengurus Inti"
          title={`Melayani bersama periode ${periodLabel}`}
          action={showOrganisation ? { label: 'Lihat organigram lengkap', onClick: () => go('organisasi') } : undefined}
        />
        {leaders.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-muted">
            Belum ada pimpinan atau pengurus terdaftar pada periode kepengurusan ini.
          </p>
        ) : (
          <ul className="grid list-none grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {leaders.map((person) => {
              const content = (
                <>
                  <span className="relative mx-auto flex aspect-square w-full max-w-[150px] items-center justify-center overflow-hidden rounded-full border border-line bg-subtle font-display text-[1.9rem] font-semibold text-muted">
                    <span aria-hidden="true">{initials(person.name)}</span>
                    {person.image && (
                      <img src={person.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}
                  </span>
                  <span className="mt-4 block text-[0.74rem] font-semibold uppercase tracking-[0.12em] text-gold-ink">{person.role}</span>
                  <span className="mt-1 block font-display text-[1.08rem] font-semibold leading-snug text-ink">{person.name}</span>
                </>
              );
              return (
                <li key={person.id} className="text-center">
                  {showOrganisation ? (
                    <button type="button" onClick={() => go('organisasi')} className="group w-full cursor-pointer border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-ink">
                      {content}
                    </button>
                  ) : content}
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </Section>
  );
}
