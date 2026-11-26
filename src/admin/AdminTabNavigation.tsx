import { BookOpen, Calendar, CalendarDays, ClipboardList, Download, Eye, FileCheck2, HandHeart, Image as ImageIcon, Layers, LogOut, MessageSquare, MonitorPlay, Music, Shield, ShieldCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Sheet, cn } from '../ui';
import { DIVISION_ADMIN_TABS } from './adminConstants';
import { useAdminPortal } from './AdminPortalContext';

type TabItem = { id: string; label: string; icon: LucideIcon; count?: number };

/** Grouped admin navigation: sticky sidebar on desktop, a Sheet on smaller screens. */
export default function AdminTabNavigation({ onLogout }: { onLogout?: () => void }) {
  const {
    activeTab, applications, brandAssets, devotions, divisions, easyWorshipSchedules, events, faqs, forms, galleries,
    isAdminMobileMenuOpen, isSuperAdmin, members, setActiveTab, setIsAdminMobileMenuOpen, submissions, tenureRoles, tenures, worshipSongs
  } = useAdminPortal();

  const groups: { title: string; items: TabItem[] }[] = [
    { title: 'Acara & pendaftaran', items: [
      { id: 'events', label: 'Ibadah & acara', icon: CalendarDays, count: events.length },
      { id: 'forms', label: 'Formulir', icon: ClipboardList, count: forms.length },
      { id: 'submissions', label: 'Data pendaftaran', icon: FileCheck2, count: submissions.length + applications.length }
    ] },
    { title: 'Organisasi', items: [
      { id: 'members', label: 'Pengurus & pelayan', icon: Users, count: members.length },
      { id: 'roles', label: 'Role & jabatan', icon: Shield, count: tenureRoles.length },
      { id: 'divisions', label: 'Divisi', icon: Layers, count: divisions.length },
      { id: 'tenure', label: 'Periode kepengurusan', icon: Calendar, count: tenures.length }
    ] },
    { title: 'Konten', items: [
      { id: 'devotions', label: 'Renungan harian', icon: BookOpen, count: devotions.length },
      { id: 'songs', label: 'Kidung & lagu', icon: Music, count: worshipSongs.length },
      { id: 'easyworship', label: 'Jadwal EasyWorship', icon: MonitorPlay, count: easyWorshipSchedules.length },
      { id: 'gallery', label: 'Galeri kegiatan', icon: ImageIcon, count: galleries.length },
      { id: 'assets', label: 'Aset & logo', icon: Download, count: brandAssets.length },
      { id: 'faqs', label: 'Panduan & FAQ', icon: MessageSquare, count: faqs.length },
      { id: 'prayers', label: 'Pokok doa', icon: HandHeart }
    ] },
    { title: 'Pengaturan', items: [
      { id: 'visibility', label: 'Visibilitas menu', icon: Eye },
      { id: 'admins', label: 'Kelola admin', icon: ShieldCheck }
    ] }
  ]
    .map((g) => ({ ...g, items: g.items.filter((t) => isSuperAdmin || DIVISION_ADMIN_TABS.includes(t.id)) }))
    .filter((g) => g.items.length > 0);
  const all = groups.flatMap((g) => g.items);
  const current = all.find((t) => t.id === activeTab) || all[0];
  const CurrentIcon = current.icon;

  const list = (onPick?: () => void) => (
    <nav aria-label="Menu admin" className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 px-3 text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-dim">{g.title}</p>
          <ul className="flex list-none flex-col gap-0.5">
            {g.items.map((t) => {
              const Icon = t.icon;
              const active = t.id === current.id;
              return (
                <li key={t.id}>
                  <button type="button" aria-current={active ? 'page' : undefined} onClick={() => { setActiveTab(t.id); onPick?.(); }}
                    className={cn('flex w-full cursor-pointer items-center gap-2.5 rounded-md border-0 px-3 py-2 text-left text-[0.88rem] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
                      active ? 'bg-navy-tint font-semibold text-navy-ink' : 'bg-transparent text-muted hover:bg-subtle hover:text-ink')}>
                    <Icon size={16} aria-hidden="true" className="shrink-0" />
                    <span className="flex-1 truncate">{t.label}</span>
                    {t.count !== undefined && <span className="tabular-nums text-[0.76rem] text-dim">{t.count}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 flex max-h-[calc(100vh-7rem)] flex-col gap-4 overflow-y-auto rounded-lg border border-line bg-surface p-3 shadow-card">
          {list()}
          {onLogout && (
            <div className="border-t border-line pt-3">
              <button type="button" onClick={onLogout} className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-3 py-2 text-[0.88rem] font-medium text-danger hover:bg-danger-tint">
                <LogOut size={16} aria-hidden="true" />Keluar
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-card lg:hidden">
        <span className="flex min-w-0 items-center gap-2 font-semibold text-ink"><CurrentIcon size={16} aria-hidden="true" className="shrink-0 text-gold-ink" /><span className="truncate">{current.label}</span></span>
        <button type="button" onClick={() => setIsAdminMobileMenuOpen(true)} className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border border-line bg-surface px-4 text-[0.84rem] font-semibold text-ink hover:border-line-strong">
          Ganti menu
        </button>
      </div>
      <Sheet open={Boolean(isAdminMobileMenuOpen)} onClose={() => setIsAdminMobileMenuOpen(false)} title="Menu admin">
        {list(() => setIsAdminMobileMenuOpen(false))}
      </Sheet>
    </>
  );
}
