import { ChevronRight, Lock } from 'lucide-react';
import { formatDeadlineWib, getDeadlineStatus } from '../../../utils/dateUtils';
import { getUnifiedFormQuota } from '../../../utils/quotaUtils';
import { Badge, Card, cn } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function FormPicker() {
  const { activeForms, events, onSelectFormUrl, registrationCounts, selectedFormId, setErrors, setFileData, setFormData, setIsSubmitted, setSelectedFormId } = useDynamicFormContext();
  const choose = (id: string) => {
    setSelectedFormId(id);
    onSelectFormUrl?.(id);
    setFormData({}); setFileData({}); setErrors({}); setIsSubmitted(false);
  };
  return (
    <section aria-label="Pilih formulir" className="mx-auto w-full max-w-[1000px]">
      <h2 className="mb-4 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-dim">Pilih formulir yang ingin diisi</h2>
      <ul className="grid list-none gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeForms.map((f) => {
          const selected = f.id === selectedFormId;
          const quota = getUnifiedFormQuota(f, events, registrationCounts);
          const deadline = getDeadlineStatus(f.deadline);
          return (
            <li key={f.id}>
              <Card interactive padding="sm" className={cn('relative flex h-full flex-col gap-3', selected && 'border-navy-ink ring-1 ring-[var(--navy-line)]')}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="navy">{f.category || 'Formulir'}</Badge>
                  {quota.isLimited && quota.maxQuota > 0 && (
                    <Badge tone={quota.isFull ? 'danger' : 'info'}>
                      {quota.isFull ? <><Lock size={11} aria-hidden="true" />Penuh</> : `${quota.isConnected ? 'Acara' : 'Kuota'} ${quota.count}/${quota.maxQuota}`}
                    </Badge>
                  )}
                  {deadline.isExpired ? <Badge tone="danger">Ditutup</Badge> : deadline.isToday && <Badge tone="gold">Hari terakhir</Badge>}
                </div>
                <h3 className="font-display text-[1.15rem] font-semibold leading-snug text-ink">
                  <button type="button" onClick={() => choose(f.id)} aria-current={selected ? 'true' : undefined}
                    className="cursor-pointer border-0 bg-transparent p-0 text-left [font:inherit] [color:inherit] after:absolute after:inset-0 focus-visible:outline-none [&:focus-visible]:after:outline-2 [&:focus-visible]:after:outline-navy-ink">
                    {f.title}
                  </button>
                </h3>
                {f.subtitle && <p className="flex-1 text-[0.9rem] leading-relaxed text-muted">{f.subtitle}</p>}
                <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-[0.84rem]">
                  <span className="text-dim">{!deadline.isExpired && !deadline.isToday && f.deadline ? `Batas ${formatDeadlineWib(f.deadline)}` : ''}</span>
                  <span className={cn('inline-flex items-center gap-1 font-semibold', selected ? 'text-gold-ink' : 'text-navy-ink')}>
                    {selected ? 'Sedang dibuka' : 'Buka'}<ChevronRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
