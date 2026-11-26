import { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { EyeOff, Sun, Moon, X } from 'lucide-react';
import SiteHeader from './components/layout/SiteHeader';
import AnnouncementBar from './components/layout/AnnouncementBar';
import OfflineNotice from './components/layout/OfflineNotice';
import QuickSearch from './components/layout/QuickSearch';
import HomePage from './components/home/HomePage';
import SiteFooter from './components/layout/SiteFooter';
import ErrorBoundary from './components/ErrorBoundary';
import { Badge, Card } from './ui';
import { BAPEKKRIS_LOGO, logoFor } from './lib/brandLogos';
import AdminOnlyNotice from './components/AdminOnlyNotice';

// Page chunks, keyed by tab. The chunk of the tab in the address bar starts downloading right away
// (below), in parallel with the app bundle, instead of after the first render.
const PAGE_LOADERS = {
  organisasi: () => import('./components/organization/OrganizationSection'),
  event: () => import('./components/events/ProgramSection'),
  galeri: () => import('./components/gallery/GallerySection'),
  renungan: () => import('./components/devotions/DailyDevotionSection'),
  alkitab: () => import('./components/bible/BibleSection'),
  lagu: () => import('./components/songs/WorshipSongSection'),
  doa: () => import('./components/prayer/PrayerWallSection'),
  easyworship: () => import('./components/easyworship/EasyWorshipSection'),
  projector: () => import('./components/ProjectorDisplay'),
  assets: () => import('./components/assets/AssetKitSection'),
  form: () => import('./components/dynamic-form/DynamicFormSection'),
  admin: () => import('./components/AdminPortal'),
  'event-stats': () => import('./components/registration-stats/EventRegistrationStats')
};
PAGE_LOADERS[parseLocationRoute(window.location).tab as keyof typeof PAGE_LOADERS]?.().catch(() => { /* retried by React.lazy on render */ });

const OrganizationSection = lazy(PAGE_LOADERS.organisasi);
const ProgramSection = lazy(PAGE_LOADERS.event);
const GallerySection = lazy(PAGE_LOADERS.galeri);
const DailyDevotionSection = lazy(PAGE_LOADERS.renungan);
const BibleSection = lazy(PAGE_LOADERS.alkitab);
const WorshipSongSection = lazy(PAGE_LOADERS.lagu);
const PrayerWallSection = lazy(PAGE_LOADERS.doa);
const EasyWorshipSection = lazy(PAGE_LOADERS.easyworship);
const ProjectorDisplay = lazy(PAGE_LOADERS.projector);
const AssetKitSection = lazy(PAGE_LOADERS.assets);
const DynamicFormSection = lazy(PAGE_LOADERS.form);
const AdminPortal = lazy(PAGE_LOADERS.admin);
const EventRegistrationStats = lazy(PAGE_LOADERS['event-stats']);

import {
  supabase,
  insertRow,
  insertRows,
  submitFormRegistration,
  submitEventRsvp,
  fetchAdminProfile,
  signInAdmin,
  signOutAdmin,
  saveRow,
  saveRows,
  deleteRow,
  deleteRowsWhere,
  saveSetting,
  deleteMediaFromCloud,
  type AppItem,
  type AppRecord
} from './lib/supabase';
import type { AdminSessionState } from './admin/useAdminPortalState';
import type { PageVisibility } from './components/layout/navItems';
import type { RsvpInput } from './components/events/useProgramSection';
import type { SubmissionInput } from './components/dynamic-form/useDynamicForm';
import type { ProjectorItem, Song } from './types/content';
import { useLocation } from 'react-router';
import type { Session } from '@supabase/supabase-js';
import { getInitialTheme, getSavedTheme, saveTheme, watchSystemTheme } from './lib/theme';
import {
  AppNavigationContext,
  PUBLIC_PAGE_IDS,
  buildTabUrl,
  parseLocationRoute,
  useQueuedNavigation
} from './lib/appNavigation';
import {
  refreshAllData,
  removePrivateTableData,
  usePageSettings,
  useRealtimeInvalidation,
  useRegistrationCounts,
  useSyncStatus,
  useTableData
} from './lib/queries';
import type { TableKey } from './lib/supabase';
import { isEventPassed } from './utils/dateUtils';
import { getDivisionLead, getCategoryFromLevel } from './utils/memberQuotaUtils';
import { buildPageMeta, useDocumentMeta } from './lib/seo';
import { useTrackPageView } from './lib/analytics';
import { deriveRegistrationCounts, isFormConnectedToEvent } from './utils/quotaUtils';

const DEFAULT_ANNOUNCEMENT_BAR: AppRecord = {
  badge: '',
  message: '',
  ctaText: '',
  ctaTab: 'home',
  isActive: false
};

const EMPTY_ROLE_QUOTAS: AppRecord = {};

// Parents are restored before children so foreign keys always resolve.
const RESTORE_ORDER: TableKey[] = [
  'tenures', 'tenureRoles', 'divisions', 'subDivisions', 'members', 'events', 'forms',
  'submissions', 'eventRsvps', 'luckyDraws', 'galleries', 'devotions', 'worshipSongs',
  'easyWorshipSchedules', 'brandAssets', 'faqs'
];

function replaceById(list: AppItem[], updates: AppItem[]): AppItem[] {
  if (updates.length === 0) return list;
  const byId = new Map(updates.map(item => [item.id, item]));
  return list.map(item => byId.get(item.id) || item);
}

// Member category (pembina, inti, pimpro, anggota, ...) follows the level of the member's role.
function withMemberCategories(members: AppItem[], roles: AppItem[]): AppItem[] {
  return members.map(m => {
    const role = roles.find(r => r.id === m.roleId);
    return role ? { ...m, id: m.id, category: getCategoryFromLevel(role.level) } : m;
  });
}

function withDerivedEventStatus(event: AppItem): AppItem {
  return event.status !== 'Completed' && isEventPassed(event.startDate, event.endDate)
    ? { ...event, status: 'Completed' }
    : event;
}

function getSubmissionFileUrls(files: unknown): string[] {
  if (!files || typeof files !== 'object') return [];
  return Object.values(files as Record<string, unknown>)
    .map(f => (typeof f === 'string' ? f : String((f as AppRecord | null)?.dataUrl || (f as AppRecord | null)?.url || (f as AppRecord | null)?.fileUrl || '')))
    .filter(Boolean);
}

// Returns the other forms currently connected to an event, disconnected from it.
function detachFormsFromEvent(forms: AppItem[], eventId: string, exceptFormId: string, updatedAt: string): AppItem[] {
  return forms
    .filter(f => f.id !== exceptFormId && isFormConnectedToEvent(f, eventId))
    .map(f => ({ ...f, isEventConnected: false, eventId: '', isLuckyDraw: false, updatedAt }));
}

const DEFAULT_PAGE_VISIBILITY: PageVisibility = {
  navbar: true,
  home: true,
  organisasi: true,
  event: true,
  program: true,
  renungan: true,
  alkitab: true,
  lagu: true,
  doa: true,
  easyworship: true,
  galeri: true,
  assets: true,
  form: true,
  oprec: true
};

// Helper to consistently sort tenures descending by year (e.g. 2028 -> 2027 -> 2026)
const sortTenuresDesc = (list: AppItem[] = []) => {
  return [...list].sort((a, b) => {
    const numA = parseInt(a.code || a.id?.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.code || b.id?.replace(/\D/g, '') || '0', 10);
    if (numB !== numA) return numB - numA;
    return (b.title || '').localeCompare(a.title || '');
  });
};

// Development-only component showcase (/#ui-kit); removed from production builds.
const UiKitPreview = import.meta.env.DEV ? lazy(() => import('./ui/UiKitPreview')) : null;

export default function App() {
  const location = useLocation();
  if (UiKitPreview && location.hash === '#ui-kit') {
    return <Suspense fallback={null}><UiKitPreview /></Suspense>;
  }
  const isProjectorMode = location.hash === '#projector' || new URLSearchParams(location.search).get('mode') === 'projector';
  if (isProjectorMode) {
    return (
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black text-white">Memuat layar proyektor…</div>}>
        <ProjectorDisplay />
      </Suspense>
    );
  }
  return <MainApp />;
}

function MainApp() {
  // Navigation state lives in the URL (React Router); see src/lib/appNavigation.tsx for the scheme.
  const location = useLocation();
  const navigateTo = useQueuedNavigation();
  const route = useMemo(
    () => parseLocationRoute(location),
    [location.pathname, location.search, location.hash]
  );
  const currentTab = route.tab;
  const activeFormIdFromUrl = route.formId;
  const activeEventIdFromUrl = route.eventId;
  const activeGalleryIdFromUrl = route.galleryId;

  const pathnameRef = useRef(location.pathname);
  pathnameRef.current = location.pathname;

  const setCurrentTab = useCallback((
    nextTab: string,
    formIdParam: string | null = null,
    eventIdParam: string | null = null,
    shouldScroll = true,
    galleryIdParam: string | null = null
  ) => {
    const url = buildTabUrl(
      { tab: nextTab, formId: formIdParam, eventId: eventIdParam, galleryId: galleryIdParam },
      pathnameRef.current
    );
    navigateTo(url, { scroll: shouldScroll });
  }, [navigateTo]);

  // Page & Navbar Visibility State (View / Hide per page & navbar), stored in page_settings
  const [pageSettings, updatePageSettings] = usePageSettings();
  const [legacyPageVisibility] = useState<PageVisibility | null>(() => {
    try {
      const legacy = localStorage.getItem('bapekkris_page_visibility');
      return legacy ? JSON.parse(legacy) : null;
    } catch {
      return null;
    }
  });
  const pageVisibility = useMemo<PageVisibility>(() => {
    const stored = pageSettings?.pageVisibility;
    if (stored && typeof stored === 'object') return { ...DEFAULT_PAGE_VISIBILITY, ...stored };
    if (legacyPageVisibility) return { ...DEFAULT_PAGE_VISIBILITY, ...legacyPageVisibility };
    return DEFAULT_PAGE_VISIBILITY;
  }, [pageSettings?.pageVisibility, legacyPageVisibility]);
  const setPageVisibilityState = (nextVisibility: PageVisibility) => updatePageSettings({ pageVisibility: nextVisibility });

  // Follows the OS setting until the visitor picks a theme (src/lib/theme.ts)
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => watchSystemTheme((systemTheme) => {
    if (!getSavedTheme()) setTheme(systemTheme);
  }), []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    setTheme(next);
  };

  // Supabase Auth session of an admin: 'loading' | 'signedOut' | 'admin'
  const [adminSession, setAdminSession] = useState<AdminSessionState>({ status: 'loading', profile: null });
  const isAdmin = adminSession.status === 'admin';

  // Server data lives in the TanStack Query cache (src/lib/queries.ts). Each table is used like
  // useState: handlers apply optimistic `setX(prev => ...)` edits, and realtime events, polling and
  // window focus refetch only what changed.
  const [rawTenures, setTenures] = useTableData('tenures');
  const [tenureRoles, setTenureRoles] = useTableData('tenureRoles');
  const [rawMembers, setMembers] = useTableData('members');
  const [rawDivisions, setDivisions] = useTableData('divisions');
  const [rawEvents, setEvents, eventsUpdatedAt] = useTableData('events');
  const [rawGalleries, setGalleries] = useTableData('galleries');
  const [subDivisions, setSubDivisions] = useTableData('subDivisions');
  const [devotions, setDevotions] = useTableData('devotions');
  const [worshipSongs, setWorshipSongs] = useTableData('worshipSongs');
  // Rows mapped by tableMappers.worshipSongs, so every song has an id and a title
  const songs = worshipSongs as Song[];
  const [easyWorshipSchedules, setEasyWorshipSchedules] = useTableData('easyWorshipSchedules');
  const [forms, setForms] = useTableData('forms');
  const [brandAssets, setBrandAssets] = useTableData('brandAssets');
  const [faqs, setFaqs] = useTableData('faqs');
  // Registrants' personal data is loaded for signed-in admins only...
  const [submissions, setSubmissions] = useTableData('submissions', { enabled: isAdmin });
  const [eventRsvps, setEventRsvps] = useTableData('eventRsvps', { enabled: isAdmin });
  const [luckyDraws, setLuckyDraws] = useTableData('luckyDraws', { enabled: isAdmin });
  // ...visitors receive aggregated registration counts instead.
  const [publicRegistrationCounts, setPublicRegistrationCounts] = useRegistrationCounts({
    enabled: adminSession.status === 'signedOut'
  });
  const syncStatus = useSyncStatus();
  useRealtimeInvalidation();

  // Derived views: cross-table fields are recomputed whenever their source tables change.
  const members = useMemo(() => withMemberCategories(rawMembers, tenureRoles), [rawMembers, tenureRoles]);
  const divisions = useMemo(() => rawDivisions.map((d): AppItem => {
    const lead = getDivisionLead(d, members, tenureRoles);
    return {
      ...d,
      memberId: lead.member ? lead.member.id : (d.memberId || null),
      leadName: lead.name || (d.leadName || '')
    };
  }), [rawDivisions, members, tenureRoles]);
  // eventsUpdatedAt re-evaluates the "Completed" display status on every refresh, even when the
  // rows themselves did not change.
  const events = useMemo(() => rawEvents.map((e): AppItem => {
    const divObj = rawDivisions.find(d => d.id === e.divisionId) || rawDivisions.find(d => d.name === e.divisionName);
    return {
      ...withDerivedEventStatus(e),
      divisionId: e.divisionId || divObj?.id,
      divisionName: divObj?.name || e.divisionName || 'Bapekkris Bank Mandiri'
    };
  }), [rawEvents, rawDivisions, eventsUpdatedAt]);
  const galleries = useMemo(() => rawGalleries.map((g): AppItem => {
    const matchedDiv = rawDivisions.find(d => d.id === g.divisionId) || rawDivisions.find(d => d.name === g.division);
    const resolvedName = matchedDiv?.name || g.divisionName || g.division || 'Bapekkris Bank Mandiri';
    return { ...g, divisionId: g.divisionId || matchedDiv?.id, division: resolvedName, divisionName: resolvedName };
  }), [rawGalleries, rawDivisions]);

  // Tenures: exactly one is active, the one named by page_settings.active_tenure_id.
  const officialTenureId = pageSettings?.activeTenureId || null;
  const tenures = useMemo(() => {
    const sorted = sortTenuresDesc(rawTenures);
    const official = sorted.find(t => t.id === officialTenureId) || sorted.find(t => t.isActive) || sorted[0] || null;
    return sorted.map((t): AppItem => ({ ...t, isActive: Boolean(official) && t.id === official.id }));
  }, [rawTenures, officialTenureId]);
  // The tenure being browsed (a view filter that never changes the official one).
  const [activeTenure, setActiveTenure] = useState<AppItem | null>(() => tenures.find(t => t.isActive) || null);
  useEffect(() => {
    // Keep the browsing selection when it still exists, otherwise fall back to the official tenure.
    setActiveTenure(curr => {
      const official = tenures.find(t => t.isActive) || null;
      if (!official) return null;
      return (curr && tenures.find(t => t.id === curr.id)) || official;
    });
  }, [tenures]);

  const announcementBar = useMemo(
    () => ({ ...DEFAULT_ANNOUNCEMENT_BAR, ...(pageSettings?.announcementBar || {}) }),
    [pageSettings?.announcementBar]
  );
  const roleQuotas = pageSettings?.roleQuotas && typeof pageSettings.roleQuotas === 'object'
    ? pageSettings.roleQuotas
    : EMPTY_ROLE_QUOTAS;
  const setAnnouncementBar = (bar: AppRecord) => updatePageSettings({ announcementBar: bar });

  const [easyWorshipInitialItem, setEasyWorshipInitialItem] = useState<ProjectorItem | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Global keyboard shortcut Ctrl+K / Cmd+K for Quick Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsQuickSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsQuickSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [persistError, setPersistError] = useState<string | null>(null);

  // Runs a database write for an optimistic UI change. On failure the user is informed
  // and local state is reloaded from the server so the screen never shows unsaved data.
  const persist = useCallback(async (label: string, task: () => Promise<unknown>) => {
    try {
      await task();
      return true;
    } catch (err) {
      console.error(err);
      setPersistError(`${label} gagal disimpan ke server (${(err as Error).message}). Data dimuat ulang dari server.`);
      refreshAllData();
      return false;
    }
  }, []);

  // Track the Supabase Auth session and the admin role attached to it.
  useEffect(() => {
    let cancelled = false;
    const resolveSession = async (session: Session | null) => {
      if (!session) {
        if (!cancelled) setAdminSession({ status: 'signedOut', profile: null });
        return;
      }
      try {
        const profile = await fetchAdminProfile(session.user.id);
        if (!cancelled) setAdminSession(profile ? { status: 'admin', profile } : { status: 'signedOut', profile: null });
      } catch (err) {
        console.error(err);
        if (!cancelled) setAdminSession({ status: 'signedOut', profile: null });
      }
    };
    supabase.auth.getSession().then(({ data }) => resolveSession(data.session));
    // Deferred: Supabase must not be queried synchronously inside the auth callback.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => resolveSession(session), 0);
    });
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Private data is dropped as soon as the admin signs out. Switching between visitor and admin
  // reloads everything, since which rows are visible (drafts, unpublished FAQs) depends on the role.
  const previousAuthStatusRef = useRef(adminSession.status);
  useEffect(() => {
    const previous = previousAuthStatusRef.current;
    previousAuthStatusRef.current = adminSession.status;
    if (adminSession.status === 'loading') return;
    if (!isAdmin) removePrivateTableData();
    if (previous !== 'loading' && previous !== adminSession.status) refreshAllData();
  }, [isAdmin, adminSession.status]);

  const registrationCounts = useMemo(
    () => (isAdmin ? deriveRegistrationCounts(submissions, eventRsvps) : publicRegistrationCounts),
    [isAdmin, submissions, eventRsvps, publicRegistrationCounts]
  );

  // Division admins see only their own division's data in the Admin Portal, so every division
  // picker offers just that division. The database (RLS) enforces the same scope on writes.
  const adminDivisionId = adminSession.profile?.role === 'division_admin' ? adminSession.profile.divisionId : null;
  const adminScope = useMemo(() => {
    if (!adminDivisionId) return { divisions, forms, galleries, members, events, subDivisions };
    const scopedEvents = events.filter(e => e.divisionId === adminDivisionId);
    const eventIds = new Set(scopedEvents.map(e => e.id));
    return {
      divisions: divisions.filter(d => d.id === adminDivisionId),
      subDivisions: subDivisions.filter(sd => sd.divisionId === adminDivisionId),
      members: members.filter(m => m.divisionId === adminDivisionId),
      events: scopedEvents,
      galleries: galleries.filter(g => g.divisionId === adminDivisionId || eventIds.has(g.eventId)),
      forms: forms.filter(f => eventIds.has(f.eventId))
    };
  }, [adminDivisionId, divisions, forms, galleries, members, events, subDivisions]);

  const handleAdminLogin = async (email: string, password: string) => {
    const profile = await signInAdmin(email, password);
    setAdminSession({ status: 'admin', profile });
    return profile;
  };
  const handleAdminLogout = async () => {
    await signOutAdmin();
    setAdminSession({ status: 'signedOut', profile: null });
  };

  const bumpPublicCount = (kind: 'forms' | 'events', id: string) => {
    setPublicRegistrationCounts(prev => ({
      ...prev,
      [kind]: { ...prev[kind], [id]: (prev[kind][id] || 0) + 1 }
    }));
  };

  const setPageVisibility = (resolved: PageVisibility) => {
    const now = new Date().toISOString();

    // Check what was toggled to reliably sync dual keys (event/program, form/oprec)
    let targetEvent: unknown = pageVisibility.event !== false && pageVisibility.program !== false;
    if (resolved.event !== undefined && resolved.event !== pageVisibility.event) {
      targetEvent = resolved.event;
    } else if (resolved.program !== undefined && resolved.program !== pageVisibility.program) {
      targetEvent = resolved.program;
    } else if (resolved.event !== undefined) {
      targetEvent = resolved.event;
    } else if (resolved.program !== undefined) {
      targetEvent = resolved.program;
    }

    let targetForm: unknown = pageVisibility.form !== false && pageVisibility.oprec !== false;
    if (resolved.form !== undefined && resolved.form !== pageVisibility.form) {
      targetForm = resolved.form;
    } else if (resolved.oprec !== undefined && resolved.oprec !== pageVisibility.oprec) {
      targetForm = resolved.oprec;
    } else if (resolved.form !== undefined) {
      targetForm = resolved.form;
    } else if (resolved.oprec !== undefined) {
      targetForm = resolved.oprec;
    }

    const merged: PageVisibility = {
      ...DEFAULT_PAGE_VISIBILITY,
      ...resolved,
      event: targetEvent !== false,
      program: targetEvent !== false,
      form: targetForm !== false,
      oprec: targetForm !== false,
      _updatedAt: now
    };

    setPageVisibilityState(merged);
    try { localStorage.setItem('bapekkris_page_visibility', JSON.stringify(merged)); } catch { /* storage unavailable */ }
    persist('Pengaturan tampilan halaman', () => saveSetting('pageVisibility', merged));
  };

  // Visitor / Admin local view mode (filters the page display without mutating the official active tenure in database)
  const handleSelectTenure = (tenureObj: AppItem) => {
    setActiveTenure(tenureObj);
  };

  // Divisions
  const handleAddDivision = (newDiv: AppItem) => {
    const pimpro = newDiv.memberId ? members.find(m => m.id === newDiv.memberId) : null;
    const now = new Date().toISOString();
    const finalDiv: AppItem = {
      ...newDiv,
      leadName: pimpro ? pimpro.name : newDiv.leadName,
      createdAt: newDiv.createdAt || now,
      updatedAt: newDiv.updatedAt || now
    };
    const relinkedMember = pimpro && pimpro.divisionId !== finalDiv.id ? { ...pimpro, divisionId: finalDiv.id } : null;

    setDivisions(prev => [...prev, finalDiv]);
    if (relinkedMember) setMembers(prev => replaceById(prev, [relinkedMember]));
    persist('Divisi', async () => {
      await saveRow('divisions', finalDiv);
      if (relinkedMember) await saveRow('members', relinkedMember);
    });
  };
  const handleUpdateDivision = (updatedDiv: AppItem) => {
    const pimpro = updatedDiv.memberId ? members.find(m => m.id === updatedDiv.memberId) : null;
    const finalDiv: AppItem = {
      ...updatedDiv,
      leadName: pimpro ? pimpro.name : updatedDiv.leadName,
      updatedAt: new Date().toISOString()
    };

    // Keep the linked Pimpro pointing at this division, or sync the Pimpro name from the division lead name.
    let memberUpdates: AppItem[] = [];
    if (finalDiv.memberId) {
      if (pimpro && pimpro.divisionId !== finalDiv.id) memberUpdates = [{ ...pimpro, divisionId: finalDiv.id }];
    } else if (finalDiv.leadName) {
      memberUpdates = members
        .filter(m => m.category === 'pimpro' && m.divisionId === finalDiv.id && m.name !== finalDiv.leadName)
        .map(m => ({ ...m, name: finalDiv.leadName }));
    }

    // Galleries matched only by the old division name get linked by id.
    let galleryUpdates: AppItem[] = [];
    if (updatedDiv.name) {
      const previousDiv = divisions.find(d => d.id === updatedDiv.id);
      galleryUpdates = galleries
        .filter(g => g.divisionId === updatedDiv.id || (previousDiv && g.division === previousDiv.name))
        .map(g => ({ ...g, divisionId: updatedDiv.id, division: updatedDiv.name, divisionName: updatedDiv.name }));
    }
    const galleriesToSave = galleryUpdates.filter(g => galleries.find(old => old.id === g.id)?.divisionId !== updatedDiv.id);

    setDivisions(prev => replaceById(prev, [finalDiv]));
    if (memberUpdates.length > 0) setMembers(prev => replaceById(prev, memberUpdates));
    if (galleryUpdates.length > 0) setGalleries(prev => replaceById(prev, galleryUpdates));
    if (updatedDiv.name) {
      setEvents(prev => prev.map(e => (e.divisionId === updatedDiv.id ? { ...e, divisionName: updatedDiv.name } : e)));
    }
    persist('Divisi', async () => {
      await saveRow('divisions', finalDiv);
      await saveRows('members', memberUpdates);
      await saveRows('galleries', galleriesToSave);
    });
  };
  const handleDeleteDivision = (divId: string) => {
    const targetDiv = divisions.find(d => d.id === divId);
    // Defense-in-depth: a division with members, events, galleries or sub-divisions is never deleted
    // (the database also refuses: sub_divisions.division_id is ON DELETE RESTRICT).
    const hasMem = members.some(m => m.divisionId === divId);
    const hasEvt = events.some(e => e.divisionId === divId);
    const hasGal = galleries.some(g => g.divisionId === divId || (targetDiv && g.division === targetDiv.name));
    const hasSub = subDivisions.some(sd => sd.divisionId === divId);
    if (hasMem || hasEvt || hasGal || hasSub) return;

    setDivisions(prev => prev.filter(d => d.id !== divId));
    persist('Penghapusan divisi', () => deleteRow('divisions', divId));
  };

  // Tenures
  const handleAddTenure = (newTenure: AppItem) => {
    const now = new Date().toISOString();
    const stampedTenure: AppItem = { ...newTenure, createdAt: newTenure.createdAt || now, updatedAt: newTenure.updatedAt || now };
    // With no stored official tenure (fresh database), the first tenure added becomes the official one.
    const hasStoredOfficial = rawTenures.some(t => t.id === officialTenureId || t.isActive);
    const isActivating = Boolean(stampedTenure.isActive) || !hasStoredOfficial;
    if (isActivating) stampedTenure.isActive = true;
    const deactivated = isActivating ? tenures.filter(t => t.isActive).map(t => ({ ...t, isActive: false, updatedAt: now })) : [];

    setTenures(prev => sortTenuresDesc([...replaceById(prev, deactivated), stampedTenure]));
    if (isActivating) {
      updatePageSettings({ activeTenureId: stampedTenure.id });
      setActiveTenure(stampedTenure);
    }
    persist('Periode kepengurusan', async () => {
      await saveRows('tenures', [stampedTenure, ...deactivated]);
      if (isActivating) await saveSetting('activeTenureId', stampedTenure.id);
    });
  };
  const handleUpdateTenure = (updatedTenure: AppItem) => {
    const now = new Date().toISOString();
    const stampedTenure: AppItem = { ...updatedTenure, updatedAt: now };
    const isActivating = Boolean(stampedTenure.isActive);
    // Strict exclusivity: when a tenure becomes active, all other tenures must become inactive
    const deactivated = isActivating
      ? tenures.filter(t => t.id !== stampedTenure.id && t.isActive).map(t => ({ ...t, isActive: false, updatedAt: now }))
      : [];

    setTenures(prev => sortTenuresDesc(replaceById(prev, [stampedTenure, ...deactivated])));
    if (isActivating) updatePageSettings({ activeTenureId: stampedTenure.id });
    if (isActivating || activeTenure?.id === stampedTenure.id) setActiveTenure(stampedTenure);
    persist('Periode kepengurusan', async () => {
      await saveRows('tenures', [stampedTenure, ...deactivated]);
      if (isActivating) await saveSetting('activeTenureId', stampedTenure.id);
    });
  };
  const handleDeleteTenure = (tenureId: string) => {
    // Defense-in-depth safety checks: do not delete if only 1 tenure, active, or has dependencies
    if (tenures.length <= 1) return;
    if (tenures.some(t => t.id === tenureId && t.isActive)) return;
    const hasDiv = divisions.some(d => d.tenureId === tenureId);
    const hasMem = members.some(m => m.tenureId === tenureId);
    const hasEvt = events.some(e => e.tenureId === tenureId);
    const hasGal = galleries.some(g => g.tenureId === tenureId);
    if (hasDiv || hasMem || hasEvt || hasGal) return;

    setTenures(prev => prev.filter(t => t.id !== tenureId));
    persist('Penghapusan periode kepengurusan', () => deleteRow('tenures', tenureId));
  };

  // Galleries
  const handleAddGallery = (newGal: AppItem) => {
    const now = new Date().toISOString();
    const stampedGal: AppItem = { ...newGal, createdAt: newGal.createdAt || now, updatedAt: newGal.updatedAt || now };
    setGalleries(prev => [stampedGal, ...prev]);
    persist('Galeri', () => saveRow('galleries', stampedGal));
  };
  const handleUpdateGallery = async (updatedGal: AppItem) => {
    const oldGal = galleries.find(g => g.id === updatedGal.id);
    const currentPhotos = Array.isArray(updatedGal.photos) ? updatedGal.photos : [];
    const removedPhotos = ((oldGal?.photos || []) as string[]).filter(p => !currentPhotos.includes(p));
    const stampedGal: AppItem = { ...updatedGal, updatedAt: new Date().toISOString() };

    setGalleries(prev => replaceById(prev, [stampedGal]));
    if (await persist('Galeri', () => saveRow('galleries', stampedGal))) {
      removedPhotos.forEach(deleteMediaFromCloud);
    }
  };
  const handleDeleteGallery = async (galId: string) => {
    const target = galleries.find(g => g.id === galId);
    setGalleries(prev => prev.filter(g => g.id !== galId));
    if (await persist('Penghapusan galeri', () => deleteRow('galleries', galId))) {
      (target?.photos || []).forEach(deleteMediaFromCloud);
    }
  };

  // Members. Division lead links (memberId / leadName) are derived locally and not stored on divisions.
  const linkPimproToDivision = (member: AppItem) => {
    if (member.category !== 'pimpro' || !member.divisionId) return;
    setDivisions(prev => prev.map(d => (
      d.id === member.divisionId ? { ...d, memberId: member.id, leadName: member.name || d.leadName } : d
    )));
  };
  const handleAddMember = (newMem: AppItem) => {
    const now = new Date().toISOString();
    const stampedMem: AppItem = { ...newMem, createdAt: newMem.createdAt || now, updatedAt: newMem.updatedAt || now };
    setMembers(prev => [...prev, stampedMem]);
    linkPimproToDivision(stampedMem);
    persist('Pengurus', () => saveRow('members', stampedMem));
  };
  const handleUpdateMember = async (updatedMem: AppItem) => {
    const oldImage = members.find(m => m.id === updatedMem.id)?.image;
    const stampedMem: AppItem = { ...updatedMem, updatedAt: new Date().toISOString() };
    setMembers(prev => replaceById(prev, [stampedMem]));
    linkPimproToDivision(stampedMem);
    if (await persist('Pengurus', () => saveRow('members', stampedMem))) {
      if (oldImage && oldImage !== stampedMem.image) deleteMediaFromCloud(oldImage);
    }
  };
  const handleDeleteMember = async (memId: string) => {
    const target = members.find(m => m.id === memId);
    if (!target) return;
    // Defense-in-depth safety check: do not delete a Pimpro if their division still has active squad members
    if (target.category === 'pimpro' && target.divisionId) {
      const hasSquad = members.some(m => m.category === 'anggota' && m.divisionId === target.divisionId);
      if (hasSquad) return;
    }
    setMembers(prev => prev.filter(m => m.id !== memId));
    setDivisions(prev => prev.map(d => (d.memberId === memId ? { ...d, memberId: null, leadName: '' } : d)));
    if (await persist('Penghapusan pengurus', () => deleteRow('members', memId))) {
      if (target.image) deleteMediaFromCloud(target.image);
    }
  };

  // Events
  const handleAddEvent = (newEvt: AppItem) => {
    const now = new Date().toISOString();
    const stampedEvt: AppItem = { ...newEvt, createdAt: newEvt.createdAt || now, updatedAt: newEvt.updatedAt || now };
    setEvents(prev => [...prev, stampedEvt]);
    persist('Acara', () => saveRow('events', stampedEvt));
  };
  const handleUpdateEvent = (updatedEvt: AppItem) => {
    const stampedEvt: AppItem = { ...updatedEvt, updatedAt: new Date().toISOString() };
    setEvents(prev => replaceById(prev, [stampedEvt]));
    persist('Acara', () => saveRow('events', stampedEvt));
  };
  const handleDeleteEvent = (evtId: string) => {
    // Defense-in-depth safety check: do not delete event if RSVP records still exist
    if (eventRsvps.some(r => r.eventId === evtId)) return;
    setEvents(prev => prev.filter(e => e.id !== evtId));
    persist('Penghapusan acara', () => deleteRow('events', evtId));
  };

  // Dynamic Forms. A form connected to an event takes over that event from any previously connected form (one-to-one).
  const saveFormWithEventTakeover = (stampedForm: AppItem, isNew: boolean) => {
    const detached = stampedForm.isEventConnected && stampedForm.eventId
      ? detachFormsFromEvent(forms, stampedForm.eventId, stampedForm.id, stampedForm.updatedAt)
      : [];
    setForms(prev => {
      const updated = replaceById(prev, isNew ? detached : [stampedForm, ...detached]);
      return isNew ? [stampedForm, ...updated] : updated;
    });
    persist('Formulir', () => saveRows('forms', [stampedForm, ...detached]));
  };
  const handleAddForm = (newForm: AppItem) => {
    const now = new Date().toISOString();
    saveFormWithEventTakeover({ ...newForm, createdAt: newForm.createdAt || now, updatedAt: newForm.updatedAt || now }, true);
  };
  const handleUpdateForm = (updatedForm: AppItem) => {
    saveFormWithEventTakeover({ ...updatedForm, updatedAt: new Date().toISOString() }, false);
  };
  // Deleting a form removes its submissions as well (database cascade), including their uploaded files.
  const handleDeleteForm = async (formId: string) => {
    const removedSubs = submissions.filter(s => s.formId === formId);
    setForms(prev => prev.filter(f => f.id !== formId));
    setSubmissions(prev => prev.filter(s => s.formId !== formId));
    if (await persist('Penghapusan formulir', () => deleteRow('forms', formId))) {
      removedSubs.flatMap(s => getSubmissionFileUrls(s.files)).forEach(deleteMediaFromCloud);
    }
  };

  // Submissions. Public registrations go through the submit_form RPC, which enforces deadline, quota
  // and unique fields atomically. Returns the registration id generated by the database.
  const handleSubmitSubmission = async ({ formId, data, files }: SubmissionInput) => {
    const id = await submitFormRegistration(formId, data, files);
    if (isAdmin) {
      const now = new Date().toISOString();
      setSubmissions(prev => [
        { id, formId, data, files, status: 'Submitted', adminNotes: '', createdAt: now, updatedAt: now },
        ...prev
      ]);
    } else {
      bumpPublicCount('forms', formId);
    }
    return id;
  };
  const handleUpdateSubmission = async (updatedSub: AppItem) => {
    const oldUrls = getSubmissionFileUrls(submissions.find(s => s.id === updatedSub.id)?.files);
    const newUrls = getSubmissionFileUrls(updatedSub.files);
    const stampedSub: AppItem = { ...updatedSub, updatedAt: new Date().toISOString() };
    setSubmissions(prev => replaceById(prev, [stampedSub]));
    if (await persist('Data pendaftaran', () => saveRow('submissions', stampedSub))) {
      oldUrls.filter(url => !newUrls.includes(url)).forEach(deleteMediaFromCloud);
    }
  };
  const handleDeleteSubmission = async (subId: string) => {
    const fileUrls = getSubmissionFileUrls(submissions.find(s => s.id === subId)?.files);
    setSubmissions(prev => prev.filter(s => s.id !== subId));
    if (await persist('Penghapusan data pendaftaran', () => deleteRow('submissions', subId))) {
      fileUrls.forEach(deleteMediaFromCloud);
    }
  };

  // Lucky Draw
  const handleAddLuckyDraw = useCallback((draws: AppItem[]) => {
    setLuckyDraws(prev => [...draws, ...prev]);
    persist('Hasil undian', () => insertRows('luckyDraws', draws));
  }, [persist]);
  const handleDeleteLuckyDraw = useCallback((id: string) => {
    setLuckyDraws(prev => prev.filter(ld => ld.id !== id));
    persist('Penghapusan pemenang undian', () => deleteRow('luckyDraws', id));
  }, [persist]);
  const handleResetLuckyDraw = useCallback((eventId: string) => {
    setLuckyDraws(prev => prev.filter(ld => ld.eventId !== eventId));
    persist('Reset undian', () => deleteRowsWhere('luckyDraws', 'event_id', eventId));
  }, [persist]);

  // Brand Assets
  const handleAddBrandAsset = (newAsset: AppItem) => {
    const now = new Date().toISOString();
    const stampedAsset: AppItem = { ...newAsset, createdAt: newAsset.createdAt || now, updatedAt: newAsset.updatedAt || now };
    setBrandAssets(prev => [...prev, stampedAsset]);
    persist('Aset brand', () => saveRow('brandAssets', stampedAsset));
  };
  const handleUpdateBrandAsset = async (updatedAsset: AppItem) => {
    const oldAsset = brandAssets.find(a => a.id === updatedAsset.id);
    const stampedAsset: AppItem = { ...updatedAsset, updatedAt: new Date().toISOString() };
    setBrandAssets(prev => replaceById(prev, [stampedAsset]));
    if (!(await persist('Aset brand', () => saveRow('brandAssets', stampedAsset))) || !oldAsset) return;
    // Remove replaced files only when they are no longer referenced by either field
    const stillUsed = [updatedAsset.fileUrl, updatedAsset.previewUrl];
    if (oldAsset.fileUrl && !stillUsed.includes(oldAsset.fileUrl)) deleteMediaFromCloud(oldAsset.fileUrl);
    if (oldAsset.previewUrl && oldAsset.previewUrl !== oldAsset.fileUrl && !stillUsed.includes(oldAsset.previewUrl)) {
      deleteMediaFromCloud(oldAsset.previewUrl);
    }
  };
  const handleDeleteBrandAsset = async (assetId: string) => {
    const targetAsset = brandAssets.find(a => a.id === assetId);
    setBrandAssets(prev => prev.filter(a => a.id !== assetId));
    if (!(await persist('Penghapusan aset brand', () => deleteRow('brandAssets', assetId))) || !targetAsset) return;
    if (targetAsset.fileUrl) deleteMediaFromCloud(targetAsset.fileUrl);
    if (targetAsset.previewUrl && targetAsset.previewUrl !== targetAsset.fileUrl) deleteMediaFromCloud(targetAsset.previewUrl);
  };

  const handleSendToEasyWorship = (item: ProjectorItem) => {
    setEasyWorshipInitialItem(item);
    setCurrentTab('easyworship');
  };

  // Sub-divisions
  const handleAddSubDivision = async (newSub: AppItem) => {
    setSubDivisions(prev => [...prev, newSub]);
    await persist('Sub-divisi', () => saveRow('subDivisions', newSub));
  };
  const handleUpdateSubDivision = async (updatedSub: AppItem) => {
    setSubDivisions(prev => replaceById(prev, [updatedSub]));
    await persist('Sub-divisi', () => saveRow('subDivisions', updatedSub));
  };
  const handleDeleteSubDivision = async (subId: string) => {
    setSubDivisions(prev => prev.filter(s => s.id !== subId));
    await persist('Penghapusan sub-divisi', () => deleteRow('subDivisions', subId));
  };

  // Daily devotions
  const handleAddDevotion = async (newDev: AppItem) => {
    setDevotions(prev => [newDev, ...prev]);
    await persist('Renungan', () => saveRow('devotions', newDev));
  };
  const handleUpdateDevotion = async (updatedDev: AppItem) => {
    setDevotions(prev => replaceById(prev, [updatedDev]));
    await persist('Renungan', () => saveRow('devotions', updatedDev));
  };
  const handleDeleteDevotion = async (devId: string) => {
    setDevotions(prev => prev.filter(d => d.id !== devId));
    await persist('Penghapusan renungan', () => deleteRow('devotions', devId));
  };

  // Worship songs
  const handleAddWorshipSong = async (newSong: AppItem) => {
    setWorshipSongs(prev => [...prev, newSong]);
    await persist('Lagu', () => saveRow('worshipSongs', newSong));
  };
  const handleUpdateWorshipSong = async (updatedSong: AppItem) => {
    setWorshipSongs(prev => replaceById(prev, [updatedSong]));
    await persist('Lagu', () => saveRow('worshipSongs', updatedSong));
  };
  const handleDeleteWorshipSong = async (songId: string) => {
    setWorshipSongs(prev => prev.filter(s => s.id !== songId));
    await persist('Penghapusan lagu', () => deleteRow('worshipSongs', songId));
  };

  // EasyWorship schedules (saved from the console by admins)
  const handleAddEasyWorshipSchedule = async (newSch: AppItem) => {
    setEasyWorshipSchedules(prev => [newSch, ...prev]);
    await persist('Jadwal EasyWorship', () => saveRow('easyWorshipSchedules', newSch));
  };
  const handleDeleteEasyWorshipSchedule = async (schId: string) => {
    setEasyWorshipSchedules(prev => prev.filter(s => s.id !== schId));
    await persist('Penghapusan jadwal EasyWorship', () => deleteRow('easyWorshipSchedules', schId));
  };

  // Event RSVP via the submit_rsvp RPC (event quota enforced in the database). Returns the stored RSVP.
  const handleAddEventRsvp = async ({ eventId, attendeeName, attendanceMode, notes }: RsvpInput) => {
    const id = await submitEventRsvp(eventId, attendeeName, attendanceMode, notes);
    const now = new Date().toISOString();
    const stored = { id, eventId, attendeeName, attendanceMode, notes, createdAt: now, updatedAt: now };
    if (isAdmin) {
      setEventRsvps(prev => [stored, ...prev]);
    } else {
      bumpPublicCount('events', eventId);
    }
    return stored;
  };
  const handleDeleteEventRsvp = (rsvpId: string) => {
    setEventRsvps(prev => prev.filter(r => r.id !== rsvpId));
    persist('Penghapusan RSVP', () => deleteRow('eventRsvps', rsvpId));
  };

  // Announcement Bar
  const handleUpdateAnnouncementBar = (nextBar: AppRecord) => {
    const merged = { ...DEFAULT_ANNOUNCEMENT_BAR, ...nextBar, _updatedAt: new Date().toISOString() };
    setAnnouncementBar(merged);
    setIsBannerDismissed(false);
    persist('Pengumuman', () => saveSetting('announcementBar', merged));
  };

  // FAQs
  const handleAddFaq = (newFaq: AppItem) => {
    const now = new Date().toISOString();
    const stampedFaq: AppItem = { ...newFaq, createdAt: newFaq.createdAt || now, updatedAt: newFaq.updatedAt || now };
    setFaqs(prev => [...prev, stampedFaq]);
    persist('FAQ', () => saveRow('faqs', stampedFaq));
  };
  const handleSubmitPublicFaq = async (newFaq: AppItem) => {
    const now = new Date().toISOString();
    const stampedFaq: AppItem = { ...newFaq, createdAt: newFaq.createdAt || now, updatedAt: newFaq.updatedAt || now };
    await insertRow('faqs', stampedFaq);
    setFaqs(prev => [stampedFaq, ...prev.filter(f => f.id !== stampedFaq.id)]);
  };
  const handleUpdateFaq = (updatedFaq: AppItem) => {
    const stampedFaq: AppItem = { ...updatedFaq, updatedAt: new Date().toISOString() };
    setFaqs(prev => replaceById(prev, [stampedFaq]));
    persist('FAQ', () => saveRow('faqs', stampedFaq));
  };
  const handleDeleteFaq = (faqId: string) => {
    setFaqs(prev => prev.filter(f => f.id !== faqId));
    persist('Penghapusan FAQ', () => deleteRow('faqs', faqId));
  };

  // Tenure Roles
  const handleAddTenureRole = (newRole: AppItem) => {
    const now = new Date().toISOString();
    const stampedRole: AppItem = { ...newRole, createdAt: newRole.createdAt || now, updatedAt: newRole.updatedAt || now };
    setTenureRoles(prev => [...prev, stampedRole]);
    persist('Jabatan', () => saveRow('tenureRoles', stampedRole));
  };
  const handleUpdateTenureRole = (updatedRole: AppItem) => {
    const existing = tenureRoles.find(r => r.id === updatedRole.id);
    if (!existing) return;
    const stampedRole: AppItem = { ...existing, ...updatedRole, updatedAt: new Date().toISOString() };
    setTenureRoles(prev => replaceById(prev, [stampedRole]));
    persist('Jabatan', () => saveRow('tenureRoles', stampedRole));
  };
  const handleDeleteTenureRole = (roleId: string) => {
    setTenureRoles(prev => prev.filter(r => r.id !== roleId));
    persist('Penghapusan jabatan', () => deleteRow('tenureRoles', roleId));
  };

  // Restore a backup snapshot (.json). Rows are upserted table by table in foreign-key order;
  // rows created after the backup are kept. Throws on the first failure so the caller can report it.
  const handleRestoreBackup = async (backupData: AppRecord) => {
    if (!backupData || typeof backupData !== 'object') return;
    try {
      for (const key of RESTORE_ORDER) {
        if (Array.isArray(backupData[key])) await saveRows(key, backupData[key]);
      }
      if (Array.isArray(backupData.tenures) && backupData.tenures.length > 0) {
        const targetId = backupData.meta?.activeTenureId || backupData.tenures[0].id;
        const restoredActive = backupData.tenures.find((t: AppItem) => t.id === targetId) || backupData.tenures[0];
        await saveSetting('activeTenureId', restoredActive.id);
      }
      if (backupData.announcementBar && typeof backupData.announcementBar === 'object') {
        await saveSetting('announcementBar', { ...DEFAULT_ANNOUNCEMENT_BAR, ...backupData.announcementBar });
      }
      if (backupData.pageVisibility && typeof backupData.pageVisibility === 'object') {
        await saveSetting('pageVisibility', { ...DEFAULT_PAGE_VISIBILITY, ...backupData.pageVisibility });
      }
      if (backupData.roleQuotas && typeof backupData.roleQuotas === 'object') {
        await saveSetting('roleQuotas', backupData.roleQuotas);
      }
    } finally {
      await refreshAllData();
    }
  };

  // Clear cache and reload all collections directly from database
  const handleResetDefault = async () => {
    localStorage.clear();
    await refreshAllData();
  };

  // Helper to check page visibility with alias support
  const isPageVisible = (id: string) => {
    if (id === 'event' || id === 'program') return pageVisibility.event !== false && pageVisibility.program !== false;
    if (id === 'form' || id === 'oprec') return pageVisibility.form !== false && pageVisibility.oprec !== false;
    return pageVisibility[id] !== false;
  };

  // Determine visible public pages and effective active tab
  const visiblePublicPages = PUBLIC_PAGE_IDS.filter(id => isPageVisible(id));
  const allPagesHidden = visiblePublicPages.length === 0;
  const isNavbarVisible = pageVisibility.navbar !== false;
  const isDark = theme === 'dark';

  // If currentTab is a public page that has been hidden, automatically fall back to the first visible page
  const effectiveTab = currentTab === 'admin'
    ? 'admin'
    : currentTab === 'event-stats'
      ? 'event-stats'
      : (allPagesHidden
          ? 'all-hidden'
          : (isPageVisible(currentTab)
              ? (currentTab === 'program' ? 'event' : currentTab === 'oprec' ? 'form' : currentTab)
              : visiblePublicPages[0]));

  // Per-page title, description, canonical URL and structured data
  const seoEvent = activeEventIdFromUrl ? events.find(e => e.id === activeEventIdFromUrl && e.isPublic === true) : null;
  const seoForm = activeFormIdFromUrl ? forms.find(f => f.id === activeFormIdFromUrl) : null;
  const seoGallery = activeGalleryIdFromUrl ? galleries.find(g => g.id === activeGalleryIdFromUrl) : null;
  const upcomingPublicEvents = useMemo(() => events.filter(e => e.isPublic === true && e.status !== 'Completed'), [events]);
  useDocumentMeta(buildPageMeta(effectiveTab, { event: seoEvent, form: seoForm, gallery: seoGallery, events: upcomingPublicEvents }));
  // Privacy-friendly visit counts; admins browsing the site are not counted
  useTrackPageView(effectiveTab, { enabled: adminSession.status === 'signedOut' });

  return (
    <AppNavigationContext.Provider value={navigateTo}>
    <div className="relative flex min-h-screen w-full max-w-[100vw] flex-col overflow-x-clip">

      {persistError && (
        <div role="alert" className="fixed bottom-6 left-1/2 z-[10000] flex w-[min(560px,calc(100vw-32px))] -translate-x-1/2 items-start gap-3 rounded-md border border-danger-line bg-danger-tint px-4 py-3.5 text-[0.88rem] leading-relaxed text-ink shadow-card">
          <span className="flex-1">{persistError}</span>
          <button type="button" onClick={() => setPersistError(null)} aria-label="Tutup pesan kesalahan" className="cursor-pointer border-0 bg-transparent p-0 text-inherit"><X size={18} aria-hidden="true" /></button>
        </div>
      )}

      {/* Responsive Navbar (Can be toggled View / Hide) */}
      {isNavbarVisible && (
        <SiteHeader
          currentTab={effectiveTab}
          setCurrentTab={setCurrentTab}
          tenures={tenures}
          activeTenure={activeTenure}
          onSelectTenure={handleSelectTenure}
          theme={theme}
          onToggleTheme={toggleTheme}
          forms={forms}
          pageVisibility={pageVisibility}
          onOpenQuickSearch={() => setIsQuickSearchOpen(true)}
        />
      )}

      <OfflineNotice />

      {announcementBar?.isActive && !isBannerDismissed && effectiveTab !== 'admin' && effectiveTab !== 'all-hidden' && (
        <AnnouncementBar bar={announcementBar} onCta={(tab) => setCurrentTab(tab)} onDismiss={() => setIsBannerDismissed(true)} />
      )}

      {/* Theme switch stays reachable when the navbar is hidden */}
      {!isNavbarVisible && currentTab !== 'admin' && (
        <div className="fixed bottom-5 right-5 z-[90] rounded-full border border-line bg-surface p-1.5 shadow-card">
          <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Gunakan tema terang' : 'Gunakan tema gelap'}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-line bg-field text-navy-ink">
            {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {/* At least a screen tall, so the footer starts below the fold and content loading in does not push it */}
      <main className="relative min-h-screen flex-1">
        {effectiveTab === 'all-hidden' && (
          <div className="mx-auto mb-20 mt-14 w-full max-w-[620px] px-4">
            <Card padding="lg" className="flex flex-col items-center gap-4 text-center">
              <img {...logoFor(BAPEKKRIS_LOGO, isDark)} alt="Bapekkris Bank Mandiri"
                className="h-13 w-auto object-contain"/>
              <span className="flex size-15 items-center justify-center rounded-full bg-gold-tint text-gold-ink"><EyeOff size={28} aria-hidden="true" /></span>
              <Badge tone="gold">Halaman sedang disembunyikan</Badge>
              <h2 className="font-display text-[1.65rem] font-semibold text-ink">Seluruh halaman sedang disembunyikan</h2>
              <p className="max-w-[480px] text-[0.94rem] leading-relaxed text-muted">
                Halaman publik <strong>Bapekkris Bank Mandiri</strong> sedang dinonaktifkan sementara oleh pengurus. Silakan kembali lagi nanti.
              </p>
            </Card>
          </div>
        )}

        <ErrorBoundary onResetTab={() => setCurrentTab('home')}>
          {effectiveTab === 'home' && (
            <HomePage
              activeTenure={activeTenure}
              divisions={divisions}
              events={events}
              members={members}
              setCurrentTab={setCurrentTab}
              forms={forms}
              registrationCounts={registrationCounts}
              devotions={devotions}
              faqs={faqs}
              onSubmitFaqQuestion={handleSubmitPublicFaq}
              pageVisibility={pageVisibility}
              tenureRoles={tenureRoles}
            />
          )}
        </ErrorBoundary>

        <Suspense fallback={<p role="status" className="px-5 py-20 text-center text-[0.92rem] text-muted">Memuat halaman…</p>}>
          <ErrorBoundary onResetTab={() => setCurrentTab('home')}>
            {effectiveTab === 'organisasi' && (
            <OrganizationSection
              activeTenure={activeTenure}
              tenures={tenures}
              divisions={divisions}
              subDivisions={subDivisions}
              members={members}
              events={events}
              roleQuotas={roleQuotas}
              tenureRoles={tenureRoles}
              isEventPageVisible={isPageVisible('event')}
              onNavigateProgram={isPageVisible('event') ? () => setCurrentTab('event') : undefined}
              onSelectTenure={handleSelectTenure}
            />
          )}

          {(effectiveTab === 'event' || effectiveTab === 'program') && (
            <ProgramSection
              events={events}
              divisions={divisions}
              activeTenure={activeTenure}
              tenures={tenures}
              onNavigateOprec={isPageVisible('form') ? () => setCurrentTab('form') : undefined}
              registrationCounts={registrationCounts}
              onAddEventRsvp={handleAddEventRsvp}
              initialEventId={activeEventIdFromUrl}
              onSelectEventUrl={(eId) => setCurrentTab('event', null, eId, false)}
              forms={forms}
              onNavigateForm={(fId) => setCurrentTab('form', fId)}
              onNavigateEventStats={(eId) => setCurrentTab('event-stats', null, eId)}
              galleries={galleries}
              onNavigateGallery={(gId) => setCurrentTab('galeri', null, null, true, gId)}
            />
          )}

          {effectiveTab === 'event-stats' && !isAdmin && (
            <AdminOnlyNotice
              isLoading={adminSession.status === 'loading'}
              onLogin={() => setCurrentTab('admin')}
              onBack={() => setCurrentTab('event')}
            />
          )}

          {effectiveTab === 'event-stats' && isAdmin && (
            <EventRegistrationStats
              eventId={activeEventIdFromUrl}
              events={events}
              forms={forms}
              submissions={submissions}
              eventRsvps={eventRsvps}
              luckyDraws={luckyDraws}
              onAddLuckyDraw={handleAddLuckyDraw}
              onDeleteLuckyDraw={handleDeleteLuckyDraw}
              onResetLuckyDraw={handleResetLuckyDraw}
              onBack={() => setCurrentTab('event')}
              onNavigateForm={(fId) => setCurrentTab('form', fId)}
            />
          )}

          {effectiveTab === 'galeri' && (
            <GallerySection
              galleries={galleries}
              divisions={divisions}
              events={events}
              activeTenure={activeTenure}
              tenures={tenures}
              initialGalleryId={activeGalleryIdFromUrl}
              onSelectGalleryUrl={(gId) => setCurrentTab('galeri', null, null, false, gId)}
              onNavigateEvent={(eId) => setCurrentTab('event', null, eId)}
            />
          )}

          {effectiveTab === 'renungan' && (
            <DailyDevotionSection
              devotions={devotions}
              onSendToEasyWorship={handleSendToEasyWorship}
            />
          )}

          {effectiveTab === 'alkitab' && (
            <BibleSection
              onSendToEasyWorship={handleSendToEasyWorship}
            />
          )}

          {effectiveTab === 'lagu' && (
            <WorshipSongSection
              songs={songs}
              onSendToEasyWorship={handleSendToEasyWorship}
            />
          )}

          {effectiveTab === 'doa' && <PrayerWallSection />}

          {effectiveTab === 'easyworship' && (
            <EasyWorshipSection
              songs={songs}
              initialItem={easyWorshipInitialItem}
              schedules={easyWorshipSchedules}
              onSaveSchedule={isAdmin ? handleAddEasyWorshipSchedule : undefined}
            />
          )}

          {effectiveTab === 'assets' && (
            <AssetKitSection
              theme={theme}
              brandAssets={brandAssets}
            />
          )}

          {(effectiveTab === 'form' || effectiveTab === 'oprec') && (
            <DynamicFormSection
              forms={forms}
              divisions={divisions}
              events={events}
              registrationCounts={registrationCounts}
              onSubmitSubmission={handleSubmitSubmission}
              initialFormId={activeFormIdFromUrl}
              onSelectFormUrl={(fId) => setCurrentTab('form', fId)}
              activeTenure={activeTenure}
              tenures={tenures}
            />
          )}

          {effectiveTab === 'admin' && (
            <ErrorBoundary onResetTab={() => setCurrentTab('home')}>
              <AdminPortal
                onBack={() => setCurrentTab(visiblePublicPages[0] || 'home')}
                tenures={tenures}
                activeTenure={activeTenure}
                roleQuotas={roleQuotas}
                tenureRoles={tenureRoles}
                onAddTenureRole={handleAddTenureRole}
                onUpdateTenureRole={handleUpdateTenureRole}
                onDeleteTenureRole={handleDeleteTenureRole}
                onSelectTenure={handleSelectTenure}
                onAddTenure={handleAddTenure}
                onUpdateTenure={handleUpdateTenure}
                onDeleteTenure={handleDeleteTenure}
                divisions={adminScope.divisions}
                onAddDivision={handleAddDivision}
                onUpdateDivision={handleUpdateDivision}
                onDeleteDivision={handleDeleteDivision}
                forms={adminScope.forms}
                onAddForm={handleAddForm}
                onUpdateForm={handleUpdateForm}
                onDeleteForm={handleDeleteForm}
                submissions={submissions}
                onUpdateSubmission={handleUpdateSubmission}
                onDeleteSubmission={handleDeleteSubmission}
                galleries={adminScope.galleries}
                onAddGallery={handleAddGallery}
                onUpdateGallery={handleUpdateGallery}
                onDeleteGallery={handleDeleteGallery}
                members={adminScope.members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                events={adminScope.events}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleUpdateEvent}
                onDeleteEvent={handleDeleteEvent}
                subDivisions={adminScope.subDivisions}
                onAddSubDivision={handleAddSubDivision}
                onUpdateSubDivision={handleUpdateSubDivision}
                onDeleteSubDivision={handleDeleteSubDivision}
                devotions={devotions}
                onAddDevotion={handleAddDevotion}
                onUpdateDevotion={handleUpdateDevotion}
                onDeleteDevotion={handleDeleteDevotion}
                worshipSongs={worshipSongs}
                onAddWorshipSong={handleAddWorshipSong}
                onUpdateWorshipSong={handleUpdateWorshipSong}
                onDeleteWorshipSong={handleDeleteWorshipSong}
                easyWorshipSchedules={easyWorshipSchedules}
                onDeleteEasyWorshipSchedule={handleDeleteEasyWorshipSchedule}
                brandAssets={brandAssets}
                onAddBrandAsset={handleAddBrandAsset}
                onUpdateBrandAsset={handleUpdateBrandAsset}
                onDeleteBrandAsset={handleDeleteBrandAsset}
                eventRsvps={eventRsvps}
                onDeleteEventRsvp={handleDeleteEventRsvp}
                faqs={faqs}
                onAddFaq={handleAddFaq}
                onUpdateFaq={handleUpdateFaq}
                onDeleteFaq={handleDeleteFaq}
                announcementBar={announcementBar}
                onUpdateAnnouncementBar={handleUpdateAnnouncementBar}
                pageVisibility={pageVisibility}
                onUpdatePageVisibility={setPageVisibility}
                syncStatus={syncStatus}
                onResetDefault={handleResetDefault}
                onRestoreBackup={handleRestoreBackup}
                theme={theme}
                luckyDraws={luckyDraws}
                registrationCounts={registrationCounts}
                adminSession={adminSession}
                onAdminLogin={handleAdminLogin}
                onAdminLogout={handleAdminLogout}
              />
            </ErrorBoundary>
          )}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* GLOBAL QUICK SEARCH MODAL (Ctrl+K / Tombol Cari di Navbar) */}
      {isQuickSearchOpen && (
        <QuickSearch query={quickSearchQuery} onQueryChange={setQuickSearchQuery} onClose={() => setIsQuickSearchOpen(false)}
          onNavigate={(tab, formId, eventId, galleryId) => setCurrentTab(tab, formId ?? null, eventId ?? null, true, galleryId ?? null)} isPageVisible={isPageVisible}
          data={{ members, events, forms, galleries, brandAssets, devotions, worshipSongs, faqs, tenureRoles, divisions }} />
      )}

      {/* Clean Footer */}
      <SiteFooter theme={theme} pageVisibility={pageVisibility} setCurrentTab={setCurrentTab} />
    </div>
    </AppNavigationContext.Provider>
  );
}
