import type { AppItem } from '../../lib/supabase';
import { getDivisionLead, getDivisionStructure } from '../../utils/memberQuotaUtils';
import { Badge, Card } from '../../ui';
import { Container, Section, SectionHeading } from './shared';

interface DivisionsSectionProps {
  divisions: AppItem[];
  members: AppItem[];
  tenureRoles: AppItem[];
  showOrganisation: boolean;
  go: (tab: string) => void;
}

function leaderLine(div: AppItem, members: AppItem[], tenureRoles: AppItem[]): string {
  const { leaders } = getDivisionStructure(div, members, tenureRoles);
  if (leaders.length > 0) return leaders.map((l) => `${l.role ? `${l.role}: ` : ''}${l.name}`).join(' · ');
  const lead = getDivisionLead(div, members, tenureRoles);
  return lead.name ? `${lead.roleName ? `${lead.roleName}: ` : ''}${lead.name}` : '';
}

export function DivisionsSection({ divisions, members, tenureRoles, showOrganisation, go }: DivisionsSectionProps) {
  return (
    <Section labelledBy="divisions-title">
      <Container>
        <SectionHeading
          id="divisions-title"
          eyebrow="Divisi Pelayanan"
          title="Ruang lingkup pelayanan Bapekkris"
          description="Pelayanan kerohanian Kristen yang dikawal para koordinator dan pelayan yang berdedikasi."
          action={showOrganisation && divisions.length > 0 ? { label: 'Lihat semua pengurus', onClick: () => go('organisasi') } : undefined}
        />
        {divisions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-muted">
            Belum ada divisi terdaftar pada periode kepengurusan ini.
          </p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {divisions.map((div, i) => {
              const leader = leaderLine(div, members, tenureRoles);
              const focus: string[] = Array.isArray(div.focusAreas) ? div.focusAreas : [];
              return (
                <Card key={div.id} className="relative flex flex-col gap-4 overflow-hidden pl-8">
                  <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: div.color || 'var(--mandiri-blue)' }} aria-hidden="true" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-dim">Divisi {String(i + 1).padStart(2, '0')}</span>
                    {div.isRecruiting && <Badge tone="success">Membuka anggota baru</Badge>}
                  </div>
                  <div>
                    <h3 className="font-display text-[1.45rem] font-semibold leading-tight text-ink">{div.name}</h3>
                    {leader && <p className="mt-1 text-[0.86rem] font-semibold text-muted">{leader}</p>}
                  </div>
                  {div.motto && <p className="font-display italic text-ink">“{div.motto}”</p>}
                  {div.description && <p className="flex-1 text-[0.93rem] leading-relaxed text-muted">{div.description}</p>}
                  {focus.length > 0 && (
                    <ul className="flex list-none flex-wrap gap-2 border-t border-line pt-4" aria-label="Fokus pelayanan">
                      {focus.map((f, idx) => <li key={idx}><Badge>{f}</Badge></li>)}
                    </ul>
                  )}
                  {showOrganisation && (
                    <button type="button" onClick={() => go('organisasi')} className="absolute inset-0 cursor-pointer border-0 bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink" aria-label={`Lihat pengurus divisi ${div.name}`} />
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </Section>
  );
}
