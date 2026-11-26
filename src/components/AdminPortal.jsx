import {
  useState,
  useEffect,
  useRef
} from 'react';
import {
  Lock,
  ArrowLeft,
  LogOut,
  ClipboardList,
  Download,
  Globe,
  RefreshCw,
  Upload,
  KeyRound
} from 'lucide-react';
import AdminAccountsPanel from '../admin/AdminAccountsPanel';

import {
  soundFx
} from '../utils/audio';

import {
  AdminPortalContext
} from '../admin/AdminPortalContext';
import AdminLoginForm from '../admin/AdminLoginForm';
import ChangePasswordDialog from '../admin/ChangePasswordDialog';
import {
  Badge,
  Button,
  useFeedback
} from '../ui';

import {
  SYNC_BADGE,
  DIVISION_ADMIN_TABS
} from '../admin/adminConstants';
import AdminSummaryBar from '../admin/AdminSummaryBar';
import AdminTabNavigation from '../admin/AdminTabNavigation';
import VisibilityTab from '../admin/tabs/VisibilityTab';
import MembersTab from '../admin/tabs/MembersTab';
import RolesTab from '../admin/tabs/RolesTab';
import EventsTab from '../admin/tabs/EventsTab';
import GalleryTab from '../admin/tabs/GalleryTab';
import DivisionsTab from '../admin/tabs/DivisionsTab';
import TenureTab from '../admin/tabs/TenureTab';
import FormsTab from '../admin/tabs/FormsTab';
import SubmissionsTab from '../admin/tabs/SubmissionsTab';
import DevotionsTab from '../admin/tabs/DevotionsTab';
import SongsTab from '../admin/tabs/SongsTab';
import EasyWorshipTab from '../admin/tabs/EasyWorshipTab';
import AssetsTab from '../admin/tabs/AssetsTab';
import FaqsTab from '../admin/tabs/FaqsTab';
import PrayerRequestsTab from '../admin/tabs/PrayerRequestsTab';
import VisitorStatsTab from '../admin/tabs/VisitorStatsTab';
import EditItemModal from '../admin/modals/EditItemModal';
import DeleteConfirmModal from '../admin/modals/DeleteConfirmModal';
import ExecutiveReportModal from '../admin/modals/ExecutiveReportModal';

