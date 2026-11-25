import { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { EyeOff, Sun, Moon, Search, X, Users, Calendar, ClipboardList, Download, ChevronRight } from 'lucide-react';
import StarfieldBackground from './components/StarfieldBackground';
import Navbar from './components/Navbar';
import HomeSection from './components/HomeSection';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';

const OrganizationSection = lazy(() => import('./components/OrganizationSection'));
const ProgramSection = lazy(() => import('./components/ProgramSection'));
const GallerySection = lazy(() => import('./components/GallerySection'));
const DailyDevotionSection = lazy(() => import('./components/DailyDevotionSection'));
const BibleSection = lazy(() => import('./components/BibleSection'));
const WorshipSongSection = lazy(() => import('./components/WorshipSongSection'));
const EasyWorshipSection = lazy(() => import('./components/EasyWorshipSection'));
const ProjectorDisplay = lazy(() => import('./components/ProjectorDisplay'));
const AssetKitSection = lazy(() => import('./components/AssetKitSection'));
const DynamicFormSection = lazy(() => import('./components/DynamicFormSection'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const EventRegistrationStats = lazy(() => import('./components/EventRegistrationStats'));

const DEFAULT_ANNOUNCEMENT_BAR = {
  badge: '',
  message: '',
  ctaText: '',
  ctaTab: 'home',
  isActive: false,
};
import {
  supabase,
  loadLocalCache,
  fetchAllCloudState,
  insertRow,
  insertRows,
  saveRow,
  saveRows,
  deleteRow,
  deleteRowsWhere,
  saveSetting,
  deleteMediaFromCloud
} from './lib/supabase';
import { formatDeadlineWib, isEventPassed } from './utils/dateUtils';
import { getDivisionLead, getCategoryFromLevel } from './utils/memberQuotaUtils';

const CLOUD_POLL_INTERVAL_MS = 60000;
const REALTIME_DEBOUNCE_MS = 1000;

// Parents are restored before children so foreign keys always resolve.
const RESTORE_ORDER = [
  'tenures', 'tenureRoles', 'divisions', 'subDivisions', 'members', 'events', 'forms',
  'submissions', 'eventRsvps', 'luckyDraws', 'galleries', 'devotions', 'worshipSongs',
  'easyWorshipSchedules', 'brandAssets', 'faqs'
];

function replaceById(list, updates) {
  if (updates.length === 0) return list;
  const byId = new Map(updates.map(item => [item.id, item]));
  return list.map(item => byId.get(item.id) || item);
}

// Member category (pembina, inti, pimpro, anggota, ...) follows the level of the member's role.
function withMemberCategories(members, roles) {
  return members.map(m => {
    const role = roles.find(r => r.id === m.roleId);
    return role ? { ...m, category: getCategoryFromLevel(role.level) } : m;
  });
}

function withDerivedEventStatus(event) {
  return event.status !== 'Completed' && isEventPassed(event.startDate, event.endDate)
    ? { ...event, status: 'Completed' }
    : event;
}

function getSubmissionFileUrls(files) {
  if (!files || typeof files !== 'object') return [];
  return Object.values(files)
    .map(f => (typeof f === 'string' ? f : (f?.dataUrl || f?.url || f?.fileUrl || '')))
    .filter(Boolean);
}

// Returns the other forms currently connected to an event, disconnected from it.
function detachFormsFromEvent(forms, eventId, exceptFormId, updatedAt) {
  return forms
    .filter(f => {
      if (f.id === exceptFormId) return false;
      const isSameEvent = String(f.eventId || f.fields?.[0]?._eventId) === String(eventId);
      const isConnected = f.isEventConnected || f.fields?.[0]?._isEventConnected;
      return isSameEvent && isConnected;
    })
    .map(f => ({
      ...f,
      isEventConnected: false,
      eventId: '',
      isLuckyDraw: false,
      fields: Array.isArray(f.fields)
        ? f.fields.map((fld, idx) => (idx === 0 ? { ...fld, _isEventConnected: false, _eventId: '', _isLuckyDraw: false } : fld))
        : f.fields,
      updatedAt
    }));
}

const PUBLIC_PAGE_IDS = ['home', 'organisasi', 'event', 'renungan', 'alkitab', 'lagu', 'easyworship', 'galeri', 'assets', 'form'];
const VALID_TABS = [...PUBLIC_PAGE_IDS, 'program', 'oprec', 'admin', 'event-stats', 'projector'];

function parseLocationRoute() {
  const rawHash = (window.location.hash || '').replace(/^#/, '');
  const [hashTab, hashQuery] = rawHash.split('?');
  const params = new URLSearchParams(hashQuery || window.location.search || '');
  const formId = params.get('form') || params.get('formId') || null;
  const eventId = params.get('eventId') || params.get('event') || null;
  const galleryId = params.get('gallery') || params.get('galleryId') || null;
  const statsParam = params.get('stats') || params.get('statsEventId') || null;
  const pathname = (window.location.pathname || '').replace(/\/+$/, '');

  if (pathname === '/admin' || hashTab === 'admin') {
    return { tab: 'admin', formId, eventId, galleryId };
  }
  if (statsParam || hashTab === 'event-stats') {
    return { tab: 'event-stats', formId: null, eventId: statsParam || eventId, galleryId: null };
  }
  if (formId) {
    return { tab: 'form', formId, eventId: null, galleryId: null };
  }
  if (eventId) {
    return { tab: 'event', formId: null, eventId, galleryId: null };
  }
  if (galleryId) {
    return { tab: 'galeri', formId: null, eventId: null, galleryId };
  }
  if (hashTab) {
    if (hashTab === 'program' || hashTab === 'event') {
      return { tab: 'event', formId, eventId, galleryId };
    }
    if (hashTab === 'oprec' || hashTab === 'form') {
      return { tab: 'form', formId, eventId, galleryId };
    }
    if (VALID_TABS.includes(hashTab)) {
      return { tab: hashTab, formId, eventId, galleryId };
    }
  }
  return { tab: 'home', formId: null, eventId: null, galleryId: null };
}

const DEFAULT_PAGE_VISIBILITY = {
  navbar: true,
  home: true,
  organisasi: true,
  event: true,
  program: true,
  renungan: true,
  alkitab: true,
  lagu: true,
  easyworship: true,
  galeri: true,
  assets: true,
  form: true,
  oprec: true
};

// Helper to consistently sort tenures descending by year (e.g. 2028 -> 2027 -> 2026)
const sortTenuresDesc = (list = []) => {
  return [...list].sort((a, b) => {
    const numA = parseInt(a.code || a.id?.replace(/\D/g, '') || '0', 10);
    const numB = parseInt(b.code || b.id?.replace(/\D/g, '') || '0', 10);
    if (numB !== numA) return numB - numA;
    return (b.title || '').localeCompare(a.title || '');
  });
};

export default function App() {
  const isProjectorMode = typeof window !== 'undefined' && (window.location.hash === '#projector' || new URLSearchParams(window.location.search).get('mode') === 'projector');
  if (isProjectorMode) {
    return (
      <Suspense fallback={<div style={{ background: '#000', color: '#fff', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Memuat Display Projector Bapekkris...</div>}>
        <ProjectorDisplay />
      </Suspense>
    );
  }
  // Navigation: 'home' | 'organisasi' | 'event' | 'renungan' | 'alkitab' | 'lagu' | 'easyworship' | 'galeri' | 'assets' | 'form' | 'admin'
  const [currentTab, setCurrentTabState] = useState(() => parseLocationRoute().tab);
  const [activeFormIdFromUrl, setActiveFormIdFromUrl] = useState(() => parseLocationRoute().formId);
  const [activeEventIdFromUrl, setActiveEventIdFromUrl] = useState(() => parseLocationRoute().eventId);
  const [activeGalleryIdFromUrl, setActiveGalleryIdFromUrl] = useState(() => parseLocationRoute().galleryId);

  const setCurrentTab = useCallback((nextTab, formIdParam = null, eventIdParam = null, shouldScroll = true, galleryIdParam = null) => {
    let targetTab = nextTab;
    if (targetTab === 'program') targetTab = 'event';
    if (targetTab === 'oprec') targetTab = 'form';
    if (!VALID_TABS.includes(targetTab)) targetTab = 'home';

    setCurrentTabState(targetTab);
    const isPathAdmin = (window.location.pathname || '').replace(/\/+$/, '') === '/admin';
    const basePrefix = isPathAdmin ? '/' : '';

    if (formIdParam) {
      setActiveFormIdFromUrl(formIdParam);
      setActiveEventIdFromUrl(null);
      setActiveGalleryIdFromUrl(null);
      window.history.replaceState(null, '', `${basePrefix}?form=${encodeURIComponent(formIdParam)}#form`);
    } else if (targetTab === 'event-stats' || eventIdParam) {
      if (targetTab === 'event-stats') {
        setActiveEventIdFromUrl(eventIdParam);
        setActiveFormIdFromUrl(null);
        setActiveGalleryIdFromUrl(null);
        window.history.replaceState(null, '', `${basePrefix}?stats=${encodeURIComponent(eventIdParam || '')}#event-stats`);
      } else {
        setActiveEventIdFromUrl(eventIdParam);
        setActiveFormIdFromUrl(null);
        setActiveGalleryIdFromUrl(null);
        window.history.replaceState(null, '', `${basePrefix}?event=${encodeURIComponent(eventIdParam)}#event`);
      }
    } else if (galleryIdParam) {
      setActiveGalleryIdFromUrl(galleryIdParam);
      setActiveFormIdFromUrl(null);
      setActiveEventIdFromUrl(null);
      window.history.replaceState(null, '', `${basePrefix}?gallery=${encodeURIComponent(galleryIdParam)}#galeri`);
    } else {
      setActiveFormIdFromUrl(null);
      setActiveEventIdFromUrl(null);
      setActiveGalleryIdFromUrl(null);
      if (targetTab === 'admin') {
        window.history.replaceState(null, '', isPathAdmin ? '/admin' : '#admin');
      } else {
        window.history.replaceState(null, '', `${basePrefix}#${targetTab}`);
      }
    }
    if (shouldScroll) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Page & Navbar Visibility State (View / Hide per page & navbar)
  const [pageVisibility, setPageVisibilityState] = useState(() => {
    const cached = loadLocalCache('pageVisibility', null);
    if (cached && typeof cached === 'object') {
      return { ...DEFAULT_PAGE_VISIBILITY, ...cached };
    }
    try {
      const legacy = localStorage.getItem('bapekkris_page_visibility');
      if (legacy) {
        return { ...DEFAULT_PAGE_VISIBILITY, ...JSON.parse(legacy) };
      }
    } catch (e) {}
    return DEFAULT_PAGE_VISIBILITY;
  });

  // Default theme is LIGHT THEME as requested
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('bapekkris_theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bapekkris_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleHash = () => {
      const parsed = parseLocationRoute();
      setCurrentTabState(parsed.tab);
      setActiveFormIdFromUrl(parsed.formId);
      setActiveEventIdFromUrl(parsed.eventId);
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);
    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Master Dynamic States (Loaded from LocalCache immediately + Synced with Supabase Cloud)
  const [tenures, setTenures] = useState(() => sortTenuresDesc(loadLocalCache('tenures', [])));
  const [activeTenure, setActiveTenure] = useState(() => {
    const savedTenures = sortTenuresDesc(loadLocalCache('tenures', []));
    const savedActiveId = loadLocalCache('activeTenureId', null);
    if (savedActiveId && Array.isArray(savedTenures)) {
      const found = savedTenures.find(t => t.id === savedActiveId);
      if (found) return found;
    }
    return (Array.isArray(savedTenures) ? savedTenures.find(t => t.isActive) || savedTenures[0] : null) || null;
  });
  const [divisions, setDivisions] = useState(() => {
    const cachedDivs = loadLocalCache('divisions', []);
    const cachedMems = loadLocalCache('members', []);
    const cachedRoles = loadLocalCache('tenureRoles', []);
    return (cachedDivs || []).map(d => {
      const lead = getDivisionLead(d, cachedMems || [], cachedRoles || []);
      return {
        ...d,
        memberId: lead.member ? lead.member.id : (d.memberId || null),
        leadName: lead.name || (d.leadName || '')
      };
    });
  });
  const [tenureRoles, setTenureRoles] = useState(() => {
    const cached = loadLocalCache('tenureRoles', null);
    if (Array.isArray(cached)) return cached;
    return [];
  });
  const [members, setMembers] = useState(() => withMemberCategories(loadLocalCache('members', []), loadLocalCache('tenureRoles', [])));
  const [events, setEvents] = useState(() => loadLocalCache('events', []));
  const [galleries, setGalleries] = useState(() => loadLocalCache('galleries', []));
  const [subDivisions, setSubDivisions] = useState(() => loadLocalCache('subDivisions', []));
  const [devotions, setDevotions] = useState(() => loadLocalCache('devotions', []));
  const [worshipSongs, setWorshipSongs] = useState(() => loadLocalCache('worshipSongs', []));
  const [easyWorshipSchedules, setEasyWorshipSchedules] = useState(() => loadLocalCache('easyWorshipSchedules', []));
  const [easyWorshipInitialItem, setEasyWorshipInitialItem] = useState(null);
  const [forms, setForms] = useState(() => loadLocalCache('forms', []));
  const [submissions, setSubmissions] = useState(() => loadLocalCache('submissions', []));
  const [brandAssets, setBrandAssets] = useState(() => loadLocalCache('brandAssets', []));
  const [eventRsvps, setEventRsvps] = useState(() => loadLocalCache('eventRsvps', []));
  const [faqs, setFaqs] = useState(() => loadLocalCache('faqs', []));
  const [luckyDraws, setLuckyDraws] = useState(() => loadLocalCache('luckyDraws', []));
  const [announcementBar, setAnnouncementBar] = useState(() => loadLocalCache('announcementBar', DEFAULT_ANNOUNCEMENT_BAR));
  const [roleQuotas, setRoleQuotas] = useState(() => loadLocalCache('roleQuotas', {}));
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [quickSearchQuery, setQuickSearchQuery] = useState('');

  // Global keyboard shortcut Ctrl+K / Cmd+K for Quick Search
  useEffect(() => {
    const handleKeyDown = (e) => {
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

  const [persistError, setPersistError] = useState(null);

  // Latest values read by the stable sync callback (avoids stale closures).
  const latestStateRef = useRef({ members, divisions, tenureRoles });
  latestStateRef.current = { members, divisions, tenureRoles };
  const syncSeqRef = useRef(0);

  // Pull & Reconcile Cloud State across devices. Never writes back to the database.
  const syncFromCloud = useCallback(async () => {
    const seq = ++syncSeqRef.current;
    setSyncStatus('syncing');
    const cloud = await fetchAllCloudState();
    // A newer sync started meanwhile; its response supersedes this one.
    if (seq !== syncSeqRef.current) return;

    const latest = latestStateRef.current;
    const currentRoles = cloud.tenureRoles || latest.tenureRoles;
    const currentMembers = cloud.members ? withMemberCategories(cloud.members, currentRoles) : latest.members;
    const currentDivs = cloud.divisions || latest.divisions;

    if (cloud.tenures) {
      const sortedTenures = sortTenuresDesc(cloud.tenures);
      const targetId = cloud.activeTenureId || loadLocalCache('activeTenureId', null);
      const defaultActive = sortedTenures.find(t => t.id === targetId) || sortedTenures.find(t => t.isActive) || sortedTenures[0] || null;
      // Enforce strict single active tenure exclusivity
      const normalizedTenures = sortedTenures.map(t => ({ ...t, isActive: Boolean(defaultActive) && t.id === defaultActive.id }));
      setTenures(normalizedTenures);
      // Preserve user's current browsing selection if still valid, otherwise fall back to the official active tenure
      setActiveTenure(curr => {
        if (!defaultActive) return null;
        const stillExists = curr && normalizedTenures.find(t => t.id === curr.id);
        return stillExists || { ...defaultActive, isActive: true };
      });
    }
    if (cloud.members) setMembers(currentMembers);
    if (cloud.divisions) {
      setDivisions(cloud.divisions.map(d => {
        const lead = getDivisionLead(d, currentMembers, currentRoles);
        return {
          ...d,
          memberId: lead.member ? lead.member.id : (d.memberId || null),
          leadName: lead.name || (d.leadName || '')
        };
      }));
    }
    if (cloud.events) {
      setEvents(cloud.events.map(e => {
        const divObj = currentDivs.find(d => d.id === e.divisionId) || currentDivs.find(d => d.name === e.divisionName);
        return {
          ...withDerivedEventStatus(e),
          divisionId: e.divisionId || divObj?.id,
          divisionName: divObj?.name || e.divisionName || 'Bapekkris Bank Mandiri'
        };
      }));
    }
    if (cloud.galleries) {
      setGalleries(cloud.galleries.map(g => {
        const matchedDiv = currentDivs.find(d => d.id === g.divisionId) || currentDivs.find(d => d.name === g.division);
        const resolvedName = matchedDiv?.name || g.divisionName || g.division || 'Bapekkris Bank Mandiri';
        return { ...g, divisionId: g.divisionId || matchedDiv?.id, division: resolvedName, divisionName: resolvedName };
      }));
    }
    if (cloud.subDivisions) setSubDivisions(cloud.subDivisions);
    if (cloud.devotions) setDevotions(cloud.devotions);
    if (cloud.worshipSongs) setWorshipSongs(cloud.worshipSongs);
    if (cloud.easyWorshipSchedules) setEasyWorshipSchedules(cloud.easyWorshipSchedules);
    if (cloud.forms) setForms(cloud.forms);
    if (cloud.submissions) setSubmissions(cloud.submissions);
    if (cloud.brandAssets) setBrandAssets(cloud.brandAssets);
    if (cloud.eventRsvps) setEventRsvps(cloud.eventRsvps);
    if (cloud.tenureRoles) setTenureRoles(cloud.tenureRoles);
    if (cloud.faqs) setFaqs(cloud.faqs);
    if (cloud.luckyDraws) setLuckyDraws(cloud.luckyDraws);
    if (cloud.announcementBar && typeof cloud.announcementBar === 'object') {
      setAnnouncementBar({ ...DEFAULT_ANNOUNCEMENT_BAR, ...cloud.announcementBar });
    }
    if (cloud.pageVisibility && typeof cloud.pageVisibility === 'object') {
      const mergedVis = { ...DEFAULT_PAGE_VISIBILITY, ...cloud.pageVisibility };
      setPageVisibilityState(mergedVis);
      try { localStorage.setItem('bapekkris_page_visibility', JSON.stringify(mergedVis)); } catch (e) { /* storage unavailable */ }
    }
    if (cloud.roleQuotas && typeof cloud.roleQuotas === 'object') {
      setRoleQuotas(cloud.roleQuotas);
    }
    setSyncStatus(cloud.failed.length > 0 ? 'error' : 'synced');
  }, []);

  // Runs a database write for an optimistic UI change. On failure the user is informed
  // and local state is reloaded from the server so the screen never shows unsaved data.
  const persist = useCallback(async (label, task) => {
    try {
      await task();
      return true;
    } catch (err) {
      console.error(err);
      setPersistError(`${label} gagal disimpan ke server (${err.message}). Data dimuat ulang dari server.`);
      syncFromCloud();
      return false;
    }
  }, [syncFromCloud]);

  const handleUpdateRoleQuotas = async (updatedQuotas) => {
    setRoleQuotas(updatedQuotas);
    await persist('Kuota jabatan', () => saveSetting('roleQuotas', updatedQuotas));
  };

  useEffect(() => {
    syncFromCloud();

    const onFocus = () => syncFromCloud();
    window.addEventListener('focus', onFocus);

    // Safety-net polling; realtime events below are the primary update signal.
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') syncFromCloud();
    }, CLOUD_POLL_INTERVAL_MS);

    // Debounced so a burst of row changes triggers a single reload.
    let realtimeTimer;
    let channel;
    try {
      channel = supabase
        .channel('bapekkris-cloud-sync-live')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          clearTimeout(realtimeTimer);
          realtimeTimer = setTimeout(syncFromCloud, REALTIME_DEBOUNCE_MS);
        })
        .subscribe();
    } catch (e) {
      console.error('Realtime subscription failed:', e);
    }

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(intervalId);
      clearTimeout(realtimeTimer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [syncFromCloud]);

  const setPageVisibility = (nextVis) => {
    const resolved = typeof nextVis === 'function' ? nextVis(pageVisibility) : nextVis;
    const now = new Date().toISOString();

    // Check what was toggled to reliably sync dual keys (event/program, form/oprec)
    let targetEvent = pageVisibility.event !== false && pageVisibility.program !== false;
    if (resolved.event !== undefined && resolved.event !== pageVisibility.event) {
      targetEvent = resolved.event;
    } else if (resolved.program !== undefined && resolved.program !== pageVisibility.program) {
      targetEvent = resolved.program;
    } else if (resolved.event !== undefined) {
      targetEvent = resolved.event;
    } else if (resolved.program !== undefined) {
      targetEvent = resolved.program;
    }

    let targetForm = pageVisibility.form !== false && pageVisibility.oprec !== false;
    if (resolved.form !== undefined && resolved.form !== pageVisibility.form) {
      targetForm = resolved.form;
    } else if (resolved.oprec !== undefined && resolved.oprec !== pageVisibility.oprec) {
      targetForm = resolved.oprec;
    } else if (resolved.form !== undefined) {
      targetForm = resolved.form;
    } else if (resolved.oprec !== undefined) {
      targetForm = resolved.oprec;
    }

    const merged = {
      ...DEFAULT_PAGE_VISIBILITY,
      ...resolved,
      event: targetEvent,
      program: targetEvent,
      form: targetForm,
      oprec: targetForm,
      _updatedAt: now
    };

    setPageVisibilityState(merged);
    try { localStorage.setItem('bapekkris_page_visibility', JSON.stringify(merged)); } catch (e) { /* storage unavailable */ }
    persist('Pengaturan tampilan halaman', () => saveSetting('pageVisibility', merged));
  };

  // Visitor / Admin local view mode (filters the page display without mutating the official active tenure in database)
  const handleSelectTenure = (tenureObj) => {
    setActiveTenure(tenureObj);
  };

  // Mark events whose schedule has passed as Completed for display only.
  // The stored status is left untouched, so visitors never write to the database.
  useEffect(() => {
    if (events.some(e => e.status !== 'Completed' && isEventPassed(e.startDate, e.endDate))) {
      setEvents(prev => prev.map(withDerivedEventStatus));
    }
  }, [events]);

  // Divisions
  const handleAddDivision = (newDiv) => {
    const pimpro = newDiv.memberId ? members.find(m => m.id === newDiv.memberId) : null;
    const now = new Date().toISOString();
    const finalDiv = {
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
  const handleUpdateDivision = (updatedDiv) => {
    const pimpro = updatedDiv.memberId ? members.find(m => m.id === updatedDiv.memberId) : null;
    const finalDiv = {
      ...updatedDiv,
      leadName: pimpro ? pimpro.name : updatedDiv.leadName,
      updatedAt: new Date().toISOString()
    };

    // Keep the linked Pimpro pointing at this division, or sync the Pimpro name from the division lead name.
    let memberUpdates = [];
    if (finalDiv.memberId) {
      if (pimpro && pimpro.divisionId !== finalDiv.id) memberUpdates = [{ ...pimpro, divisionId: finalDiv.id }];
    } else if (finalDiv.leadName) {
      memberUpdates = members
        .filter(m => m.category === 'pimpro' && m.divisionId === finalDiv.id && m.name !== finalDiv.leadName)
        .map(m => ({ ...m, name: finalDiv.leadName }));
    }

    // Galleries matched only by the old division name get linked by id.
    let galleryUpdates = [];
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
  const handleDeleteDivision = (divId) => {
    const targetDiv = divisions.find(d => d.id === divId);
    // Defense-in-depth safety checks: do not delete division if members, events, or galleries still depend on it
    const hasMem = members.some(m => m.divisionId === divId);
    const hasEvt = events.some(e => e.divisionId === divId);
    const hasGal = galleries.some(g => g.divisionId === divId || (targetDiv && g.division === targetDiv.name));
    if (hasMem || hasEvt || hasGal) return;

    setDivisions(prev => prev.filter(d => d.id !== divId));
    persist('Penghapusan divisi', () => deleteRow('divisions', divId));
  };

  // Tenures
  const handleAddTenure = (newTenure) => {
    const now = new Date().toISOString();
    const stampedTenure = { ...newTenure, createdAt: newTenure.createdAt || now, updatedAt: newTenure.updatedAt || now };
    const isActivating = Boolean(stampedTenure.isActive);
    const deactivated = isActivating ? tenures.filter(t => t.isActive).map(t => ({ ...t, isActive: false, updatedAt: now })) : [];

    setTenures(prev => sortTenuresDesc([...replaceById(prev, deactivated), stampedTenure]));
    if (isActivating) setActiveTenure(stampedTenure);
    persist('Periode kepengurusan', async () => {
      await saveRows('tenures', [stampedTenure, ...deactivated]);
      if (isActivating) await saveSetting('activeTenureId', stampedTenure.id);
    });
  };
  const handleUpdateTenure = (updatedTenure) => {
    const now = new Date().toISOString();
    const stampedTenure = { ...updatedTenure, updatedAt: now };
    const isActivating = Boolean(stampedTenure.isActive);
    // Strict exclusivity: when a tenure becomes active, all other tenures must become inactive
    const deactivated = isActivating
      ? tenures.filter(t => t.id !== stampedTenure.id && t.isActive).map(t => ({ ...t, isActive: false, updatedAt: now }))
      : [];

    setTenures(prev => sortTenuresDesc(replaceById(prev, [stampedTenure, ...deactivated])));
    if (isActivating || activeTenure?.id === stampedTenure.id) setActiveTenure(stampedTenure);
    persist('Periode kepengurusan', async () => {
      await saveRows('tenures', [stampedTenure, ...deactivated]);
      if (isActivating) await saveSetting('activeTenureId', stampedTenure.id);
    });
  };
  const handleDeleteTenure = (tenureId) => {
    // Defense-in-depth safety checks: do not delete if only 1 tenure, active, or has dependencies
    if (tenures.length <= 1) return;
    if (activeTenure?.id === tenureId) return;
    const hasDiv = divisions.some(d => d.tenureId === tenureId);
    const hasMem = members.some(m => m.tenureId === tenureId);
    const hasEvt = events.some(e => e.tenureId === tenureId);
    const hasGal = galleries.some(g => g.tenureId === tenureId);
    if (hasDiv || hasMem || hasEvt || hasGal) return;

    setTenures(prev => prev.filter(t => t.id !== tenureId));
    persist('Penghapusan periode kepengurusan', () => deleteRow('tenures', tenureId));
  };

  // Galleries
  const handleAddGallery = (newGal) => {
    const now = new Date().toISOString();
    const stampedGal = { ...newGal, createdAt: newGal.createdAt || now, updatedAt: newGal.updatedAt || now };
    setGalleries(prev => [stampedGal, ...prev]);
    persist('Galeri', () => saveRow('galleries', stampedGal));
  };
  const handleUpdateGallery = async (updatedGal) => {
    const oldGal = galleries.find(g => g.id === updatedGal.id);
    const currentPhotos = Array.isArray(updatedGal.photos) ? updatedGal.photos : [];
    const removedPhotos = (oldGal?.photos || []).filter(p => !currentPhotos.includes(p));
    const stampedGal = { ...updatedGal, updatedAt: new Date().toISOString() };

    setGalleries(prev => replaceById(prev, [stampedGal]));
    if (await persist('Galeri', () => saveRow('galleries', stampedGal))) {
      removedPhotos.forEach(deleteMediaFromCloud);
    }
  };
  const handleDeleteGallery = async (galId) => {
    const target = galleries.find(g => g.id === galId);
    setGalleries(prev => prev.filter(g => g.id !== galId));
    if (await persist('Penghapusan galeri', () => deleteRow('galleries', galId))) {
      (target?.photos || []).forEach(deleteMediaFromCloud);
    }
  };

  // Members. Division lead links (memberId / leadName) are derived locally and not stored on divisions.
  const linkPimproToDivision = (member) => {
    if (member.category !== 'pimpro' || !member.divisionId) return;
    setDivisions(prev => prev.map(d => (
      d.id === member.divisionId ? { ...d, memberId: member.id, leadName: member.name || d.leadName } : d
    )));
  };
  const handleAddMember = (newMem) => {
    const now = new Date().toISOString();
    const stampedMem = { ...newMem, createdAt: newMem.createdAt || now, updatedAt: newMem.updatedAt || now };
    setMembers(prev => [...prev, stampedMem]);
    linkPimproToDivision(stampedMem);
    persist('Pengurus', () => saveRow('members', stampedMem));
  };
  const handleUpdateMember = async (updatedMem) => {
    const oldImage = members.find(m => m.id === updatedMem.id)?.image;
    const stampedMem = { ...updatedMem, updatedAt: new Date().toISOString() };
    setMembers(prev => replaceById(prev, [stampedMem]));
    linkPimproToDivision(stampedMem);
    if (await persist('Pengurus', () => saveRow('members', stampedMem))) {
      if (oldImage && oldImage !== stampedMem.image) deleteMediaFromCloud(oldImage);
    }
  };
  const handleDeleteMember = async (memId) => {
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
  const handleAddEvent = (newEvt) => {
    const now = new Date().toISOString();
    const stampedEvt = { ...newEvt, createdAt: newEvt.createdAt || now, updatedAt: newEvt.updatedAt || now };
    setEvents(prev => [...prev, stampedEvt]);
    persist('Acara', () => saveRow('events', stampedEvt));
  };
  const handleUpdateEvent = (updatedEvt) => {
    const stampedEvt = { ...updatedEvt, updatedAt: new Date().toISOString() };
    setEvents(prev => replaceById(prev, [stampedEvt]));
    persist('Acara', () => saveRow('events', stampedEvt));
  };
  const handleDeleteEvent = (evtId) => {
    // Defense-in-depth safety check: do not delete event if RSVP records still exist
    if (eventRsvps.some(r => r.eventId === evtId)) return;
    setEvents(prev => prev.filter(e => e.id !== evtId));
    persist('Penghapusan acara', () => deleteRow('events', evtId));
  };

  // Dynamic Forms. A form connected to an event takes over that event from any previously connected form (one-to-one).
  const saveFormWithEventTakeover = (stampedForm, isNew) => {
    const detached = stampedForm.isEventConnected && stampedForm.eventId
      ? detachFormsFromEvent(forms, stampedForm.eventId, stampedForm.id, stampedForm.updatedAt)
      : [];
    setForms(prev => {
      const updated = replaceById(prev, isNew ? detached : [stampedForm, ...detached]);
      return isNew ? [stampedForm, ...updated] : updated;
    });
    persist('Formulir', () => saveRows('forms', [stampedForm, ...detached]));
  };
  const handleAddForm = (newForm) => {
    const now = new Date().toISOString();
    saveFormWithEventTakeover({ ...newForm, createdAt: newForm.createdAt || now, updatedAt: newForm.updatedAt || now }, true);
  };
  const handleUpdateForm = (updatedForm) => {
    saveFormWithEventTakeover({ ...updatedForm, updatedAt: new Date().toISOString() }, false);
  };
  // Deleting a form removes its submissions as well (database cascade), including their uploaded files.
  const handleDeleteForm = async (formId) => {
    const removedSubs = submissions.filter(s => s.formId === formId);
    setForms(prev => prev.filter(f => f.id !== formId));
    setSubmissions(prev => prev.filter(s => s.formId !== formId));
    if (await persist('Penghapusan formulir', () => deleteRow('forms', formId))) {
      removedSubs.flatMap(s => getSubmissionFileUrls(s.files)).forEach(deleteMediaFromCloud);
    }
  };

  // Submissions. Public submissions are inserted as single rows and only shown as successful once stored.
  const handleSubmitSubmission = async (newSub) => {
    const withStatus = { status: 'Submitted', adminNotes: '', ...newSub };
    await insertRow('submissions', withStatus);
    setSubmissions(prev => [withStatus, ...prev.filter(s => s.id !== withStatus.id)]);
  };
  const handleUpdateSubmission = async (updatedSub) => {
    const oldUrls = getSubmissionFileUrls(submissions.find(s => s.id === updatedSub.id)?.files);
    const newUrls = getSubmissionFileUrls(updatedSub.files);
    const stampedSub = { ...updatedSub, updatedAt: new Date().toISOString() };
    setSubmissions(prev => replaceById(prev, [stampedSub]));
    if (await persist('Data pendaftaran', () => saveRow('submissions', stampedSub))) {
      oldUrls.filter(url => !newUrls.includes(url)).forEach(deleteMediaFromCloud);
    }
  };
  const handleDeleteSubmission = async (subId) => {
    const fileUrls = getSubmissionFileUrls(submissions.find(s => s.id === subId)?.files);
    setSubmissions(prev => prev.filter(s => s.id !== subId));
    if (await persist('Penghapusan data pendaftaran', () => deleteRow('submissions', subId))) {
      fileUrls.forEach(deleteMediaFromCloud);
    }
  };

  // Lucky Draw
  const handleAddLuckyDraw = useCallback((newDraws) => {
    const draws = Array.isArray(newDraws) ? newDraws : [newDraws];
    setLuckyDraws(prev => [...draws, ...prev]);
    persist('Hasil undian', () => insertRows('luckyDraws', draws));
  }, [persist]);
  const handleDeleteLuckyDraw = useCallback((id) => {
    setLuckyDraws(prev => prev.filter(ld => ld.id !== id));
    persist('Penghapusan pemenang undian', () => deleteRow('luckyDraws', id));
  }, [persist]);
  const handleResetLuckyDraw = useCallback((eventId) => {
    setLuckyDraws(prev => prev.filter(ld => ld.eventId !== eventId));
    persist('Reset undian', () => deleteRowsWhere('luckyDraws', 'event_id', eventId));
  }, [persist]);

  // Brand Assets
  const handleAddBrandAsset = (newAsset) => {
    const now = new Date().toISOString();
    const stampedAsset = { ...newAsset, createdAt: newAsset.createdAt || now, updatedAt: newAsset.updatedAt || now };
    setBrandAssets(prev => [...prev, stampedAsset]);
    persist('Aset brand', () => saveRow('brandAssets', stampedAsset));
  };
  const handleUpdateBrandAsset = async (updatedAsset) => {
    const oldAsset = brandAssets.find(a => a.id === updatedAsset.id);
    const stampedAsset = { ...updatedAsset, updatedAt: new Date().toISOString() };
    setBrandAssets(prev => replaceById(prev, [stampedAsset]));
    if (!(await persist('Aset brand', () => saveRow('brandAssets', stampedAsset))) || !oldAsset) return;
    // Remove replaced files only when they are no longer referenced by either field
    const stillUsed = [updatedAsset.fileUrl, updatedAsset.previewUrl];
    if (oldAsset.fileUrl && !stillUsed.includes(oldAsset.fileUrl)) deleteMediaFromCloud(oldAsset.fileUrl);
    if (oldAsset.previewUrl && oldAsset.previewUrl !== oldAsset.fileUrl && !stillUsed.includes(oldAsset.previewUrl)) {
      deleteMediaFromCloud(oldAsset.previewUrl);
    }
  };
  const handleDeleteBrandAsset = async (assetId) => {
    const targetAsset = brandAssets.find(a => a.id === assetId);
    setBrandAssets(prev => prev.filter(a => a.id !== assetId));
    if (!(await persist('Penghapusan aset brand', () => deleteRow('brandAssets', assetId))) || !targetAsset) return;
    if (targetAsset.fileUrl) deleteMediaFromCloud(targetAsset.fileUrl);
    if (targetAsset.previewUrl && targetAsset.previewUrl !== targetAsset.fileUrl) deleteMediaFromCloud(targetAsset.previewUrl);
  };

  const handleSendToEasyWorship = (item) => {
    setEasyWorshipInitialItem(item);
    setCurrentTab('easyworship');
  };

  // Sub-divisions
  const handleAddSubDivision = async (newSub) => {
    setSubDivisions(prev => [...prev, newSub]);
    await persist('Sub-divisi', () => saveRow('subDivisions', newSub));
  };
  const handleUpdateSubDivision = async (updatedSub) => {
    setSubDivisions(prev => replaceById(prev, [updatedSub]));
    await persist('Sub-divisi', () => saveRow('subDivisions', updatedSub));
  };
  const handleDeleteSubDivision = async (subId) => {
    setSubDivisions(prev => prev.filter(s => s.id !== subId));
    await persist('Penghapusan sub-divisi', () => deleteRow('subDivisions', subId));
  };

  // Daily devotions
  const handleAddDevotion = async (newDev) => {
    setDevotions(prev => [newDev, ...prev]);
    await persist('Renungan', () => saveRow('devotions', newDev));
  };
  const handleUpdateDevotion = async (updatedDev) => {
    setDevotions(prev => replaceById(prev, [updatedDev]));
    await persist('Renungan', () => saveRow('devotions', updatedDev));
  };
  const handleDeleteDevotion = async (devId) => {
    setDevotions(prev => prev.filter(d => d.id !== devId));
    await persist('Penghapusan renungan', () => deleteRow('devotions', devId));
  };

  // Worship songs
  const handleAddWorshipSong = async (newSong) => {
    setWorshipSongs(prev => [...prev, newSong]);
    await persist('Lagu', () => saveRow('worshipSongs', newSong));
  };
  const handleUpdateWorshipSong = async (updatedSong) => {
    setWorshipSongs(prev => replaceById(prev, [updatedSong]));
    await persist('Lagu', () => saveRow('worshipSongs', updatedSong));
  };
  const handleDeleteWorshipSong = async (songId) => {
    setWorshipSongs(prev => prev.filter(s => s.id !== songId));
    await persist('Penghapusan lagu', () => deleteRow('worshipSongs', songId));
  };

  // EasyWorship schedules
  const handleAddEasyWorshipSchedule = async (newSch) => {
    setEasyWorshipSchedules(prev => [newSch, ...prev]);
    await persist('Jadwal EasyWorship', () => saveRow('easyWorshipSchedules', newSch));
  };
  const handleUpdateEasyWorshipSchedule = async (updatedSch) => {
    setEasyWorshipSchedules(prev => replaceById(prev, [updatedSch]));
    await persist('Jadwal EasyWorship', () => saveRow('easyWorshipSchedules', updatedSch));
  };
  const handleDeleteEasyWorshipSchedule = async (schId) => {
    setEasyWorshipSchedules(prev => prev.filter(s => s.id !== schId));
    await persist('Penghapusan jadwal EasyWorship', () => deleteRow('easyWorshipSchedules', schId));
  };

  // Event RSVP. Public RSVPs are inserted as single rows and only shown once stored.
  const handleAddEventRsvp = async (newRsvp) => {
    await insertRow('eventRsvps', newRsvp);
    setEventRsvps(prev => [newRsvp, ...prev.filter(r => r.id !== newRsvp.id)]);
  };
  const handleDeleteEventRsvp = (rsvpId) => {
    setEventRsvps(prev => prev.filter(r => r.id !== rsvpId));
    persist('Penghapusan RSVP', () => deleteRow('eventRsvps', rsvpId));
  };

  // Announcement Bar
  const handleUpdateAnnouncementBar = (nextBar) => {
    const resolved = typeof nextBar === 'function' ? nextBar(announcementBar) : nextBar;
    const merged = { ...DEFAULT_ANNOUNCEMENT_BAR, ...resolved, _updatedAt: new Date().toISOString() };
    setAnnouncementBar(merged);
    setIsBannerDismissed(false);
    persist('Pengumuman', () => saveSetting('announcementBar', merged));
  };

  // FAQs
  const handleAddFaq = (newFaq) => {
    const now = new Date().toISOString();
    const stampedFaq = { ...newFaq, createdAt: newFaq.createdAt || now, updatedAt: newFaq.updatedAt || now };
    setFaqs(prev => [...prev, stampedFaq]);
    persist('FAQ', () => saveRow('faqs', stampedFaq));
  };
  const handleSubmitPublicFaq = async (newFaq) => {
    const now = new Date().toISOString();
    const stampedFaq = { ...newFaq, createdAt: newFaq.createdAt || now, updatedAt: newFaq.updatedAt || now };
    await insertRow('faqs', stampedFaq);
    setFaqs(prev => [stampedFaq, ...prev.filter(f => f.id !== stampedFaq.id)]);
  };
  const handleUpdateFaq = (updatedFaq) => {
    const stampedFaq = { ...updatedFaq, updatedAt: new Date().toISOString() };
    setFaqs(prev => replaceById(prev, [stampedFaq]));
    persist('FAQ', () => saveRow('faqs', stampedFaq));
  };
  const handleDeleteFaq = (faqId) => {
    setFaqs(prev => prev.filter(f => f.id !== faqId));
    persist('Penghapusan FAQ', () => deleteRow('faqs', faqId));
  };

  // Tenure Roles
  const handleAddTenureRole = (newRole) => {
    const now = new Date().toISOString();
    const stampedRole = { ...newRole, createdAt: newRole.createdAt || now, updatedAt: newRole.updatedAt || now };
    setTenureRoles(prev => [...prev, stampedRole]);
    persist('Jabatan', () => saveRow('tenureRoles', stampedRole));
  };
  const handleUpdateTenureRole = (updatedRole) => {
    const existing = tenureRoles.find(r => r.id === updatedRole.id);
    if (!existing) return;
    const stampedRole = { ...existing, ...updatedRole, updatedAt: new Date().toISOString() };
    setTenureRoles(prev => replaceById(prev, [stampedRole]));
    persist('Jabatan', () => saveRow('tenureRoles', stampedRole));
  };
  const handleDeleteTenureRole = (roleId) => {
    setTenureRoles(prev => prev.filter(r => r.id !== roleId));
    persist('Penghapusan jabatan', () => deleteRow('tenureRoles', roleId));
  };

  // Restore a backup snapshot (.json). Rows are upserted table by table in foreign-key order;
  // rows created after the backup are kept. Throws on the first failure so the caller can report it.
  const handleRestoreBackup = async (backupData) => {
    if (!backupData || typeof backupData !== 'object') return;
    try {
      for (const key of RESTORE_ORDER) {
        if (Array.isArray(backupData[key])) await saveRows(key, backupData[key]);
      }
      if (Array.isArray(backupData.tenures) && backupData.tenures.length > 0) {
        const targetId = backupData.meta?.activeTenureId || backupData.tenures[0].id;
        const restoredActive = backupData.tenures.find(t => t.id === targetId) || backupData.tenures[0];
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
      await syncFromCloud();
    }
  };

  // Clear cache and reload all collections directly from database
  const handleResetDefault = async () => {
    localStorage.clear();
    await syncFromCloud();
  };

  // Helper to check page visibility with alias support
  const isPageVisible = (id) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', width: '100%', maxWidth: '100vw', overflowX: 'clip' }}>
      {/* Background Canvas */}
      <StarfieldBackground theme={theme} />

      {persistError && (
        <div
          role="alert"
          style={{
            position: 'fixed', left: '50%', bottom: '24px', transform: 'translateX(-50%)', zIndex: 10000,
            width: 'min(560px, calc(100vw - 32px))', display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '14px 16px', borderRadius: 'var(--radius-md)', background: '#fef2f2',
            border: '1px solid #fca5a5', color: '#991b1b', fontSize: '0.88rem', lineHeight: 1.5,
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <span style={{ flex: 1 }}>{persistError}</span>
          <button
            type="button"
            onClick={() => setPersistError(null)}
            aria-label="Tutup pesan kesalahan"
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Responsive Navbar (Can be toggled View / Hide) */}
      {isNavbarVisible && (
        <Navbar
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

      {/* LIVE ANNOUNCEMENT / TOP RUNNING BANNER */}
      {announcementBar?.isActive && !isBannerDismissed && effectiveTab !== 'admin' && effectiveTab !== 'all-hidden' && (
        <div
          style={{
            position: 'relative',
            zIndex: 45,
            background: isDark
              ? 'linear-gradient(90deg, rgba(0, 61, 121, 0.92), rgba(255, 184, 0, 0.18), rgba(0, 61, 121, 0.92))'
              : 'linear-gradient(90deg, #003D79, #00529C, #003D79)',
            borderBottom: '1px solid rgba(255, 184, 0, 0.4)',
            color: '#ffffff',
            padding: '10px 16px',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div
            className="container"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 260px', minWidth: 0 }}>
              {announcementBar.badge && (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--mandiri-gold)',
                    color: '#040914',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    flexShrink: 0
                  }}
                >
                  {announcementBar.badge}
                </span>
              )}
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  color: '#ffffff',
                  lineHeight: 1.45
                }}
              >
                {announcementBar.message || announcementBar.text}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {(announcementBar.ctaText || announcementBar.ctaLabel) && announcementBar.ctaTab && (
                <button
                  type="button"
                  onClick={() => setCurrentTab(announcementBar.ctaTab)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(255, 184, 0, 0.2)',
                    border: '1px solid var(--mandiri-gold)',
                    color: 'var(--mandiri-gold)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <span>{announcementBar.ctaText || announcementBar.ctaLabel}</span>
                  <ChevronRight size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsBannerDismissed(true)}
                title="Sembunyikan pengumuman sementara"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'rgba(255,255,255,0.75)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick Utility Pill when Navbar is Hidden */}
      {!isNavbarVisible && currentTab !== 'admin' && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          boxShadow: 'var(--shadow-card)',
          backdropFilter: 'blur(12px)'
        }}>
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--input-bg)',
              border: '1px solid var(--border-card)',
              color: isDark ? 'var(--mandiri-gold)' : 'var(--mandiri-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1, position: 'relative' }}>
        {effectiveTab === 'all-hidden' && (
          <div style={{ maxWidth: '620px', margin: '60px auto 80px auto', textAlign: 'center', padding: '0 16px' }}>
            <div className="glass-panel" style={{
              padding: '48px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
              border: '1.5px solid var(--border-card)'
            }}>
              <img 
                src={isDark ? "/assets/mandiri-club-bapekkris-white.png" : "/assets/mandiri-club-bapekkris-original.png"} 
                alt="Bapekkris Bank Mandiri"
                style={{ height: '52px', objectFit: 'contain', marginBottom: '4px' }}
                onError={(e) => {
                  e.currentTarget.src = "/assets/mandiri-club-bapekkris-original.png";
                }}
              />

              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(255, 184, 0, 0.14)',
                border: '1px solid rgba(255, 184, 0, 0.4)',
                color: 'var(--mandiri-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <EyeOff size={28} />
              </div>

              <span className="badge-gold">
                Mode Standby • Halaman Disembunyikan
              </span>

              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Seluruh Halaman Sedang Disembunyikan
              </h2>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '480px', margin: 0 }}>
                Saat ini seluruh halaman publik portal <strong>Bapekkris Bank Mandiri</strong> sedang dinonaktifkan sementara. Silakan kembali lagi nanti.
              </p>
            </div>
          </div>
        )}

        <ErrorBoundary onResetTab={() => setCurrentTab('home')}>
          {effectiveTab === 'home' && (
            <HomeSection
              activeTenure={activeTenure}
              divisions={divisions}
              events={events}
              members={members}
              setCurrentTab={setCurrentTab}
              forms={forms}
              eventRsvps={eventRsvps}
              submissions={submissions}
              devotions={devotions}
              faqs={faqs}
              onSubmitFaqQuestion={handleSubmitPublicFaq}
              theme={theme}
              pageVisibility={pageVisibility}
              tenureRoles={tenureRoles}
            />
          )}
        </ErrorBoundary>

        <Suspense
          fallback={
            <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Memuat halaman Bapekkris Bank Mandiri...
            </div>
          }
        >
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
              theme={theme}
              onSelectTenure={handleSelectTenure}
            />
          )}

          {(effectiveTab === 'event' || effectiveTab === 'program') && (
            <ProgramSection
              events={events}
              divisions={divisions}
              activeTenure={activeTenure}
              tenures={tenures}
              theme={theme}
              onNavigateOprec={isPageVisible('form') ? () => setCurrentTab('form') : undefined}
              eventRsvps={eventRsvps}
              onAddEventRsvp={handleAddEventRsvp}
              initialEventId={activeEventIdFromUrl}
              onSelectEventUrl={(eId) => setCurrentTab('event', null, eId, false)}
              forms={forms}
              onNavigateForm={(fId) => setCurrentTab('form', fId)}
              onNavigateEventStats={(eId) => setCurrentTab('event-stats', null, eId)}
              galleries={galleries}
              onNavigateGallery={(gId) => setCurrentTab('galeri', null, null, true, gId)}
              submissions={submissions}
            />
          )}

          {effectiveTab === 'event-stats' && (
            <EventRegistrationStats
              eventId={activeEventIdFromUrl}
              events={events}
              forms={forms}
              submissions={submissions}
              eventRsvps={eventRsvps}
              luckyDraws={luckyDraws}
              divisions={divisions}
              onAddLuckyDraw={handleAddLuckyDraw}
              onDeleteLuckyDraw={handleDeleteLuckyDraw}
              onResetLuckyDraw={handleResetLuckyDraw}
              onBack={() => setCurrentTab('event')}
              onNavigateForm={(fId) => setCurrentTab('form', fId)}
              theme={theme}
            />
          )}

          {effectiveTab === 'galeri' && (
            <GallerySection
              galleries={galleries}
              divisions={divisions}
              events={events}
              activeTenure={activeTenure}
              tenures={tenures}
              theme={theme}
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
              worshipSongs={worshipSongs}
              onSendToEasyWorship={handleSendToEasyWorship}
            />
          )}

          {effectiveTab === 'easyworship' && (
            <EasyWorshipSection
              worshipSongs={worshipSongs}
              devotions={devotions}
              initialItem={easyWorshipInitialItem}
              savedSchedules={easyWorshipSchedules}
              onSaveSchedule={handleAddEasyWorshipSchedule}
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
              eventRsvps={eventRsvps}
              submissions={submissions}
              onSubmitSubmission={handleSubmitSubmission}
              theme={theme}
              initialFormId={activeFormIdFromUrl}
              onSelectFormUrl={(fId) => setCurrentTab('form', fId)}
              activeTenure={activeTenure}
              tenures={tenures}
            />
          )}

          {effectiveTab === 'admin' && (
            <ErrorBoundary onResetTab={() => setCurrentTab('home')}>
              <AdminPortal
                onBack={() => {
                  if ((window.location.pathname || '').replace(/\/+$/, '') === '/admin') {
                    window.history.pushState(null, '', '/');
                  }
                  setCurrentTab(visiblePublicPages[0] || 'home');
                }}
                tenures={tenures}
                activeTenure={activeTenure}
                roleQuotas={roleQuotas}
                onUpdateRoleQuotas={handleUpdateRoleQuotas}
                tenureRoles={tenureRoles}
                onAddTenureRole={handleAddTenureRole}
                onUpdateTenureRole={handleUpdateTenureRole}
                onDeleteTenureRole={handleDeleteTenureRole}
                onSelectTenure={handleSelectTenure}
                onAddTenure={handleAddTenure}
                onUpdateTenure={handleUpdateTenure}
                onDeleteTenure={handleDeleteTenure}
                divisions={divisions}
                onAddDivision={handleAddDivision}
                onUpdateDivision={handleUpdateDivision}
                onDeleteDivision={handleDeleteDivision}
                forms={forms}
                onAddForm={handleAddForm}
                onUpdateForm={handleUpdateForm}
                onDeleteForm={handleDeleteForm}
                submissions={submissions}
                onUpdateSubmission={handleUpdateSubmission}
                onDeleteSubmission={handleDeleteSubmission}
                galleries={galleries}
                onAddGallery={handleAddGallery}
                onUpdateGallery={handleUpdateGallery}
                onDeleteGallery={handleUpdateGallery ? handleDeleteGallery : undefined}
                members={members}
                onAddMember={handleAddMember}
                onUpdateMember={handleUpdateMember}
                onDeleteMember={handleDeleteMember}
                events={events}
                onAddEvent={handleAddEvent}
                onUpdateEvent={handleAddEvent ? handleUpdateEvent : undefined}
                onDeleteEvent={handleDeleteEvent}
                subDivisions={subDivisions}
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
                onAddEasyWorshipSchedule={handleAddEasyWorshipSchedule}
                onUpdateEasyWorshipSchedule={handleUpdateEasyWorshipSchedule}
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
                onForceSync={syncFromCloud}
                onResetDefault={handleResetDefault}
                onRestoreBackup={handleRestoreBackup}
                theme={theme}
                luckyDraws={luckyDraws}
              />
            </ErrorBoundary>
          )}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* GLOBAL QUICK SEARCH MODAL (Ctrl+K / Tombol Cari di Navbar) */}
      {isQuickSearchOpen && (() => {
        const q = quickSearchQuery.trim().toLowerCase();
        const matchedMembers = q
          ? members.filter(m =>
              (m.name || '').toLowerCase().includes(q) ||
              (m.role || '').toLowerCase().includes(q) ||
              (m.title || '').toLowerCase().includes(q)
            ).slice(0, 5)
          : members.slice(0, 3);

        const matchedEvents = q
          ? events.filter(e =>
              (e.title || '').toLowerCase().includes(q) ||
              (e.divisionName || '').toLowerCase().includes(q) ||
              (e.location || '').toLowerCase().includes(q)
            ).slice(0, 4)
          : events.slice(0, 2);

        const matchedForms = q
          ? forms.filter(f =>
              f.isOpen !== false && (
                (f.title || '').toLowerCase().includes(q) ||
                (f.category || '').toLowerCase().includes(q)
              )
            ).slice(0, 3)
          : forms.filter(f => f.isOpen !== false).slice(0, 2);

        const matchedGalleries = q
          ? galleries.filter(g =>
              (g.title || '').toLowerCase().includes(q) ||
              (g.division || '').toLowerCase().includes(q)
            ).slice(0, 3)
          : [];

        const matchedAssets = q
          ? brandAssets.filter(a =>
              (a.title || '').toLowerCase().includes(q) ||
              (a.category || '').toLowerCase().includes(q)
            ).slice(0, 3)
          : [];

        const matchedDevotions = q
          ? devotions.filter(d =>
              (d.title || '').toLowerCase().includes(q) ||
              (d.scriptureRef || '').toLowerCase().includes(q) ||
              (d.body || '').toLowerCase().includes(q)
            ).slice(0, 3)
          : [];

        const matchedSongs = q
          ? worshipSongs.filter(s =>
              (s.title || '').toLowerCase().includes(q) ||
              (s.songNumber || '').toLowerCase().includes(q) ||
              (s.lyrics || '').toLowerCase().includes(q)
            ).slice(0, 3)
          : [];

        const matchedFaqs = q
          ? faqs.filter(fq =>
              fq.isPublished !== false && (
                (fq.question || '').toLowerCase().includes(q) ||
                (fq.answer || '').toLowerCase().includes(q) ||
                (fq.category || '').toLowerCase().includes(q)
              )
            ).slice(0, 3)
          : [];

        const totalResults = matchedMembers.length + matchedEvents.length + matchedForms.length + matchedGalleries.length + matchedAssets.length + matchedDevotions.length + matchedSongs.length + matchedFaqs.length;

        return (
          <div
            onClick={() => setIsQuickSearchOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.72)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              padding: '64px 16px 24px 16px'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="glass-panel modal-container"
              style={{
                maxWidth: '640px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                padding: '20px',
                border: '1.5px solid var(--mandiri-gold)',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Search Bar Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={18} color="var(--mandiri-gold)" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Cari nama personel, event, formulir registrasi, galeri, atau asset logo..."
                  value={quickSearchQuery}
                  onChange={(e) => setQuickSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 40px 13px 42px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--input-bg)',
                    border: '1.5px solid var(--input-border)',
                    color: 'var(--text-main)',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsQuickSearchOpen(false)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {totalResults === 0 ? (
                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Tidak ditemukan hasil untuk <strong>"{quickSearchQuery}"</strong>. Coba kata kunci lain seperti nama pengurus, turnamen, atau logo.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Members Results */}
                  {matchedMembers.length > 0 && pageVisibility.organisasi !== false && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={13} color="var(--mandiri-gold)" />
                        <span>Personel & Struktur Organisasi</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedMembers.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('organisasi');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{m.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {(() => {
                                  const roleObj = (tenureRoles || []).find(r => r.id === m.roleId) ||
                                    (tenureRoles || []).find(r => String(r?.name || '').toLowerCase().trim() === String(m?.role || '').toLowerCase().trim());
                                  const roleName = roleObj?.name || m.role || 'Anggota';
                                  const divObj = (divisions || []).find(d => d.id === m.divisionId);
                                  if (divObj && divObj.name && !String(roleName).toLowerCase().includes(String(divObj.name).toLowerCase())) {
                                    return `${roleName} • ${divObj.name}`;
                                  }
                                  return roleName;
                                })()}
                              </div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Events Results */}
                  {matchedEvents.length > 0 && isPageVisible('event') && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={13} color="var(--neon-cyan)" />
                        <span>Event Budaya</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedEvents.map(evt => (
                          <button
                            key={evt.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('event', null, evt.id);
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{evt.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{evt.date} • {evt.divisionName}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Forms Results */}
                  {matchedForms.length > 0 && isPageVisible('form') && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ClipboardList size={13} color="#10b981" />
                        <span>Formulir & Pendaftaran Aktif</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedForms.map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('form', f.id);
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>{f.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.category} • Deadline: {formatDeadlineWib(f.deadline)}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Galleries & Brand Assets Results */}
                  {(matchedGalleries.length > 0 || matchedAssets.length > 0) && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={13} color="#a855f7" />
                        <span>Galeri Dokumentasi & Asset Brand</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedGalleries.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('galeri');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>📷 {g.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.date} • {g.division}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                        {matchedAssets.map(a => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('assets');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800 }}>📦 {a.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.category} • {a.fileType}</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Renungan & FAQ Results */}
                  {(matchedDevotions.length > 0 || matchedFaqs.length > 0) && (
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Search size={13} color="var(--mandiri-gold)" />
                        <span>Renungan Firman & Panduan FAQ</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {matchedDevotions.map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('renungan');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>📖 {d.title} ({d.scriptureRef || 'Renungan'})</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>"{(d.body || '').slice(0, 75)}..."</div>
                            </div>
                            <ChevronRight size={15} color="var(--mandiri-gold)" />
                          </button>
                        ))}
                        {matchedFaqs.map(fq => (
                          <button
                            key={fq.id}
                            type="button"
                            onClick={() => {
                              setCurrentTab('home');
                              setIsQuickSearchOpen(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--input-bg)',
                              border: '1px solid var(--border-card)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              cursor: 'pointer',
                              color: 'var(--text-main)'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.86rem', fontWeight: 800 }}>❓ FAQ: {fq.question}</div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{(fq.answer || '').slice(0, 80)}...</div>
                            </div>
                            <ChevronRight size={15} color="var(--text-dim)" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-card)', paddingTop: '10px' }}>
                <span>💡 Pintasan Keyboard: <strong>Ctrl + K</strong> atau <strong>⌘ + K</strong></span>
                <span>Tekan <strong>ESC</strong> untuk menutup</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Clean Footer */}
      <Footer theme={theme} />
    </div>
  );
}
