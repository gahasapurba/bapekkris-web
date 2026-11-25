import { Check, CheckCircle2, Copy, Download, MessageCircle } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { formatWibEventRange } from '../../utils/dateUtils';
import { findMatchingRole } from '../../utils/memberQuotaUtils';
import { Badge, Button, ButtonLink, Dialog } from '../../ui';
import { formatWaNumber } from './useOrganization';

interface MemberDialogProps {
  member: AppItem;
  roleName: string;
  state: Record<string, any>;
}

export function MemberDialog({ member, roleName, state }: MemberDialogProps) {
  const { activeTenure, copiedPhone, currentTenureRoles, divisions, events, handleCloseModal, handleCopyPhone, handleDownloadVCard, isEventPageVisible, onNavigateProgram, setSelectedMember, subDivisions } = state;
  const division = divisions.find((d: AppItem) => d.id === member.divisionId);
  const subDivision = subDivisions.find((sd: AppItem) => sd.id === member.subDivisionId);
  const role = findMatchingRole(member, currentTenureRoles);
  const inDivisionRole = role ? Boolean(role.requiresDivision) : (member.category === 'pimpro' || member.category === 'anggota');
  const relatedEvents: AppItem[] = isEventPageVisible && inDivisionRole && member.divisionId
    ? events.filter((e: AppItem) => e.isPublic === true && (!activeTenure?.id || e.tenureId === activeTenure.id)
      && (e.divisionId === member.divisionId || (member.division && (e.division === member.division || e.divisionName === member.division)))).slice(0, 5)
    : [];
  const responsibilities: string[] = Array.isArray(member.responsibilities) ? member.responsibilities : [];

  return (
    <Dialog open onClose={handleCloseModal} title={member.name} description={[roleName, division?.name, subDivision?.name].filter(Boolean).join(' · ')}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-5">
          <span className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-subtle font-display text-[1.8rem] font-semibold text-muted">
            <span aria-hidden="true">{String(member.name || '?').trim().split(/\s+/).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}</span>
            {member.image && <img src={member.image} alt="" className="absolute inset-0 size-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
          </span>
          <div className="flex flex-col gap-2">
            <Badge tone="gold" className="self-start">{roleName || 'Pelayan'}</Badge>
            {member.title && member.title !== member.role && <p className="text-[0.9rem] font-semibold text-info">{member.title}</p>}
            <div className="flex flex-wrap gap-2">
              {member.whatsapp && <ButtonLink size="sm" href={`https://wa.me/${formatWaNumber(member.whatsapp)}`} target="_blank" rel="noopener noreferrer" icon={<MessageCircle size={14} aria-hidden="true" />}>WhatsApp</ButtonLink>}
              <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={() => handleDownloadVCard(member)}>Simpan kontak</Button>
              {member.whatsapp && <Button size="sm" variant="secondary" icon={copiedPhone ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} onClick={() => handleCopyPhone(member.whatsapp)}>{copiedPhone ? 'Tersalin' : 'Salin nomor'}</Button>}
            </div>
          </div>
        </div>
        {member.motto && <blockquote className="border-l-2 border-gold pl-4 font-display text-[1.1rem] italic text-ink">“{member.motto}”</blockquote>}
        {responsibilities.length > 0 && (
          <section aria-label="Tanggung jawab">
            <p className="mb-2 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-dim">Tanggung jawab</p>
            <ul className="flex list-none flex-col gap-2">
              {responsibilities.map((r, i) => <li key={i} className="flex gap-2.5 text-[0.95rem] text-ink"><CheckCircle2 size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-success" />{r}</li>)}
            </ul>
          </section>
        )}
        {relatedEvents.length > 0 && (
          <section aria-label="Agenda divisi" className="border-t border-line pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-dim">Agenda {division?.name || member.division || 'divisi'}</p>
              {onNavigateProgram && <button type="button" onClick={() => { setSelectedMember(null); onNavigateProgram(); }} className="cursor-pointer border-0 bg-transparent p-0 text-[0.84rem] font-semibold text-navy-ink hover:underline">Lihat kalender →</button>}
            </div>
            <ul className="flex list-none flex-col divide-y divide-line rounded-md border border-line">
              {relatedEvents.map((ev) => (
                <li key={ev.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-[0.9rem]">
                  <span className="font-semibold text-ink">{ev.title}</span>
                  <span className="shrink-0 text-[0.8rem] text-dim">{formatWibEventRange(ev.startDate, ev.endDate, ev.date)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Dialog>
  );
}
