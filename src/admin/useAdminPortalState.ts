// State, list filters, dialogs and handlers of the Admin Portal. AdminPortal.tsx renders it and
// shares the result with the tabs and modals in src/admin through AdminPortalContext.
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { AdminProfile, AppItem, AppRecord, RegistrationCounts } from '../lib/supabase';
import { soundFx } from '../utils/audio';
import { useFeedback } from '../ui';
import { DIVISION_ADMIN_TABS, SYNC_BADGE } from './adminConstants';
import type { PageVisibility } from '../components/layout/navItems';
import { downloadBlob } from '../utils/download';

type Save = (item: AppItem) => unknown;
type Remove = (id: string) => unknown;

export interface AdminSessionState {
  status: 'loading' | 'admin' | 'signed-out' | 'not-admin' | string;
  profile: AdminProfile | null;
}

export interface AdminPortalProps {
  onBack: () => void;
  tenures?: AppItem[];
  onAddTenure: Save;
  onUpdateTenure: Save;
  onDeleteTenure: Remove;
  divisions?: AppItem[];
  onAddDivision: Save;
  onUpdateDivision: Save;
  onDeleteDivision: Remove;
  applications?: AppItem[];
  galleries?: AppItem[];
  onAddGallery: Save;
  onUpdateGallery: Save;
  onDeleteGallery: Remove;
  members?: AppItem[];
  onAddMember: Save;
  onUpdateMember: Save;
  onDeleteMember: Remove;
  events?: AppItem[];
  onAddEvent: Save;
  onUpdateEvent: Save;
  onDeleteEvent?: Remove;
  subDivisions?: AppItem[];
  onAddSubDivision: Save;
  onUpdateSubDivision: Save;
  onDeleteSubDivision: Remove;
  devotions?: AppItem[];
  onAddDevotion: Save;
  onUpdateDevotion: Save;
  onDeleteDevotion: Remove;
  worshipSongs?: AppItem[];
  onAddWorshipSong: Save;
  onUpdateWorshipSong: Save;
  onDeleteWorshipSong: Remove;
  easyWorshipSchedules?: AppItem[];
  onDeleteEasyWorshipSchedule: Remove;
  forms?: AppItem[];
  onAddForm: Save;
  onUpdateForm: Save;
  onDeleteForm: Remove;
  submissions?: AppItem[];
  onUpdateSubmission: Save;
  onDeleteSubmission?: Remove;
  brandAssets?: AppItem[];
  onAddBrandAsset: Save;
  onUpdateBrandAsset: Save;
  onDeleteBrandAsset: Remove;
  pageVisibility?: PageVisibility;
  onUpdatePageVisibility: (next: PageVisibility) => void;
  activeTenure?: AppItem | null;
  onSelectTenure: (tenure: AppItem) => void;
  eventRsvps?: AppItem[];
  onDeleteEventRsvp?: Remove;
  faqs?: AppItem[];
  onAddFaq: Save;
  onUpdateFaq: Save;
  onDeleteFaq: Remove;
  announcementBar?: AppRecord;
  onUpdateAnnouncementBar: (next: AppRecord) => void;
  roleQuotas?: AppRecord;
  tenureRoles?: AppItem[];
  onAddTenureRole: Save;
  onUpdateTenureRole: Save;
  onDeleteTenureRole: Remove;
  syncStatus?: keyof typeof SYNC_BADGE;
  onResetDefault?: () => unknown;
  onRestoreBackup?: (backup: AppRecord) => Promise<unknown>;
  theme?: string;
  luckyDraws?: AppItem[];
  registrationCounts?: RegistrationCounts;
  adminSession?: AdminSessionState;
  onAdminLogin: (email: string, password: string) => Promise<unknown>;
  onAdminLogout: () => Promise<unknown>;
}

/** Shared edit dialog: the item being edited plus files picked there (uploaded on save). */
export interface EditingItem {
  type: string;
  item: AppItem;
  pendingPhoto?: File | null;
  pendingPhotos?: File[];
  pendingFile?: File | null;
  pendingPreviewFile?: File | null;
  originalFileUrl?: string;
  photoUrlInput?: string;
}

