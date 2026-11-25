import { BookOpen, BookmarkCheck, Building2, Calendar, Download, Image as ImageIcon, MonitorPlay, Music, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Grouped under "Lainnya" on desktop; listed individually on mobile and in the footer. */
  secondary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Beranda', icon: Building2 },
  { id: 'organisasi', label: 'Organisasi', icon: Users },
  { id: 'event', label: 'Ibadah & Acara', icon: Calendar },
  { id: 'renungan', label: 'Renungan', icon: BookOpen },
  { id: 'galeri', label: 'Galeri', icon: ImageIcon },
  { id: 'alkitab', label: 'Alkitab', icon: BookmarkCheck, secondary: true },
  { id: 'lagu', label: 'Kidung & Lagu', icon: Music, secondary: true },
  { id: 'easyworship', label: 'Multimedia Live', icon: MonitorPlay, secondary: true },
  { id: 'assets', label: 'Aset & Logo', icon: Download, secondary: true }
];

export type PageVisibility = Record<string, boolean | undefined>;

/** Admins can hide pages; event/program and form/oprec are aliases of one page each. */
export function isPageShown(id: string, visibility: PageVisibility): boolean {
  if (id === 'event' || id === 'program') return visibility.event !== false && visibility.program !== false;
  if (id === 'form' || id === 'oprec') return visibility.form !== false && visibility.oprec !== false;
  return visibility[id] !== false;
}

export function isActiveTab(itemId: string, currentTab: string): boolean {
  return currentTab === itemId || (itemId === 'event' && currentTab === 'program') || (itemId === 'form' && currentTab === 'oprec');
}
