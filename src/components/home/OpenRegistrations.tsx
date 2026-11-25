import { ArrowRight, CalendarClock } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { formatDeadlineWib, getDeadlineStatus } from '../../utils/dateUtils';
import { Badge, Button, Card } from '../../ui';
import { Container, Section, SectionHeading } from './shared';

function Deadline({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const status = getDeadlineStatus(deadline);
  return status.isToday
    ? <Badge tone="danger">Hari terakhir pendaftaran</Badge>
    : <span className="inline-flex items-center gap-1.5 text-[0.84rem] text-muted"><CalendarClock size={15} aria-hidden="true" />Batas: {formatDeadlineWib(deadline)}</span>;
}

export function OpenRegistrations({ forms, go }: { forms: AppItem[]; go: (tab: string, formId?: string | null) => void }) {
  if (forms.length === 0) return null;
  const single = forms.length === 1 ? forms[0] : null;
  return (
    <Section tone="subtle" labelledBy="registrations-title">
      <Container>
        <SectionHeading
          id="registrations-title"
          eyebrow="Pendaftaran Dibuka"
          title={single ? 'Mari ambil bagian' : `${forms.length} pendaftaran sedang dibuka`}
          action={single ? undefined : { label: 'Buka semua formulir', onClick: () => go('form') }}
        />
        {single ? (
          <Card padding="lg" className="flex flex-col gap-6 border-gold-line md:flex-row md:items-center md:justify-between">
            <div className="flex max-w-[62ch] flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge tone="gold">{single.category || 'Pendaftaran'}</Badge>
                <Deadline deadline={single.deadline} />
              </div>
              <h3 className="font-display text-[1.7rem] font-semibold leading-tight text-ink">{single.title}</h3>
              {(single.subtitle || single.description) && <p className="leading-relaxed text-muted">{single.subtitle || single.description}</p>}
            </div>
            <Button variant="gold" size="lg" onClick={() => go('form', single.id)} iconRight={<ArrowRight size={18} aria-hidden="true" />}>Daftar sekarang</Button>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((f) => (
              <Card key={f.id} className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="gold">{f.category || 'Formulir'}</Badge>
                  <Deadline deadline={f.deadline} />
                </div>
                <h3 className="font-display text-[1.3rem] font-semibold leading-snug text-ink">{f.title}</h3>
                {(f.subtitle || f.description) && <p className="flex-1 text-[0.92rem] leading-relaxed text-muted">{f.subtitle || f.description}</p>}
                <Button variant="secondary" onClick={() => go('form', f.id)} iconRight={<ArrowRight size={16} aria-hidden="true" />} className="self-start">Isi formulir</Button>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