/** Delete confirmation; the counts and titles explain why a delete is blocked. */
export interface DeleteConfirm {
  type: string;
  id: string;
  name: string;
  isBlocked?: boolean;
  code?: string;
  tenureId?: string;
  reason?: string;
  category?: string;
  divName?: string;
  isOnlyTenure?: boolean;
  isActiveTenure?: boolean;
  divCount?: number;
  memCount?: number;
  evtCount?: number;
  galCount?: number;
  subCount?: number;
  formCount?: number;
  formSubCount?: number;
  rsvpCount?: number;
  luckyDrawCount?: number;
  squadCount?: number;
  eventCount?: number;
  submissionCount?: number;
  dependentCount?: number;
  totalDependentCount?: number;
  dependentMembers?: AppItem[];
  connectedEventTitle?: string;
  connectedFormNames?: string;
  connectedGalTitles?: string;
  /** Gallery photo removal from the edit dialog. */
  photoIdx?: number;
  /** Submission that won a lucky draw (delete blocked). */
  drawPrize?: string;
  drawnAt?: string;
}

const DEFAULT_PAGE_VISIBILITY: PageVisibility = {
  navbar: true, home: true, organisasi: true, event: true, program: true, galeri: true, renungan: true,
  alkitab: true, lagu: true, easyworship: true, assets: true, form: true, oprec: true
};
const DEFAULT_ANNOUNCEMENT: AppRecord = { isActive: false, badge: 'INFO TERBARU', message: '', ctaText: '', ctaTab: 'home' };
const SIGNED_OUT_SESSION: AdminSessionState = { status: 'loading', profile: null };