export default function AdminPortal({ 
  onBack, 
  tenures = [], 
  onAddTenure, 
  onUpdateTenure,
  onDeleteTenure,
  divisions = [], 
  onAddDivision, 
  onUpdateDivision,
  onDeleteDivision,
  applications = [],
  galleries = [],
  onAddGallery,
  onUpdateGallery,
  onDeleteGallery,
  members = [],
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  events = [],
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  subDivisions = [],
  onAddSubDivision,
  onUpdateSubDivision,
  onDeleteSubDivision,
  devotions = [],
  onAddDevotion,
  onUpdateDevotion,
  onDeleteDevotion,
  worshipSongs = [],
  onAddWorshipSong,
  onUpdateWorshipSong,
  onDeleteWorshipSong,
  easyWorshipSchedules = [],
  onAddEasyWorshipSchedule,
  onUpdateEasyWorshipSchedule,
  onDeleteEasyWorshipSchedule,
  forms = [],
  onAddForm,
  onUpdateForm,
  onDeleteForm,
  submissions = [],
  onUpdateSubmission,
  onDeleteSubmission,
  brandAssets = [],
  onAddBrandAsset,
  onUpdateBrandAsset,
  onDeleteBrandAsset,
  pageVisibility = {
    navbar: true,
    home: true,
    organisasi: true,
    event: true,
    program: true,
    galeri: true,
    renungan: true,
    alkitab: true,
    lagu: true,
    easyworship: true,
    assets: true,
    form: true,
    oprec: true
  },
  onUpdatePageVisibility,
  activeTenure,
  onSelectTenure,
  eventRsvps = [],
  onDeleteEventRsvp,
  faqs = [],
  onAddFaq,
  onUpdateFaq,
  onDeleteFaq,
  announcementBar = {
    isActive: false,
    badge: 'INFO TERBARU',
    message: '',
    ctaText: '',
    ctaTab: 'home'
  },
  onUpdateAnnouncementBar,
  roleQuotas = {},
  tenureRoles = [],
  onAddTenureRole,
  onUpdateTenureRole,
  onDeleteTenureRole,
  syncStatus = 'synced',
  onForceSync,
  onResetDefault,
  onRestoreBackup,
  theme = 'dark',
  luckyDraws = [],
  registrationCounts,
  adminSession = { status: 'loading', profile: null },
  onAdminLogin,
  onAdminLogout
}) {
  const isDark = theme === 'dark';
  const isAuthenticated = adminSession.status === 'admin';
  const adminProfile = adminSession.profile;
  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Notices go through the site-wide toast (src/ui/Toast).
  const { toast: notify } = useFeedback();
  const showToast = (message, type = 'success') => notify(message, type === 'error' ? 'error' : 'success');

  // Half-filled create forms of tabs that are currently closed (useAdminDraftForm)
  const formDrafts = useRef(new Map());

  // Admin Dashboard Tabs: 'members' | 'visibility' | 'events' | 'forms' | 'submissions' | 'gallery' | 'assets' | 'divisions' | 'tenure' | 'devotions' | 'songs' | 'easyworship'
  const [activeTab, setActiveTabState] = useState(() => {
    try {
      return sessionStorage.getItem('bapekkris_admin_active_tab') || 'members';
    } catch (e) {
      return 'members';
    }
  });
  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    try {
      sessionStorage.setItem('bapekkris_admin_active_tab', tabId);
    } catch (e) {}
  };

  // Division admins are kept on the tabs their role can manage.
  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin && !DIVISION_ADMIN_TABS.includes(activeTab)) {
      setActiveTab(DIVISION_ADMIN_TABS[0]);
    }
  }, [isAuthenticated, isSuperAdmin, activeTab]);

  // Search & Filter states for Members in Admin
  // List filters: roles
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [roleTenureFilter, setRoleTenureFilter] = useState('all');
  const [roleLevelFilter, setRoleLevelFilter] = useState('all');
  const [rolePage, setRolePage] = useState(1);

  const [adminMemSearch, setAdminMemSearch] = useState('');
  const [adminMemTenureFilter, setAdminMemTenureFilter] = useState('all');
  const [adminMemCatFilter, setAdminMemCatFilter] = useState('all');
  const [adminMemDivFilter, setAdminMemDivFilter] = useState('all');
  const [adminMemPage, setAdminMemPage] = useState(1);

  // Search & Filter states for Events in Admin
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventTenureFilter, setEventTenureFilter] = useState('all');
  const [eventCatFilter, setEventCatFilter] = useState('all');
  const [eventDivFilter, setEventDivFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [eventPublicFilter, setEventPublicFilter] = useState('all'); // 'all' | 'public' | 'draft'
  const [adminEventViewMode, setAdminEventViewMode] = useState('list'); // 'list' | 'calendar'
  const [adminEventPage, setAdminEventPage] = useState(1);
  const [adminRsvpPage, setAdminRsvpPage] = useState(1);
  const [rsvpSearchQuery, setRsvpSearchQuery] = useState('');
  const [rsvpEventFilter, setRsvpEventFilter] = useState('all');
  const [rsvpModeFilter, setRsvpModeFilter] = useState('all');

  // Search & Filter states for Gallery in Admin
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [galleryTenureFilter, setGalleryTenureFilter] = useState('all');
  const [galleryDivFilter, setGalleryDivFilter] = useState('all');
  const [adminGalleryPage, setAdminGalleryPage] = useState(1);

  // Search & Filter states for Submissions & Reports in Admin
  const [subTenureFilter, setSubTenureFilter] = useState('all');
  const [reportTenureId, setReportTenureId] = useState('');

  // Search & Filter states for FAQs in Admin
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [faqCatFilter, setFaqCatFilter] = useState('all');
  const [adminFaqPage, setAdminFaqPage] = useState(1);

  // Search, Filter & Pagination states for Brand Assets in Admin
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetCatFilter, setAssetCatFilter] = useState('all');
  const [assetPage, setAssetPage] = useState(1);

  // Search, Filter & Pagination states for Forms in Admin
  const [formSearchQuery, setFormSearchQuery] = useState('');
  const [formTenureFilter, setFormTenureFilter] = useState('all');
  const [formCatFilter, setFormCatFilter] = useState('all');
  const [formStatusFilter, setFormStatusFilter] = useState('all');
  const [formPage, setFormPage] = useState(1);

  // Search & Filter states for Submissions in Admin
  const [subStatusFilter, setSubStatusFilter] = useState('all');
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subCurrentPage, setSubCurrentPage] = useState(1);

  // Pending Upload States (Deferred upload on Save/Submit only, never prematurely on selection)

  // Generic Edit Modal State: { type: 'member'|'division'|'tenure'|'gallery', item: {...} }
  const [editingItem, setEditingItem] = useState(null);
  const [editModalError, setEditModalError] = useState('');

  // Generic Delete Confirmation Modal State: { type: 'member'|'division'|'tenure'|'gallery', id: string, name: string }
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [expandedDivSubId, setExpandedDivSubId] = useState(null);
  const [isAdminMobileMenuOpen, setIsAdminMobileMenuOpen] = useState(false);

  // Devotions State
  const [devotionDate, setDevotionDate] = useState(new Date().toISOString().split('T')[0]);
  const [devotionTitle, setDevotionTitle] = useState('');
  const [devotionScriptureRef, setDevotionScriptureRef] = useState('');
  const [devotionScriptureText, setDevotionScriptureText] = useState('');
  const [devotionBody, setDevotionBody] = useState('');
  const [devotionPrayer, setDevotionPrayer] = useState('');
  const [devotionAuthor, setDevotionAuthor] = useState('Bapekkris Bank Mandiri');
  const [devotionTheme, setDevotionTheme] = useState('Integritas & Karakter Kristiani');

  // Worship Songs State
  const [songTitle, setSongTitle] = useState('');
  const [songNumber, setSongNumber] = useState('');
  const [songCategory, setSongCategory] = useState('KJ');
  const [songKey, setSongKey] = useState('C');
  const [songAuthor, setSongAuthor] = useState('');
  const [songLyrics, setSongLyrics] = useState('');
  const [songYoutube, setSongYoutube] = useState('');
  const [songSearch, setSongSearch] = useState('');

  // EasyWorship Schedules State

  // List filters: divisions
  const [divSearchQuery, setDivSearchQuery] = useState('');
  const [divTenureFilter, setDivTenureFilter] = useState('all');
  const [divRecruitFilter, setDivRecruitFilter] = useState('all');
  const [divPage, setDivPage] = useState(1);

  // List filters: tenures
  const [tenureSearchQuery, setTenureSearchQuery] = useState('');
  const [tenureStatusFilter, setTenureStatusFilter] = useState('all');
  const [tenurePage, setTenurePage] = useState(1);

  // Recruitment controls

  // Submissions filter and drag-and-drop ordering in the form-field editor
  const [selectedSubFilter, setSelectedSubFilter] = useState('all');
  const [draggedFieldIndex, setDraggedFieldIndex] = useState(null);
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState(null);

  const handleMoveField = (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
    if (!editingItem || editingItem.type !== 'form' || !editingItem.item?.fields) return;
    const currentFields = [...editingItem.item.fields];
    if (fromIndex < 0 || fromIndex >= currentFields.length || toIndex < 0 || toIndex >= currentFields.length) return;
    const [moved] = currentFields.splice(fromIndex, 1);
    currentFields.splice(toIndex, 0, moved);
    setEditingItem({
      ...editingItem,
      item: { ...editingItem.item, fields: currentFields }
    });
  };

  // Helper to initiate tenure deletion with dependency checks and protection validation
  const handleDeleteTenureClick = (t) => {
    const isOnlyTenure = (tenures || []).length <= 1;
    const isActiveTenure = (activeTenure?.id === t.id) || Boolean(t.isActive);
    const divCount = (divisions || []).filter(d => d.tenureId === t.id).length;
    const memCount = (members || []).filter(m => m.tenureId === t.id).length;
    const evtCount = (events || []).filter(e => e.tenureId === t.id).length;
    const galCount = (galleries || []).filter(g => g.tenureId === t.id).length;
    const formCount = (forms || []).filter(f => f.tenureId === t.id).length;
    const totalDependentCount = divCount + memCount + evtCount + galCount + formCount;

    setDeleteConfirm({
      type: 'tenure',
      id: t.id,
      name: t.title || t.code || 'Periode Kepengurusan',
      code: t.code,
      isOnlyTenure,
      isActiveTenure,
      divCount,
      memCount,
      evtCount,
      galCount,
      formCount,
      totalDependentCount,
      isBlocked: isOnlyTenure || isActiveTenure || totalDependentCount > 0
    });
  };

  // Helper to initiate division deletion with dependency checks
  const handleDeleteDivisionClick = (d) => {
    const memCount = (members || []).filter(m => m.divisionId === d.id).length;
    const evtCount = (events || []).filter(e => e.divisionId === d.id).length;
    const galCount = (galleries || []).filter(g => g.divisionId === d.id || g.division === d.name).length;
    const totalDependentCount = memCount + evtCount + galCount;

    setDeleteConfirm({
      type: 'division',
      id: d.id,
      name: d.name,
      memCount,
      evtCount,
      galCount,
      totalDependentCount,
      isBlocked: totalDependentCount > 0
    });
  };

  // Helper to initiate member deletion with Pimpro / leadership checks
  const handleDeleteMemberClick = (m) => {
    const isPimpro = m.category === 'pimpro';
    const divObj = (divisions || []).find(d => d.id === m.divisionId || d.memberId === m.id || d.leadName === m.name);
    const squadCount = isPimpro && m.divisionId 
      ? (members || []).filter(other => other.category === 'anggota' && other.divisionId === m.divisionId).length 
      : 0;

    setDeleteConfirm({
      type: 'member',
      id: m.id,
      name: m.name,
      category: m.category,
      divName: divObj?.name || 'Terkait',
      squadCount,
      isBlocked: isPimpro && squadCount > 0
    });
  };

  // Helper to initiate event deletion with RSVP, Form, Submission, Lucky Draw, and Gallery dependency checks
  const handleDeleteEventClick = (evt) => {
    const relatedRsvps = (eventRsvps || []).filter(r => r.eventId === evt.id);
    const rsvpCount = relatedRsvps.length;

    // Check connected forms (both direct eventId, isEventConnected, or evt.formId)
    const connectedForms = (forms || []).filter(f => 
      (f.eventId && String(f.eventId) === String(evt.id)) ||
      (f.fields?.[0]?._eventId && String(f.fields?.[0]?._eventId) === String(evt.id)) ||
      (evt.formId && String(evt.formId) === String(f.id)) ||
      ((f.isEventConnected || f.fields?.[0]?._isEventConnected) && (String(f.eventId) === String(evt.id) || String(f.fields?.[0]?._eventId) === String(evt.id)))
    );
    const formCount = connectedForms.length;
    const connectedFormIds = connectedForms.map(f => f.id);

    // Check connected form submissions
    const relatedSubs = (submissions || []).filter(s => connectedFormIds.includes(s.formId));
    const formSubCount = relatedSubs.length;

    // Check lucky draw winners for this event
    const relatedLuckyDraws = (luckyDraws || []).filter(ld => ld.eventId === evt.id);
    const luckyDrawCount = relatedLuckyDraws.length;

    // Check connected gallery albums
    const connectedGals = (galleries || []).filter(g => 
      (g.eventId && String(g.eventId) === String(evt.id)) ||
      (evt.galleryId && String(evt.galleryId) === String(g.id))
    );
    const galCount = connectedGals.length;

    const isBlocked = rsvpCount > 0 || formCount > 0 || formSubCount > 0 || luckyDrawCount > 0 || galCount > 0;

    setDeleteConfirm({
      type: 'event',
      id: evt.id,
      name: evt.title,
      rsvpCount,
      formCount,
      formSubCount,
      luckyDrawCount,
      galCount,
      connectedFormNames: connectedForms.map(f => f.title).join(', '),
      connectedGalTitles: connectedGals.map(g => g.title).join(', '),
      isBlocked
    });
  };

  // Helper to initiate dynamic form deletion with submission and connected event dependency checks
  const handleDeleteFormClick = (f) => {
    const subCount = (submissions || []).filter(s => s.formId === f.id).length;
    
    // Check if connected to any event
    const connectedEvents = (events || []).filter(e => 
      (e.formId && String(e.formId) === String(f.id)) ||
      (f.eventId && String(f.eventId) === String(e.id)) ||
      (f.fields?.[0]?._eventId && String(f.fields?.[0]?._eventId) === String(e.id)) ||
      ((f.isEventConnected || f.fields?.[0]?._isEventConnected) && (String(f.eventId) === String(e.id) || String(f.fields?.[0]?._eventId) === String(e.id)))
    );
    const eventCount = connectedEvents.length;
    const connectedEventTitles = connectedEvents.map(e => e.title).join(', ');

    const isBlocked = subCount > 0 || eventCount > 0;

    setDeleteConfirm({
      type: 'form',
      id: f.id,
      name: f.title,
      submissionCount: subCount,
      eventCount,
      connectedEventTitle: connectedEventTitles,
      isBlocked
    });
  };

  // Helper to initiate gallery album deletion with connected event dependency checks
  const handleDeleteGalleryClick = (gal) => {
    // Check if connected to an event
    const connectedEvents = (events || []).filter(e => 
      (gal.eventId && String(e.id) === String(gal.eventId)) ||
      (e.galleryId && String(e.galleryId) === String(gal.id))
    );
    const eventCount = connectedEvents.length;
    const connectedEventTitles = connectedEvents.map(e => e.title).join(', ');
    const isBlocked = eventCount > 0;

    setDeleteConfirm({
      type: 'gallery',
      id: gal.id,
      name: gal.title,
      eventCount,
      connectedEventTitle: connectedEventTitles,
      isBlocked
    });
  };

  // Escape for the edit, delete and report dialogs is handled by useModalBehavior (stack-aware).

  // Supabase Auth sign-in (form: src/admin/AdminLoginForm.tsx); access requires an admin_profiles row
  const handleLogin = (email, password) => onAdminLogin(email, password);

  // Photo picked in the edit dialog of a member (the create form handles its own photo)
  const handleMemberPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setEditingItem(prev => prev ? { ...prev, pendingPhoto: file, item: { ...prev.item, image: localPreview } } : null);
    showToast(`Foto baru "${file.name}" dipilih (akan diunggah saat Anda klik Simpan Perubahan)`);
  };

  // Photos picked in the edit dialog of a gallery (the create form handles its own files)
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const localPreviews = files.map(f => URL.createObjectURL(f));
    setEditingItem(prev => {
      if (!prev) return null;
      const existingPhotos = Array.isArray(prev.item.photos) ? prev.item.photos : [];
      return { ...prev, pendingPhotos: [...(prev.pendingPhotos || []), ...files], item: { ...prev.item, photos: [...existingPhotos, ...localPreviews] } };
    });
    showToast(`${files.length} foto baru dipilih (akan diunggah saat Anda klik Simpan Perubahan)`);
  };

  // Select Brand Asset file or preview - Deferred upload on Save only
  // File picked in the edit dialog of a brand asset (the create form handles its own files)
  const handleBrandAssetUpload = (e, field = 'fileUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localBlobUrl = URL.createObjectURL(file);
    if (field === 'fileUrl') {
      const sizeLabel = file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        : (file.size / 1024).toFixed(0) + ' KB';
      const extLabel = (file.name.split('.').pop() || 'FILE').toUpperCase();
      setEditingItem(prev => prev ? {
        ...prev,
        pendingFile: file,
        originalFileUrl: prev.originalFileUrl || prev.item.fileUrl,
        item: { ...prev.item, fileUrl: localBlobUrl, fileSize: sizeLabel, fileType: extLabel }
      } : null);
      showToast(`File baru "${file.name}" dipilih (akan diunggah saat Anda klik Simpan Perubahan)`);
    } else {
      setEditingItem(prev => prev ? { ...prev, pendingPreviewFile: file, item: { ...prev.item, previewUrl: localBlobUrl } } : null);
      showToast(`Preview "${file.name}" dipilih`);
    }
  };

  // Helper to verify if an external image link is reachable and valid
  const verifyImageUrl = (url, options = {}) => {
    const { requireHttps = false, allowRelative = false } = options;
    return new Promise((resolve) => {
      if (!url || typeof url !== 'string') {
        return resolve({ valid: false, error: 'URL tidak boleh kosong' });
      }
      const trimmed = url.trim();
      if (trimmed.startsWith('blob:')) {
        return resolve({ valid: true });
      }
      if (allowRelative && (trimmed.startsWith('/images/') || trimmed.startsWith('/assets/'))) {
        return resolve({ valid: true });
      }
      let parsed;
      try {
        parsed = new URL(trimmed);
        if (requireHttps) {
          if (parsed.protocol !== 'https:') {
            return resolve({ valid: false, error: 'Tautan URL foto wajib diawali dengan https://' });
          }
        } else if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return resolve({ valid: false, error: 'Tautan harus diawali dengan http:// atau https://' });
        }
      } catch {
        return resolve({ valid: false, error: requireHttps ? 'Format tautan URL tidak valid (wajib diawali https://)' : 'Format tautan URL tidak valid' });
      }

      const hasImageExtension = /\.(jpe?g|png|webp|gif|svg|avif|bmp|ico)($|\?)/i.test(trimmed);
      const isCloudMediaStorage = trimmed.includes('/storage/v1/object/') || trimmed.includes('/storage-proxy/');

      const img = new Image();
      let isSettled = false;

      const timer = setTimeout(() => {
        if (isSettled) return;
        isSettled = true;
        img.onload = null;
        img.onerror = null;
        if (hasImageExtension || isCloudMediaStorage) {
          resolve({ valid: true });
        } else {
          resolve({ valid: false, error: 'Tautan foto melebihi batas waktu (timeout) atau bukan file gambar yang aktif' });
        }
      }, 4500);

      img.onload = () => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        resolve({ valid: true });
      };

      img.onerror = () => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        if (hasImageExtension || isCloudMediaStorage) {
          resolve({ valid: true });
        } else {
          resolve({ valid: false, error: 'Tautan tidak dapat memuat gambar atau bukan file foto yang valid' });
        }
      };

      img.src = trimmed;
    });
  };

  const handleAddPhotoLinkToEditModal = async () => {
    const raw = (editingItem?.photoUrlInput || '').trim();
    if (!raw) {
      showToast('Masukkan minimal satu tautan link foto terlebih dahulu', 'error');
      return;
    }
    const urls = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!urls.length) return;

    setIsUploadingMedia(true);
    showToast(`Memverifikasi ${urls.length} link foto...`);
    const validUrls = [];
    for (const u of urls) {
      const check = await verifyImageUrl(u);
      if (!check.valid) {
        setIsUploadingMedia(false);
        showToast(`Tautan foto "${u}" tidak valid: ${check.error}`, 'error');
        return;
      }
      validUrls.push(u);
    }
    setIsUploadingMedia(false);

    setEditingItem(prev => {
      if (!prev) return null;
      const existing = Array.isArray(prev.item.photos) ? prev.item.photos : [];
      return {
        ...prev,
        photoUrlInput: '',
        item: {
          ...prev.item,
          photos: [...existing, ...validUrls]
        }
      };
    });
    soundFx?.playSuccess?.();
    showToast(`Berhasil menambahkan ${validUrls.length} link foto ke carousel!`);
  };

  // IF NOT AUTHENTICATED: SHOW LOGIN FORM
  if (!isAuthenticated) {
    return (
      <div className="mx-auto w-full max-w-[440px] px-4 pb-24 pt-8">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={onBack} className="mb-5">Kembali ke beranda</Button>
        <div className="rounded-xl border border-line bg-surface p-7 shadow-card md:p-9">
          <div className="mb-6 text-center">
            <img src={isDark ? '/assets/mandiri-club-bapekkris-white.png' : '/assets/mandiri-club-bapekkris-original.png'} alt="Bapekkris Bank Mandiri"
              className="mx-auto mb-5 block h-12 w-auto object-contain" onError={(e) => { e.currentTarget.src = '/assets/mandiri-club-bapekkris-original.png'; }} />
            <span className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-gold-tint text-gold-ink"><Lock size={20} aria-hidden="true" /></span>
            <h1 className="font-display text-[1.6rem] font-semibold text-ink">Portal pengurus</h1>
            <p className="mt-1 text-[0.9rem] text-muted">Masuk untuk mengelola acara, pengurus, renungan, lagu, dan konten lainnya.</p>
          </div>
          <AdminLoginForm onLogin={handleLogin} showToast={showToast} />
        </div>
      </div>
    );
  }

  // IF AUTHENTICATED: SHOW ADMIN DASHBOARD
    // Everything the extracted tabs and modals (src/admin/*) read from this component.
  const adminPortalContext = {
    formDrafts,
    onAddMember,
    onAddEvent,
    onAddGallery,
    onAddBrandAsset,
    onAddTenureRole,
    onAddDivision,
    onAddTenure,
    onAddFaq,
    activeTab,
    activeTenure,
    adminEventPage,
    adminEventViewMode,
    adminFaqPage,
    adminGalleryPage,
    adminMemCatFilter,
    adminMemDivFilter,
    adminMemPage,
    adminMemSearch,
    adminMemTenureFilter,
    adminRsvpPage,
    announcementBar,
    applications,
    assetCatFilter,
    assetPage,
    assetSearchQuery,
    brandAssets,
    deleteConfirm,
    devotionAuthor,
    devotionBody,
    devotionDate,
    devotionPrayer,
    devotionScriptureRef,
    devotionScriptureText,
    devotionTheme,
    devotionTitle,
    devotions,
    divPage,
    divRecruitFilter,
    divSearchQuery,
    divTenureFilter,
    divisions,
    dragOverFieldIndex,
    draggedFieldIndex,
    easyWorshipSchedules,
    editModalError,
    editingItem,
    eventCatFilter,
    eventDivFilter,
    eventPublicFilter,
    eventRsvps,
    eventSearchQuery,
    eventStatusFilter,
    eventTenureFilter,
    events,
    expandedDivSubId,
    faqCatFilter,
    faqSearchQuery,
    faqs,
    formCatFilter,
    formPage,
    formSearchQuery,
    formStatusFilter,
    formTenureFilter,
    forms,
    galleries,
    galleryDivFilter,
    gallerySearchQuery,
    galleryTenureFilter,
    handleAddPhotoLinkToEditModal,
    handleBrandAssetUpload,
    handleDeleteDivisionClick,
    handleDeleteEventClick,
    handleDeleteFormClick,
    handleDeleteGalleryClick,
    handleDeleteMemberClick,
    handleDeleteTenureClick,
    handleMemberPhotoUpload,
    handleMoveField,
    handlePhotoUpload,
    isAdminMobileMenuOpen,
    isDark,
    isSuperAdmin,
    isUploadingMedia,
    luckyDraws,
    members,
    onAddDevotion,
    onAddForm,
    onAddSubDivision,
    onAddWorshipSong,
    onDeleteBrandAsset,
    onDeleteDevotion,
    onDeleteDivision,
    onDeleteEasyWorshipSchedule,
    onDeleteEvent,
    onDeleteEventRsvp,
    onDeleteFaq,
    onDeleteForm,
    onDeleteGallery,
    onDeleteMember,
    onDeleteSubDivision,
    onDeleteSubmission,
    onDeleteTenure,
    onDeleteTenureRole,
    onDeleteWorshipSong,
    onResetDefault,
    onSelectTenure,
    onUpdateAnnouncementBar,
    onUpdateBrandAsset,
    onUpdateDevotion,
    onUpdateDivision,
    onUpdateEvent,
    onUpdateFaq,
    onUpdateForm,
    onUpdateGallery,
    onUpdateMember,
    onUpdatePageVisibility,
    onUpdateSubDivision,
    onUpdateSubmission,
    onUpdateTenure,
    onUpdateTenureRole,
    pageVisibility,
    registrationCounts,
    reportTenureId,
    roleLevelFilter,
    rolePage,
    roleQuotas,
    roleSearchQuery,
    roleTenureFilter,
    rsvpEventFilter,
    rsvpModeFilter,
    rsvpSearchQuery,
    selectedSubFilter,
    setActiveTab,
    setAdminEventPage,
    setAdminEventViewMode,
    setAdminFaqPage,
    setAdminGalleryPage,
    setAdminMemCatFilter,
    setAdminMemDivFilter,
    setAdminMemPage,
    setAdminMemSearch,
    setAdminMemTenureFilter,
    setAdminRsvpPage,
    setAssetCatFilter,
    setAssetPage,
    setAssetSearchQuery,
    setDeleteConfirm,
    setDevotionAuthor,
    setDevotionBody,
    setDevotionDate,
    setDevotionPrayer,
    setDevotionScriptureRef,
    setDevotionScriptureText,
    setDevotionTitle,
    setDivPage,
    setDivRecruitFilter,
    setDivSearchQuery,
    setDivTenureFilter,
    setDragOverFieldIndex,
    setDraggedFieldIndex,
    setEditModalError,
    setEditingItem,
    setEventCatFilter,
    setEventDivFilter,
    setEventPublicFilter,
    setEventSearchQuery,
    setEventStatusFilter,
    setEventTenureFilter,
    setExpandedDivSubId,
    setFaqCatFilter,
    setFaqSearchQuery,
    setFormCatFilter,
    setFormPage,
    setFormSearchQuery,
    setFormStatusFilter,
    setFormTenureFilter,
    setGalleryDivFilter,
    setGallerySearchQuery,
    setGalleryTenureFilter,
    setIsAdminMobileMenuOpen,
    setIsUploadingMedia,
    setReportTenureId,
    setRoleLevelFilter,
    setRolePage,
    setRoleSearchQuery,
    setRoleTenureFilter,
    setRsvpEventFilter,
    setRsvpModeFilter,
    setRsvpSearchQuery,
    setSelectedSubFilter,
    setShowExecutiveReportModal,
    setSongAuthor,
    setSongCategory,
    setSongKey,
    setSongLyrics,
    setSongNumber,
    setSongSearch,
    setSongTitle,
    setSongYoutube,
    setSubCurrentPage,
    setSubSearchQuery,
    setSubStatusFilter,
    setSubTenureFilter,
    setTenurePage,
    setTenureSearchQuery,
    setTenureStatusFilter,
    showExecutiveReportModal,
    showToast,
    songAuthor,
    songCategory,
    songKey,
    songLyrics,
    songNumber,
    songSearch,
    songTitle,
    songYoutube,
    subCurrentPage,
    subDivisions,
    subSearchQuery,
    subStatusFilter,
    subTenureFilter,
    submissions,
    tenurePage,
    tenureRoles,
    tenureSearchQuery,
    tenureStatusFilter,
    tenures,
    theme,
    verifyImageUrl,
    worshipSongs
  };

  const downloadBackup = () => {
    const snapshot = {
                meta: {
                  app: 'Bapekkris Bank Mandiri Portal',
                  exportedAt: new Date().toISOString(),
                  activeTenureId: activeTenure?.id || ''
                },
                tenures,
                divisions,
                members,
                events,
                galleries,
                devotions,
                worshipSongs,
                subDivisions,
                easyWorshipSchedules,
                forms,
                submissions,
                brandAssets,
                eventRsvps,
                luckyDraws,
                tenureRoles,
                roleQuotas,
                faqs,
                pageVisibility,
                announcementBar
              };
              const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Backup_Bapekkris_Bank_Mandiri_${new Date().toISOString().slice(0, 10)}.json`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              showToast('Snapshot Backup Penuh (.json) seluruh 13 tabel berhasil diunduh!');
  };
  const restoreBackupFile = (e) => {
    const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = async (evt) => {
                    try {
                      const parsed = JSON.parse(String(evt.target?.result || '{}'));
                      if (!parsed || typeof parsed !== 'object' || (!Array.isArray(parsed.members) && !Array.isArray(parsed.events))) {
                        showToast('Format file Backup (.json) tidak valid', 'error');
                        return;
                      }
                      await onRestoreBackup(parsed);
                      showToast('Seluruh data berhasil dipulihkan dari file Backup & disinkronkan ke Cloud!');
                    } catch (err) {
                      showToast('Gagal membaca file Backup (.json)', 'error');
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
  };
  const handleLogoutClick = async () => {
    try {
      await onAdminLogout();
    } catch (err) {
      showToast(err.message || 'Gagal keluar dari sesi admin', 'error');
    }
  };

  return (
    <AdminPortalContext.Provider value={adminPortalContext}>
    <div className="admin-portal-wrapper mx-auto w-full max-w-[1360px] px-4 pb-24 pt-6 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={onBack} className="-ml-3 mb-2">Kembali ke situs</Button>
          <h1 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight text-ink">Portal pengurus</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.86rem] text-muted">
            <span>{adminProfile?.displayName || adminProfile?.email || 'Admin'} · {isSuperAdmin ? 'Super admin' : 'Admin divisi'}</span>
            <Badge tone={syncStatus === 'synced' ? 'success' : syncStatus === 'error' ? 'danger' : 'gold'}><Globe size={12} aria-hidden="true" />{SYNC_BADGE[syncStatus].label}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={<ClipboardList size={14} aria-hidden="true" />} onClick={() => setShowExecutiveReportModal(true)}>Laporan / LPJ</Button>
          <Button size="sm" variant="secondary" icon={<Download size={14} aria-hidden="true" />} onClick={downloadBackup} title="Unduh cadangan lengkap seluruh data (.json)">Backup</Button>
          {onRestoreBackup && (
            <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[0.8rem] font-semibold text-ink hover:border-line-strong focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-navy-ink" title="Pulihkan seluruh data dari file cadangan (.json)">
              <Upload size={14} aria-hidden="true" />Restore
              <input type="file" accept=".json,application/json" className="sr-only" onChange={restoreBackupFile} />
            </label>
          )}
          {onResetDefault && (
            <Button size="sm" variant="secondary" icon={<RefreshCw size={14} aria-hidden="true" />} onClick={() => setDeleteConfirm({ type: 'reset_all', id: 'reset', name: 'Sync Data' })} title="Kosongkan cache lokal dan muat ulang data terbaru">Sinkronkan</Button>
          )}
          <Button size="sm" variant="secondary" icon={<KeyRound size={14} aria-hidden="true" />} onClick={() => setIsChangePasswordOpen(true)}>Ganti password</Button>
          <Button size="sm" variant="danger" icon={<LogOut size={14} aria-hidden="true" />} onClick={handleLogoutClick} className="lg:hidden">Keluar</Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
      <AdminTabNavigation onLogout={handleLogoutClick} />
      <div className="flex min-w-0 flex-col gap-6">
      <AdminSummaryBar />

      {/* TAB CONTENT: VISIBILITAS HALAMAN & NAVBAR (VIEW / HIDE) */}
      {activeTab === 'admins' && isSuperAdmin && (
        <AdminAccountsPanel divisions={divisions} currentUserId={adminProfile?.userId} showToast={showToast} />
      )}

      {activeTab === 'visibility' && <VisibilityTab />}

      {activeTab === 'prayers' && isSuperAdmin && <PrayerRequestsTab />}

      {activeTab === 'visitors' && isSuperAdmin && <VisitorStatsTab />}

      {/* TAB CONTENT: PENGURUS & ANGGOTA (DENGAN NOMOR WA OPSIONAL) */}
      {activeTab === 'members' && <MembersTab />}

      {/* TAB CONTENT: STRUKTUR ROLE & JABATAN */}
      {activeTab === 'roles' && <RolesTab />}

      {/* TAB CONTENT: EVENT (DENGAN TANGGAL MULAI & BERAKHIR) */}
      {activeTab === 'events' && <EventsTab />}

      {/* TAB CONTENT 0: GALERI KEGIATAN DINAMIS */}
      {activeTab === 'gallery' && <GalleryTab />}

      {/* TAB CONTENT 1: DIVISI */}
      {activeTab === 'divisions' && <DivisionsTab />}

      {/* TAB CONTENT 2: TENURE */}
      {activeTab === 'tenure' && <TenureTab />}

      {/* TAB CONTENT: DYNAMIC FORM ENGINE */}
      {activeTab === 'forms' && <FormsTab />}

      {/* TAB CONTENT: SUBMISSIONS (DATA PENGISIAN FORM DINAMIS PER FORM + SELEKSI STATUS & 1-CLICK WA) */}
      {activeTab === 'submissions' && <SubmissionsTab />}

      {/* TAB CONTENT: RENUNGAN HARIAN */}
      {activeTab === 'devotions' && <DevotionsTab />}

      {/* TAB CONTENT: KIDUNG JEMAAT & LAGU ROHANI */}
      {activeTab === 'songs' && <SongsTab />}

      {/* TAB CONTENT: JADWAL EASYWORSHIP */}
      {activeTab === 'easyworship' && <EasyWorshipTab />}

      {/* TAB CONTENT: BRAND ASSETS & TEMPLATES MANAGEMENT */}
      {activeTab === 'assets' && <AssetsTab />}

      {/* TAB CONTENT: PUSAT PANDUAN & TANYA JAWAB (FAQ) */}
      {activeTab === 'faqs' && <FaqsTab />}

      {/* EDIT MODAL DIALOG */}
      {editingItem && <EditItemModal />}

      {/* CONFIRMATION DELETE DIALOG */}
      {deleteConfirm && <DeleteConfirmModal />}

      {/* PRINT-READY EXECUTIVE REPORT & LPJ MODAL */}
      {showExecutiveReportModal && <ExecutiveReportModal />}
      <ChangePasswordDialog open={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} showToast={showToast} />
      </div>
      </div>
    </div>
    </AdminPortalContext.Provider>
  );
}
