import type { AppItem, RegistrationCounts } from '../../lib/supabase';
import { soundFx } from '../../utils/audio';
import { getDeadlineStatus } from '../../utils/dateUtils';
import { findMatchingRole, getMemberLevel } from '../../utils/memberQuotaUtils';
import { isPageShown, type PageVisibility } from '../layout/navItems';
import { AgendaAndDevotions } from './AgendaAndDevotions';
import { DivisionsSection } from './DivisionsSection';
import { FaqCenter } from './FaqCenter';
import { HomeHero } from './HomeHero';
import { LeadershipSection } from './LeadershipSection';
import { OpenRegistrations } from './OpenRegistrations';
import { VisionMission } from './VisionMission';

interface HomePageProps {
  activeTenure?: AppItem | null;
  divisions?: AppItem[];
  events?: AppItem[];
  members?: AppItem[];
  forms?: AppItem[];
  devotions?: AppItem[];
  faqs?: AppItem[];
  tenureRoles?: AppItem[];
  registrationCounts: RegistrationCounts;
  pageVisibility?: PageVisibility;
  setCurrentTab: (tab: string, formId?: string | null, eventId?: string | null) => void;
  onSubmitFaqQuestion?: (faq: AppItem) => Promise<unknown> | void;
}

export default function HomePage({
  activeTenure, divisions = [], events = [], members = [], forms = [], devotions = [], faqs = [], tenureRoles = [],
  registrationCounts, pageVisibility = {}, setCurrentTab, onSubmitFaqQuestion
}: HomePageProps) {
  const showForms = isPageShown('form', pageVisibility);
  const showOrganisation = isPageShown('organisasi', pageVisibility);
  const showEvents = isPageShown('event', pageVisibility);
  const showDevotions = isPageShown('renungan', pageVisibility);
  const tenureId = activeTenure?.id;
  const period = activeTenure?.code || activeTenure?.title || '';

  const activeForms = showForms
    ? forms.filter((f) => f.isOpen !== false && (!tenureId || f.tenureId === tenureId) && !getDeadlineStatus(f.deadline).isExpired)
    : [];
  const tenureDivisions = divisions.filter((d) => d.tenureId === tenureId);
  const tenureMembers = members.filter((m) => m.tenureId === tenureId);
  const tenureEvents = events.filter((e) => e.tenureId === tenureId && e.isPublic === true);
  // Members store their position as roleId; show the role's name when `role` itself is empty.
  const leaders = tenureMembers
    .filter((m) => getMemberLevel(m, tenureRoles) <= 4)
    .map((m) => ({ ...m, role: m.role || findMatchingRole(m, tenureRoles)?.name || '' }));

  /** Navigates only to pages the admin has not hidden. */
  const go = (tab: string, formId: string | null = null, eventId: string | null = null) => {
    const target = tab === 'program' ? 'event' : tab === 'oprec' ? 'form' : tab;
    if (!isPageShown(target, pageVisibility)) return;
    soundFx.playClick();
    setCurrentTab(target, formId, eventId);
  };

  const stats = [
    showOrganisation && { label: 'Pengurus & pelayan', value: String(tenureMembers.length), caption: period ? `Periode ${period}` : 'Periode ini', tab: 'organisasi' },
    showOrganisation && { label: 'Divisi pelayanan', value: String(tenureDivisions.length), caption: 'Pilar pelayanan', tab: 'organisasi' },
    showEvents && { label: 'Ibadah & acara', value: String(tenureEvents.length), caption: 'Agenda periode ini', tab: 'event' },
    showDevotions && { label: 'Renungan harian', value: devotions.length > 0 ? String(devotions.length) : '—', caption: 'Firman setiap hari', tab: 'renungan' }
  ].filter(Boolean) as { label: string; value: string; caption: string; tab: string }[];

  return (
    <div className="font-sans">
      <HomeHero activeTenure={activeTenure} activeForms={activeForms} stats={stats} showEvents={showEvents} showOrganisation={showOrganisation} go={go} />
      <VisionMission activeTenure={activeTenure} />
      <LeadershipSection leaders={leaders} periodLabel={period} showOrganisation={showOrganisation} go={go} />
      <OpenRegistrations forms={activeForms} go={go} />
      <DivisionsSection divisions={tenureDivisions} members={members} tenureRoles={tenureRoles} showOrganisation={showOrganisation} go={go} />
      <AgendaAndDevotions events={tenureEvents} devotions={devotions} forms={forms} registrationCounts={registrationCounts} periodLabel={period}
        showEvents={showEvents} showDevotions={showDevotions} go={go} />
      <FaqCenter faqs={faqs} onSubmitQuestion={onSubmitFaqQuestion} />
    </div>
  );
}