export function useAdminPortalState(props: AdminPortalProps) {
  const {
    onBack,
    tenures = [], onAddTenure, onUpdateTenure, onDeleteTenure,
    divisions = [], onAddDivision, onUpdateDivision, onDeleteDivision,
    applications = [],
    galleries = [], onAddGallery, onUpdateGallery, onDeleteGallery,
    members = [], onAddMember, onUpdateMember, onDeleteMember,
    events = [], onAddEvent, onUpdateEvent, onDeleteEvent,
    subDivisions = [], onAddSubDivision, onUpdateSubDivision, onDeleteSubDivision,
    devotions = [], onAddDevotion, onUpdateDevotion, onDeleteDevotion,
    worshipSongs = [], onAddWorshipSong, onUpdateWorshipSong, onDeleteWorshipSong,
    easyWorshipSchedules = [], onDeleteEasyWorshipSchedule,
    forms = [], onAddForm, onUpdateForm, onDeleteForm,
    submissions = [], onUpdateSubmission, onDeleteSubmission,
    brandAssets = [], onAddBrandAsset, onUpdateBrandAsset, onDeleteBrandAsset,
    pageVisibility = DEFAULT_PAGE_VISIBILITY, onUpdatePageVisibility,
    activeTenure = null, onSelectTenure,
    eventRsvps = [], onDeleteEventRsvp,
    faqs = [], onAddFaq, onUpdateFaq, onDeleteFaq,
    announcementBar = DEFAULT_ANNOUNCEMENT, onUpdateAnnouncementBar,
    roleQuotas = {}, tenureRoles = [], onAddTenureRole, onUpdateTenureRole, onDeleteTenureRole,
    syncStatus = 'synced', onResetDefault, onRestoreBackup,
    theme = 'dark',
    luckyDraws = [],
    registrationCounts,
    adminSession = SIGNED_OUT_SESSION,
    onAdminLogin, onAdminLogout
  } = props;
  const isDark = theme === 'dark';
  const isAuthenticated = adminSession.status === 'admin';
  const adminProfile = adminSession.profile;
  const isSuperAdmin = adminProfile?.role === 'super_admin';
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Notices go through the site-wide toast (src/ui/Toast).
  const { toast: notify } = useFeedback();
  const showToast = (message: string, type: 'success' | 'error' | string = 'success') => notify(message, type === 'error' ? 'error' : 'success');

  // Half-filled create forms of tabs that are currently closed (useAdminDraftForm)
  const formDrafts = useRef(new Map<string, unknown>());

  const [activeTab, setActiveTabState] = useState<string>(() => {
    try {
      return sessionStorage.getItem('bapekkris_admin_active_tab') || 'members';
    } catch {
      return 'members';
    }
  });
  const setActiveTab = (tabId: string) => {
    setActiveTabState(tabId);
    try {
      sessionStorage.setItem('bapekkris_admin_active_tab', tabId);
    } catch { /* storage unavailable */ }
  };

  // Division admins are kept on the tabs their role can manage.
  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin && !DIVISION_ADMIN_TABS.includes(activeTab)) {
      setActiveTab(DIVISION_ADMIN_TABS[0]);
    }
  }, [isAuthenticated, isSuperAdmin, activeTab]);

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
  const [eventPublicFilter, setEventPublicFilter] = useState<'all' | 'public' | 'draft'>('all');
  const [adminEventViewMode, setAdminEventViewMode] = useState<'list' | 'calendar'>('list');
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

  // Item open in the shared edit dialog, with files picked there that upload on save
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [editModalError, setEditModalError] = useState('');

  // Pending delete confirmation, with the dependency counts that may block it
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);

  const [expandedDivSubId, setExpandedDivSubId] = useState<string | null>(null);
  const [isAdminMobileMenuOpen, setIsAdminMobileMenuOpen] = useState(false);

  // Song list search
  const [songSearch, setSongSearch] = useState('');

  // List filters: divisions
  const [divSearchQuery, setDivSearchQuery] = useState('');
  const [divTenureFilter, setDivTenureFilter] = useState('all');
  const [divRecruitFilter, setDivRecruitFilter] = useState('all');
  const [divPage, setDivPage] = useState(1);

  // List filters: tenures
  const [tenureSearchQuery, setTenureSearchQuery] = useState('');
  const [tenureStatusFilter, setTenureStatusFilter] = useState('all');
  const [tenurePage, setTenurePage] = useState(1);

  // Submissions filter and drag-and-drop ordering in the form-field editor
  const [selectedSubFilter, setSelectedSubFilter] = useState('all');
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null);

  const handleMoveField = (fromIndex: number | null, toIndex: number | null) => {
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
  const handleDeleteTenureClick = (t: AppItem) => {
    const isOnlyTenure = tenures.length <= 1;
    const isActiveTenure = Boolean(t.isActive);
    const divCount = divisions.filter(d => d.tenureId === t.id).length;
    const memCount = members.filter(m => m.tenureId === t.id).length;
    const evtCount = events.filter(e => e.tenureId === t.id).length;
    const galCount = galleries.filter(g => g.tenureId === t.id).length;
    const formCount = forms.filter(f => f.tenureId === t.id).length;
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
  const handleDeleteDivisionClick = (d: AppItem) => {
    const memCount = members.filter(m => m.divisionId === d.id).length;
    const evtCount = events.filter(e => e.divisionId === d.id).length;
    const galCount = galleries.filter(g => g.divisionId === d.id || g.division === d.name).length;
    const subCount = subDivisions.filter(sd => sd.divisionId === d.id).length;
    const totalDependentCount = memCount + evtCount + galCount + subCount;

    setDeleteConfirm({
      type: 'division',
      id: d.id,
      name: d.name,
      memCount,
      evtCount,
      galCount,
      subCount,
      totalDependentCount,
      isBlocked: totalDependentCount > 0
    });
  };

  // Helper to initiate member deletion with Pimpro / leadership checks
  const handleDeleteMemberClick = (m: AppItem) => {
    const isPimpro = m.category === 'pimpro';
    const divObj = divisions.find(d => d.id === m.divisionId || d.memberId === m.id || d.leadName === m.name);
    const squadCount = isPimpro && m.divisionId 
      ? members.filter(other => other.category === 'anggota' && other.divisionId === m.divisionId).length 
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
  const handleDeleteEventClick = (evt: AppItem) => {
    const relatedRsvps = eventRsvps.filter(r => r.eventId === evt.id);
    const rsvpCount = relatedRsvps.length;

    // Forms linked to the event from either side (forms.event_id or events.form_id)
    const connectedForms = forms.filter(f =>
      (f.eventId && String(f.eventId) === String(evt.id)) ||
      (evt.formId && String(evt.formId) === String(f.id))
    );
    const formCount = connectedForms.length;
    const connectedFormIds = connectedForms.map(f => f.id);

    // Check connected form submissions
    const relatedSubs = submissions.filter(s => connectedFormIds.includes(s.formId));
    const formSubCount = relatedSubs.length;

    // Check lucky draw winners for this event
    const relatedLuckyDraws = luckyDraws.filter(ld => ld.eventId === evt.id);
    const luckyDrawCount = relatedLuckyDraws.length;

    // Check connected gallery albums
    const connectedGals = galleries.filter(g => 
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
  const handleDeleteFormClick = (f: AppItem) => {
    const subCount = submissions.filter(s => s.formId === f.id).length;
    
    // Check if connected to any event
    const connectedEvents = events.filter(e =>
      (e.formId && String(e.formId) === String(f.id)) ||
      (f.eventId && String(f.eventId) === String(e.id))
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
  const handleDeleteGalleryClick = (gal: AppItem) => {
    // Check if connected to an event
    const connectedEvents = events.filter(e => 
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

  // Photo picked in the edit dialog of a member (the create form handles its own photo)
  const handleMemberPhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setEditingItem(prev => prev ? { ...prev, pendingPhoto: file, item: { ...prev.item, image: localPreview } } : null);
    showToast(`Foto baru "${file.name}" dipilih (akan diunggah saat Anda klik Simpan Perubahan)`);
  };

  // Photos picked in the edit dialog of a gallery (the create form handles its own files)
  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
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

  // File picked in the edit dialog of a brand asset (the create form handles its own files)
  const handleBrandAssetUpload = (e: ChangeEvent<HTMLInputElement>, field: 'fileUrl' | 'previewUrl' = 'fileUrl') => {
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
  const verifyImageUrl = (url: string, options: { requireHttps?: boolean; allowRelative?: boolean } = {}) => {
    const { requireHttps = false, allowRelative = false } = options;
    return new Promise<{ valid: boolean; error?: string }>((resolve) => {
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
      try {
        const parsed = new URL(trimmed);
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
    const validUrls: string[] = [];
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
    downloadBlob(blob, `Backup_Bapekkris_Bank_Mandiri_${new Date().toISOString().slice(0, 10)}.json`);
    showToast('Snapshot Backup Penuh (.json) seluruh 13 tabel berhasil diunduh!');
  };
  const restoreBackupFile = (e: ChangeEvent<HTMLInputElement>) => {
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
        await onRestoreBackup?.(parsed);
        showToast('Seluruh data berhasil dipulihkan dari file Backup & disinkronkan ke Cloud!');
      } catch {
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
      showToast((err as Error).message || 'Gagal keluar dari sesi admin', 'error');
    }
  };

  return {
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
    onUpdateWorshipSong,
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
    setSongSearch,
    setSubCurrentPage,
    setSubSearchQuery,
    setSubStatusFilter,
    setSubTenureFilter,
    setTenurePage,
    setTenureSearchQuery,
    setTenureStatusFilter,
    showToast,
    songSearch,
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
    isAuthenticated,
    adminProfile,
    syncStatus,
    onBack,
    onRestoreBackup,
    isChangePasswordOpen,
    setIsChangePasswordOpen,
    showExecutiveReportModal,
    downloadBackup,
    restoreBackupFile,
    handleLogoutClick,
    onAdminLogin,
    verifyImageUrl,
    worshipSongs
  };}
