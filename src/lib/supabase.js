import { createClient } from '@supabase/supabase-js';
import { formatWibEventRange, toDatetimeLocalSecondsValue, toDatetimeLocalValue } from '../utils/dateUtils.js';
import { getCategoryFromLevel } from '../utils/memberQuotaUtils.js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 'https://xarcxbfgeoetyhpqsick.supabase.co';
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcmN4YmZnZW9ldHlocHFzaWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MTM1MjMsImV4cCI6MjEwOTE4OTUyM30.xQzKu3bL9Pzp3OeL6s2s9sEtTBQukr1y0XQSf21bzWI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const LOCAL_PREFIX = 'bapekkris_mandiri_v1_';

export function loadLocalCache(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(LOCAL_PREFIX + key);
    if (raw !== null && raw !== undefined) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore storage errors
  }
  return fallbackValue;
}

export function saveLocalCache(key, value) {
  try {
    localStorage.setItem(LOCAL_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    // ignore quota errors
  }
}

// ============================================================================
// ROW MAPPERS: Web State (camelCase) <-> Supabase Tables (snake_case)
// ============================================================================

const TABLE_MAP = {
  tenures: 'tenures',
  divisions: 'divisions',
  subDivisions: 'sub_divisions',
  departments: 'departments',
  members: 'members',
  events: 'events',
  galleries: 'galleries',
  aspirasiList: 'aspirasi',
  forms: 'forms',
  submissions: 'submissions',
  brandAssets: 'brand_assets',
  eventRsvps: 'event_rsvps',
  faqs: 'faqs',
  tenureRoles: 'tenure_roles',
  luckyDraws: 'lucky_draws',
  devotions: 'daily_devotions',
  worshipSongs: 'worship_songs',
  easyWorshipSchedules: 'easy_worship_schedules'
};

export const rowMappers = {
  tenures: {
    toDb: (item) => ({
      id: String(item.id),
      code: String(item.code || item.id),
      title: String(item.title || ''),
      theme_tagline: item.themeTagline || item.theme_tagline || null,
      hero_headline: item.heroHeadline || item.hero_headline || null,
      hero_highlight: item.heroHighlight || item.hero_highlight || null,
      visi: item.visi || null,
      misi: Array.isArray(item.misi) ? item.misi : [],
      is_active: Boolean(item.isActive),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      themeTagline: row.theme_tagline || '',
      heroHeadline: row.hero_headline || '',
      heroHighlight: row.hero_highlight || '',
      visi: row.visi || '',
      misi: Array.isArray(row.misi) ? row.misi : [],
      isActive: Boolean(row.is_active),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  tenureRoles: {
    toDb: (item) => ({
      id: String(item.id),
      tenure_id: item.tenureId || null,
      name: String(item.name || '').trim(),
      level: String(item.level ?? 5),
      max_quota: Number(item.maxQuota ?? item.max ?? 0),
      requires_division: Boolean(item.requiresDivision ?? item.requires_division),
      requires_sub_division: Boolean(item.requiresSubDivision ?? item.requires_sub_division),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      name: row.name,
      level: Number(row.level ?? 5),
      maxQuota: Number(row.max_quota || 0),
      max: Number(row.max_quota || 0),
      requiresDivision: Boolean(row.requires_division),
      requiresSubDivision: Boolean(row.requires_sub_division),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  departments: {
    toDb: (item) => ({
      id: String(item.id),
      name: String(item.name || '').trim(),
      code: item.code || null,
      description: item.description || null,
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      name: row.name,
      code: row.code || '',
      description: row.description || '',
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  divisions: {
    toDb: (item) => ({
      id: String(item.id),
      tenure_id: item.tenureId || null,
      name: String(item.name || '').trim(),
      color: item.color || '#003d79',
      motto: item.motto || null,
      description: item.description || null,
      focus_areas: Array.isArray(item.focusAreas) ? item.focusAreas : [],
      is_recruiting: Boolean(item.isRecruiting !== false),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      name: row.name,
      color: row.color || '#003d79',
      motto: row.motto || '',
      description: row.description || '',
      focusAreas: Array.isArray(row.focus_areas) ? row.focus_areas : [],
      isRecruiting: Boolean(row.is_recruiting !== false),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  subDivisions: {
    toDb: (item) => ({
      id: String(item.id),
      division_id: String(item.divisionId || item.division_id),
      name: String(item.name || '').trim(),
      code: item.code || null,
      description: item.description || null,
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      divisionId: row.division_id,
      name: row.name,
      code: row.code || '',
      description: row.description || '',
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  members: {
    toDb: (item) => ({
      id: String(item.id),
      tenure_id: item.tenureId || null,
      division_id: item.divisionId || null,
      sub_division_id: item.subDivisionId || null,
      role_id: item.roleId || null,
      name: String(item.name || '').trim(),
      image: item.image || null,
      color: item.color || null,
      whatsapp: item.whatsapp || null,
      motto: item.motto || null,
      responsibilities: Array.isArray(item.responsibilities) ? item.responsibilities : [],
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id,
      subDivisionId: row.sub_division_id,
      roleId: row.role_id,
      name: row.name,
      image: row.image || '',
      color: row.color || '',
      whatsapp: row.whatsapp || '',
      motto: row.motto || '',
      responsibilities: Array.isArray(row.responsibilities) ? row.responsibilities : [],
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  events: {
    toDb: (item) => ({
      id: String(item.id),
      tenure_id: item.tenureId || null,
      division_id: item.divisionId || null,
      title: String(item.title || '').trim(),
      category: item.category || 'Ibadah',
      start_date: item.startDate || null,
      end_date: item.endDate || null,
      location: item.location || null,
      peserta: item.peserta || null,
      description: item.description || null,
      total_rab: Number(item.totalRab || 0),
      status: item.status || 'Upcoming',
      is_public: Boolean(item.isPublic !== false),
      is_limited: Boolean(item.isLimited),
      max_quota: Number(item.maxQuota || 0),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id,
      title: row.title,
      category: row.category || 'Ibadah',
      startDate: row.start_date || '',
      endDate: row.end_date || '',
      location: row.location || '',
      peserta: row.peserta || '',
      description: row.description || '',
      totalRab: Number(row.total_rab || 0),
      status: row.status || 'Upcoming',
      isPublic: Boolean(row.is_public !== false),
      isLimited: Boolean(row.is_limited),
      maxQuota: Number(row.max_quota || 0),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  galleries: {
    toDb: (item) => ({
      id: String(item.id),
      tenure_id: item.tenureId || null,
      division_id: item.divisionId || null,
      event_id: item.eventId || null,
      title: String(item.title || '').trim(),
      date: item.date || null,
      description: item.description || null,
      photos: Array.isArray(item.photos) ? item.photos : [],
      doc_links: Array.isArray(item.docLinks) ? item.docLinks : [],
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      divisionId: row.division_id,
      eventId: row.event_id,
      title: row.title,
      date: row.date || '',
      description: row.description || '',
      photos: Array.isArray(row.photos) ? row.photos : [],
      docLinks: Array.isArray(row.doc_links) ? row.doc_links : [],
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  aspirasiList: {
    toDb: (item) => ({
      id: String(item.id),
      sender: item.sender || 'Anonim',
      title: item.title || '',
      category: item.category || 'Pokok Doa',
      description: item.description || '',
      status: item.status || 'Menunggu Review',
      admin_reply: item.adminReply || '',
      is_public: Boolean(item.isPublic !== false),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      sender: row.sender || 'Anonim',
      title: row.title || '',
      category: row.category || 'Pokok Doa',
      description: row.description || '',
      status: row.status || 'Menunggu Review',
      adminReply: row.admin_reply || '',
      isPublic: Boolean(row.is_public !== false),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  forms: {
    toDb: (item) => ({
      id: String(item.id),
      tenure_id: item.tenureId || null,
      event_id: item.eventId || null,
      title: String(item.title || '').trim(),
      subtitle: item.subtitle || null,
      category: item.category || 'Kegiatan',
      deadline: item.deadline || null,
      description: item.description || null,
      notes: item.notes || null,
      fields: Array.isArray(item.fields) ? item.fields : [],
      is_open: Boolean(item.isOpen !== false),
      requires_tracking: Boolean(item.requiresTracking !== false),
      is_show_accepted: Boolean(item.isShowAccepted),
      is_limited: Boolean(item.isLimited),
      max_quota: Number(item.maxQuota || 0),
      is_event_connected: Boolean(item.isEventConnected),
      is_lucky_draw: Boolean(item.isLuckyDraw),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      tenureId: row.tenure_id,
      eventId: row.event_id,
      title: row.title,
      subtitle: row.subtitle || '',
      category: row.category || 'Kegiatan',
      deadline: row.deadline || '',
      description: row.description || '',
      notes: row.notes || '',
      fields: Array.isArray(row.fields) ? row.fields : [],
      isOpen: Boolean(row.is_open !== false),
      requiresTracking: Boolean(row.requires_tracking !== false),
      isShowAccepted: Boolean(row.is_show_accepted),
      isLimited: Boolean(row.is_limited),
      maxQuota: Number(row.max_quota || 0),
      isEventConnected: Boolean(row.is_event_connected),
      isLuckyDraw: Boolean(row.is_lucky_draw),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  submissions: {
    toDb: (item) => ({
      id: String(item.id),
      form_id: item.formId,
      data: item.data || {},
      files: item.files || {},
      status: item.status || 'Submitted',
      admin_notes: item.adminNotes || '',
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      formId: row.form_id,
      data: row.data || {},
      files: row.files || {},
      status: row.status || 'Submitted',
      adminNotes: row.admin_notes || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  brandAssets: {
    toDb: (item) => ({
      id: String(item.id),
      title: String(item.title || '').trim(),
      category: item.category || 'Logo & Brand',
      description: item.description || '',
      file_url: item.fileUrl,
      preview_url: item.previewUrl || '',
      file_type: item.fileType || 'PDF',
      file_size: item.fileSize || '',
      badge: item.badge || 'Official Asset',
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      title: row.title,
      category: row.category || 'Logo & Brand',
      description: row.description || '',
      fileUrl: row.file_url,
      previewUrl: row.preview_url || '',
      fileType: row.file_type || 'PDF',
      fileSize: row.file_size || '',
      badge: row.badge || 'Official Asset',
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  eventRsvps: {
    toDb: (item) => ({
      id: String(item.id),
      event_id: item.eventId,
      department_id: item.departmentId || null,
      attendee_name: item.attendeeName || '',
      attendance_mode: item.attendanceMode || 'Hadir Onsite',
      notes: item.notes || '',
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      eventId: row.event_id,
      departmentId: row.department_id,
      attendeeName: row.attendee_name,
      attendanceMode: row.attendance_mode || 'Hadir Onsite',
      notes: row.notes || '',
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  faqs: {
    toDb: (item) => ({
      id: String(item.id),
      question: item.question,
      answer: item.answer,
      category: item.category || 'Umum',
      asked_by: item.askedBy || 'Admin Bapekkris',
      is_published: Boolean(item.isPublished !== false),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      question: row.question,
      answer: row.answer,
      category: row.category || 'Umum',
      askedBy: row.asked_by || 'Admin Bapekkris',
      isPublished: Boolean(row.is_published !== false),
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  luckyDraws: {
    toDb: (item) => ({
      id: String(item.id),
      event_id: item.eventId,
      submission_id: item.submissionId,
      form_id: item.formId || null,
      prize_name: item.prizeName || 'Doorprize Utama',
      drawn_at: item.drawnAt || new Date().toISOString(),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      eventId: row.event_id,
      submissionId: row.submission_id,
      formId: row.form_id,
      prizeName: row.prize_name,
      drawnAt: row.drawn_at,
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  devotions: {
    toDb: (item) => ({
      id: String(item.id),
      title: String(item.title || '').trim(),
      devotion_date: item.devotionDate || new Date().toISOString().slice(0, 10),
      scripture_ref: String(item.scriptureRef || '').trim(),
      scripture_text: item.scriptureText || '',
      body: String(item.body || '').trim(),
      prayer: item.prayer || '',
      author: item.author || 'Bapekkris Bank Mandiri',
      theme: item.theme || 'Iman & Pengharapan',
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      title: row.title,
      devotionDate: row.devotion_date,
      scriptureRef: row.scripture_ref,
      scriptureText: row.scripture_text || '',
      body: row.body,
      prayer: row.prayer || '',
      author: row.author || 'Bapekkris Bank Mandiri',
      theme: row.theme || 'Iman & Pengharapan',
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  worshipSongs: {
    toDb: (item) => ({
      id: String(item.id),
      title: String(item.title || '').trim(),
      song_number: item.songNumber || '',
      category: item.category || 'Kidung Jemaat',
      key_signature: item.keySignature || 'C',
      author: item.author || '',
      lyrics: String(item.lyrics || '').trim(),
      youtube_url: item.youtubeUrl || '',
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      title: row.title,
      songNumber: row.song_number || '',
      category: row.category || 'Kidung Jemaat',
      keySignature: row.key_signature || 'C',
      author: row.author || '',
      lyrics: row.lyrics || '',
      youtubeUrl: row.youtube_url || '',
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  easyWorshipSchedules: {
    toDb: (item) => ({
      id: String(item.id),
      event_id: item.eventId || null,
      title: String(item.title || '').trim(),
      service_date: item.serviceDate || '',
      items: Array.isArray(item.items) ? item.items : [],
      theme_settings: item.themeSettings || {},
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row) => ({
      id: row.id,
      eventId: row.event_id,
      title: row.title,
      serviceDate: row.service_date || '',
      items: Array.isArray(row.items) ? row.items : [],
      themeSettings: row.theme_settings || {},
      sortOrder: Number(row.sort_order || 0),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  }
};

// ============================================================================
// DATA FETCHING & SYNCHRONIZATION (ZERO MOCK DATA GUARANTEE)
// ============================================================================

export async function fetchAllCloudState() {
  try {
    const [
      tenuresRes,
      divisionsRes,
      subDivisionsRes,
      membersRes,
      eventsRes,
      galleriesRes,
      aspirasiRes,
      formsRes,
      submissionsRes,
      brandAssetsRes,
      eventRsvpsRes,
      faqsRes,
      departmentsRes,
      tenureRolesRes,
      luckyDrawsRes,
      devotionsRes,
      worshipSongsRes,
      easyWorshipRes,
      settingsRes
    ] = await Promise.all([
      supabase.from('tenures').select('*').order('sort_order', { ascending: true }),
      supabase.from('divisions').select('*').order('sort_order', { ascending: true }),
      supabase.from('sub_divisions').select('*').order('sort_order', { ascending: true }),
      supabase.from('members').select('*').order('sort_order', { ascending: true }),
      supabase.from('events').select('*').order('sort_order', { ascending: true }),
      supabase.from('galleries').select('*').order('sort_order', { ascending: true }),
      supabase.from('aspirasi').select('*').order('created_at', { ascending: false }),
      supabase.from('forms').select('*').order('sort_order', { ascending: true }),
      supabase.from('submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('brand_assets').select('*').order('sort_order', { ascending: true }),
      supabase.from('event_rsvps').select('*').order('created_at', { ascending: false }),
      supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
      supabase.from('departments').select('*').order('sort_order', { ascending: true }),
      supabase.from('tenure_roles').select('*').order('sort_order', { ascending: true }),
      supabase.from('lucky_draws').select('*').order('drawn_at', { ascending: false }),
      supabase.from('daily_devotions').select('*').order('devotion_date', { ascending: false }),
      supabase.from('worship_songs').select('*').order('sort_order', { ascending: true }),
      supabase.from('easy_worship_schedules').select('*').order('created_at', { ascending: false }),
      supabase.from('page_settings').select('*')
    ]);

    const result = {};

    // Map each table cleanly. If empty array, it sets empty array []. ZERO MOCK DATA!
    if (!tenuresRes.error && Array.isArray(tenuresRes.data)) {
      result.tenures = tenuresRes.data.map(rowMappers.tenures.fromDb);
      saveLocalCache('tenures', result.tenures);
    }
    if (!divisionsRes.error && Array.isArray(divisionsRes.data)) {
      result.divisions = divisionsRes.data.map(rowMappers.divisions.fromDb);
      saveLocalCache('divisions', result.divisions);
    }
    if (!subDivisionsRes.error && Array.isArray(subDivisionsRes.data)) {
      result.subDivisions = subDivisionsRes.data.map(rowMappers.subDivisions.fromDb);
      saveLocalCache('subDivisions', result.subDivisions);
    }
    if (!membersRes.error && Array.isArray(membersRes.data)) {
      result.members = membersRes.data.map(rowMappers.members.fromDb);
      saveLocalCache('members', result.members);
    }
    if (!eventsRes.error && Array.isArray(eventsRes.data)) {
      result.events = eventsRes.data.map(rowMappers.events.fromDb);
      saveLocalCache('events', result.events);
    }
    if (!galleriesRes.error && Array.isArray(galleriesRes.data)) {
      result.galleries = galleriesRes.data.map(rowMappers.galleries.fromDb);
      saveLocalCache('galleries', result.galleries);
    }
    if (!aspirasiRes.error && Array.isArray(aspirasiRes.data)) {
      result.aspirasiList = aspirasiRes.data.map(rowMappers.aspirasiList.fromDb);
      saveLocalCache('aspirasiList', result.aspirasiList);
    }
    if (!formsRes.error && Array.isArray(formsRes.data)) {
      result.forms = formsRes.data.map(rowMappers.forms.fromDb);
      saveLocalCache('forms', result.forms);
    }
    if (!submissionsRes.error && Array.isArray(submissionsRes.data)) {
      result.submissions = submissionsRes.data.map(rowMappers.submissions.fromDb);
      saveLocalCache('submissions', result.submissions);
    }
    if (!brandAssetsRes.error && Array.isArray(brandAssetsRes.data)) {
      result.brandAssets = brandAssetsRes.data.map(rowMappers.brandAssets.fromDb);
      saveLocalCache('brandAssets', result.brandAssets);
    }
    if (!eventRsvpsRes.error && Array.isArray(eventRsvpsRes.data)) {
      result.eventRsvps = eventRsvpsRes.data.map(rowMappers.eventRsvps.fromDb);
      saveLocalCache('eventRsvps', result.eventRsvps);
    }
    if (!faqsRes.error && Array.isArray(faqsRes.data)) {
      result.faqs = faqsRes.data.map(rowMappers.faqs.fromDb);
      saveLocalCache('faqs', result.faqs);
    }
    if (!departmentsRes.error && Array.isArray(departmentsRes.data)) {
      result.departments = departmentsRes.data.map(rowMappers.departments.fromDb);
      saveLocalCache('departments', result.departments);
    }
    if (!tenureRolesRes.error && Array.isArray(tenureRolesRes.data)) {
      result.tenureRoles = tenureRolesRes.data.map(rowMappers.tenureRoles.fromDb);
      saveLocalCache('tenureRoles', result.tenureRoles);
    }
    if (!luckyDrawsRes.error && Array.isArray(luckyDrawsRes.data)) {
      result.luckyDraws = luckyDrawsRes.data.map(rowMappers.luckyDraws.fromDb);
      saveLocalCache('luckyDraws', result.luckyDraws);
    }
    if (!devotionsRes.error && Array.isArray(devotionsRes.data)) {
      result.devotions = devotionsRes.data.map(rowMappers.devotions.fromDb);
      saveLocalCache('devotions', result.devotions);
    }
    if (!worshipSongsRes.error && Array.isArray(worshipSongsRes.data)) {
      result.worshipSongs = worshipSongsRes.data.map(rowMappers.worshipSongs.fromDb);
      saveLocalCache('worshipSongs', result.worshipSongs);
    }
    if (!easyWorshipRes.error && Array.isArray(easyWorshipRes.data)) {
      result.easyWorshipSchedules = easyWorshipRes.data.map(rowMappers.easyWorshipSchedules.fromDb);
      saveLocalCache('easyWorshipSchedules', result.easyWorshipSchedules);
    }

    if (!settingsRes.error && Array.isArray(settingsRes.data)) {
      for (const row of settingsRes.data) {
        if (row.key === 'page_visibility' && row.value) {
          result.pageVisibility = { ...row.value, _updatedAt: row.updated_at };
          saveLocalCache('pageVisibility', result.pageVisibility);
        }
        if (row.key === 'active_tenure_id' && row.value?.id) {
          result.activeTenureId = row.value.id;
          saveLocalCache('activeTenureId', row.value.id);
        }
        if (row.key === 'announcement_bar' && row.value) {
          result.announcementBar = { ...row.value, _updatedAt: row.updated_at };
          saveLocalCache('announcementBar', result.announcementBar);
        }
        if (row.key === 'role_quotas' && row.value) {
          result.roleQuotas = row.value;
          saveLocalCache('roleQuotas', result.roleQuotas);
        }
      }
    }

    return result;
  } catch (err) {
    console.error('Error fetching cloud state:', err);
    return {};
  }
}

// Push state directly to Supabase table
export async function pushCloudState(key, data) {
  try {
    saveLocalCache(key, data);
    const tableName = TABLE_MAP[key];

    // Settings / configuration keys
    if (!tableName) {
      if (key === 'pageVisibility') {
        await supabase.from('page_settings').upsert({ key: 'page_visibility', value: data, updated_at: new Date().toISOString() });
      } else if (key === 'activeTenureId') {
        await supabase.from('page_settings').upsert({ key: 'active_tenure_id', value: { id: data }, updated_at: new Date().toISOString() });
      } else if (key === 'announcementBar') {
        await supabase.from('page_settings').upsert({ key: 'announcement_bar', value: data, updated_at: new Date().toISOString() });
      } else if (key === 'roleQuotas') {
        await supabase.from('page_settings').upsert({ key: 'role_quotas', value: data, updated_at: new Date().toISOString() });
      }
      return;
    }

    const mapper = rowMappers[key];
    if (!mapper) return;

    if (Array.isArray(data)) {
      if (data.length === 0) {
        // Table cleared
        await supabase.from(tableName).delete().neq('id', '__keep_none__');
        return;
      }
      const dbRows = data.map(mapper.toDb);
      const existingIds = dbRows.map(r => r.id);
      
      // Upsert current rows
      await supabase.from(tableName).upsert(dbRows, { onConflict: 'id' });
      // Delete rows no longer present
      if (existingIds.length > 0) {
        await supabase.from(tableName).delete().not('id', 'in', `(${existingIds.map(id => `"${id}"`).join(',')})`);
      }
    } else if (data && typeof data === 'object') {
      const row = mapper.toDb(data);
      await supabase.from(tableName).upsert(row, { onConflict: 'id' });
    }
  } catch (err) {
    console.error(`Error pushing cloud state for ${key}:`, err);
  }
}

export async function mergeAndPushCloudList(key, singleItem, currentList = []) {
  try {
    const nextList = [singleItem, ...currentList.filter(item => item.id !== singleItem.id)];
    await pushCloudState(key, nextList);
    return nextList;
  } catch (e) {
    console.error(`Error merging list for ${key}:`, e);
    return currentList;
  }
}

export async function pushRoleQuotas(tenureId, roles = []) {
  try {
    const existingQuotas = loadLocalCache('roleQuotas', {}) || {};
    const updated = {
      ...existingQuotas,
      [tenureId]: { roles, updatedAt: new Date().toISOString() }
    };
    await pushCloudState('roleQuotas', updated);
  } catch (e) {
    console.error('Error saving role quotas:', e);
  }
}

export async function uploadMediaToCloud(file, path) {
  try {
    const bucket = 'bapekkris-media';
    const filePath = `${path}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) {
      // try fallback bucket
      const { data: d2, error: err2 } = await supabase.storage.from('cnt-media').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
      if (err2) throw err2;
      const { data: pubData } = supabase.storage.from('cnt-media').getPublicUrl(filePath);
      return pubData.publicUrl;
    }
    const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return pubData.publicUrl;
  } catch (e) {
    console.error('Upload error:', e);
    throw e;
  }
}

export async function deleteMediaFromCloud(fullUrl) {
  try {
    if (!fullUrl) return;
    const urlParts = fullUrl.split('/storage/v1/object/public/');
    if (urlParts.length < 2) return;
    const rest = urlParts[1];
    const slashIdx = rest.indexOf('/');
    const bucket = rest.slice(0, slashIdx);
    const filePath = rest.slice(slashIdx + 1);
    await supabase.storage.from(bucket).remove([filePath]);
  } catch (e) {
    console.error('Delete media error:', e);
  }
}
