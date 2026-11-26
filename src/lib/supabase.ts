import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { toWibIsoDate } from '../utils/dateUtils';
import type { Database, Json, Tables } from '../types/database';

const supabaseUrl: string = import.meta.env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey: string = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Untyped view of the same client, used only where the table name is chosen at runtime
 * (generic row writes). Typed access should go through `supabase`.
 */
const dynamicDb = supabase as unknown as SupabaseClient;

/**
 * Item shape held in web state (camelCase). Components are still JavaScript, so this stays
 * loose until the state itself is typed (TanStack Query step).
 */
export interface AppItem {
  id: string;
  [key: string]: any;
}

/** Loose object that is not a table row (settings values, option bags). */
export type AppRecord = Record<string, any>;

type DbFunctions = Database['public']['Functions'];

const LOCAL_PREFIX = 'bapekkris_mandiri_v1_';

export function loadLocalCache<T>(key: string, fallbackValue: T): T {
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

export function saveLocalCache(key: string, value: unknown): void {
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
  members: 'members',
  events: 'events',
  galleries: 'galleries',
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
} as const satisfies Record<string, keyof Database['public']['Tables']>;

export type TableKey = keyof typeof TABLE_MAP;

interface LuckyDrawDetails {
  winnerName?: string;
  winnerIdentifier?: string;
  winnerDepartment?: string;
  drawNumber?: number;
  source?: string;
  drawnFieldLabel?: string;
  drawnFieldValue?: string;
  submissionData?: Record<string, unknown>;
}

interface RowMapper<K extends TableKey> {
  toDb: (item: AppItem) => Record<string, unknown>;
  fromDb: (row: Tables<(typeof TABLE_MAP)[K]>) => AppItem;
}

export const rowMappers: { [K in TableKey]: RowMapper<K> } = {
  tenures: {
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"tenures">) => ({
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
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"tenure_roles">) => ({
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

  divisions: {
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"divisions">) => ({
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
    toDb: (item: AppItem) => ({
      id: String(item.id),
      division_id: String(item.divisionId || item.division_id),
      name: String(item.name || '').trim(),
      code: item.code || null,
      description: item.description || null,
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"sub_divisions">) => ({
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
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"members">) => ({
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
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"events">) => ({
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
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"galleries">) => ({
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

  forms: {
    toDb: (item: AppItem) => ({
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
      is_show_accepted: Boolean(item.showAnnouncement),
      is_limited: Boolean(item.isLimited),
      max_quota: Number(item.maxQuota || 0),
      is_event_connected: Boolean(item.isEventConnected),
      is_lucky_draw: Boolean(item.isLuckyDraw),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"forms">) => ({
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
      showAnnouncement: Boolean(row.is_show_accepted),
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
    toDb: (item: AppItem) => ({
      id: String(item.id),
      form_id: item.formId,
      data: item.data || {},
      files: item.files || {},
      status: item.status || 'Submitted',
      admin_notes: item.adminNotes || '',
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"submissions">) => ({
      id: row.id,
      formId: row.form_id,
      data: row.data || {},
      files: row.files || {},
      status: row.status || 'Submitted',
      adminNotes: row.admin_notes || '',
      checkedInAt: row.checked_in_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  brandAssets: {
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"brand_assets">) => ({
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
    toDb: (item: AppItem) => ({
      id: String(item.id),
      event_id: item.eventId,
      attendee_name: item.attendeeName || '',
      attendance_mode: item.attendanceMode || 'Hadir Onsite',
      notes: item.notes || '',
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"event_rsvps">) => ({
      id: row.id,
      eventId: row.event_id,
      attendeeName: row.attendee_name,
      attendanceMode: row.attendance_mode || 'Hadir Onsite',
      notes: row.notes || '',
      sortOrder: Number(row.sort_order || 0),
      checkedInAt: row.checked_in_at || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    })
  },

  faqs: {
    toDb: (item: AppItem) => ({
      id: String(item.id),
      question: item.question,
      answer: item.answer,
      category: item.category || 'Umum',
      asked_by: item.askedBy || 'Admin Bapekkris',
      is_published: Boolean(item.isPublished !== false),
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"faqs">) => ({
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
    toDb: (item: AppItem) => ({
      id: String(item.id),
      event_id: item.eventId,
      submission_id: item.submissionId,
      form_id: item.formId || null,
      prize_name: item.prizeName || item.prizeTitle || 'Doorprize Utama',
      drawn_at: item.drawnAt || new Date().toISOString(),
      sort_order: Number(item.drawNumber || item.sortOrder || 0),
      details: {
        winnerName: item.winnerName || '',
        winnerIdentifier: item.winnerIdentifier || '',
        winnerDepartment: item.winnerDepartment || '',
        drawNumber: Number(item.drawNumber || 0),
        source: item.source || '',
        drawnFieldLabel: item.drawnFieldLabel || '',
        drawnFieldValue: item.drawnFieldValue || '',
        submissionData: item.submissionData || {}
      },
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"lucky_draws">) => {
      const details = (row.details || {}) as LuckyDrawDetails;
      return {
        id: row.id,
        eventId: row.event_id,
        submissionId: row.submission_id,
        formId: row.form_id,
        prizeName: row.prize_name,
        prizeTitle: row.prize_name,
        drawnAt: row.drawn_at,
        winnerName: details.winnerName || '',
        winnerIdentifier: details.winnerIdentifier || '-',
        winnerPhone: details.winnerIdentifier || '-',
        winnerDepartment: details.winnerDepartment || '',
        winnerUnit: details.winnerDepartment || '',
        drawNumber: Number(details.drawNumber || row.sort_order || 0),
        source: details.source || '',
        drawnFieldLabel: details.drawnFieldLabel || '',
        drawnFieldValue: details.drawnFieldValue || '',
        submissionData: details.submissionData || {},
        sortOrder: Number(row.sort_order || 0),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    }
  },

  devotions: {
    toDb: (item: AppItem) => ({
      id: String(item.id),
      title: String(item.title || '').trim(),
      devotion_date: item.devotionDate || toWibIsoDate(),
      scripture_ref: String(item.scriptureRef || '').trim(),
      scripture_text: item.scriptureText || '',
      body: String(item.body || '').trim(),
      prayer: item.prayer || '',
      author: item.author || 'Bapekkris Bank Mandiri',
      theme: item.theme || 'Iman & Pengharapan',
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"daily_devotions">) => ({
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
    toDb: (item: AppItem) => ({
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
    fromDb: (row: Tables<"worship_songs">) => ({
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
    toDb: (item: AppItem) => ({
      id: String(item.id),
      event_id: item.eventId || null,
      title: String(item.title || '').trim(),
      service_date: item.serviceDate || '',
      items: Array.isArray(item.items) ? item.items : [],
      theme_settings: item.themeSettings || {},
      sort_order: Number(item.sortOrder || 0),
      updated_at: new Date().toISOString()
    }),
    fromDb: (row: Tables<"easy_worship_schedules">) => ({
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
// DATA FETCHING
// ============================================================================

// Tables holding personal data of registrants: readable by authorized admins only and
// never persisted in the browser cache.
export const PRIVATE_TABLE_KEYS: readonly TableKey[] = ['submissions', 'eventRsvps', 'luckyDraws'];
PRIVATE_TABLE_KEYS.forEach((key) => {
  try { localStorage.removeItem(LOCAL_PREFIX + key); } catch (e) { /* storage unavailable */ }
});

export function isPrivateTableKey(key: TableKey): boolean {
  return PRIVATE_TABLE_KEYS.includes(key);
}

const FETCH_ORDER: Record<TableKey, string> = {
  tenures: 'sort_order',
  divisions: 'sort_order',
  subDivisions: 'sort_order',
  members: 'sort_order',
  events: 'sort_order',
  galleries: 'sort_order',
  forms: 'sort_order',
  submissions: 'created_at',
  brandAssets: 'sort_order',
  eventRsvps: 'created_at',
  faqs: 'sort_order',
  tenureRoles: 'sort_order',
  luckyDraws: 'drawn_at',
  devotions: 'devotion_date',
  worshipSongs: 'sort_order',
  easyWorshipSchedules: 'created_at'
};
const DESCENDING_ORDER = new Set(['created_at', 'drawn_at', 'devotion_date']);

export const TABLE_KEYS = Object.keys(FETCH_ORDER) as TableKey[];

/** Web-state key of a database table, for routing realtime change events. */
export const TABLE_KEY_BY_DB_TABLE: Record<string, TableKey> = Object.fromEntries(
  TABLE_KEYS.map((key) => [TABLE_MAP[key], key])
);

const SETTING_KEYS = {
  pageVisibility: 'page_visibility',
  activeTenureId: 'active_tenure_id',
  announcementBar: 'announcement_bar',
  roleQuotas: 'role_quotas'
} as const;

export type SettingKey = keyof typeof SETTING_KEYS;

export interface RegistrationCounts {
  forms: Record<string, number>;
  events: Record<string, number>;
}

export interface PageSettings {
  pageVisibility?: AppItem;
  activeTenureId?: string;
  announcementBar?: AppItem;
  roleQuotas?: Json;
}

const SETTING_STATE_KEYS = Object.keys(SETTING_KEYS) as SettingKey[];

/**
 * Loads one table (mapped to web-state shape). Throws on failure so the caller keeps the data it
 * already has instead of mistaking a failed request for an empty table. Public tables are also
 * cached in localStorage for an instant first paint on the next visit.
 */
export async function fetchTableRows(key: TableKey): Promise<AppItem[]> {
  const column = FETCH_ORDER[key];
  const { data, error } = await dynamicDb
    .from(tableFor(key))
    .select('*')
    .order(column, { ascending: !DESCENDING_ORDER.has(column) });
  if (error || !Array.isArray(data)) {
    throw new Error(`Gagal memuat data ${tableFor(key)}: ${error?.message || 'respons tidak valid'}`);
  }
  // Rows come from the table that `key` maps to, so they match that mapper's row type.
  const fromDb = rowMappers[key].fromDb as (row: unknown) => AppItem;
  const rows = data.map(fromDb);
  if (!isPrivateTableKey(key)) saveLocalCache(key, rows);
  return rows;
}

/** Last page settings stored in this browser, used until the server responds. */
export function loadCachedPageSettings(): PageSettings {
  const cached: PageSettings = {};
  for (const key of SETTING_STATE_KEYS) {
    const value = loadLocalCache<unknown>(key, undefined);
    if (value !== undefined && value !== null) (cached as Record<string, unknown>)[key] = value;
  }
  return cached;
}

export async function fetchPageSettings(): Promise<PageSettings> {
  const { data, error } = await supabase.from('page_settings').select('*');
  if (error || !Array.isArray(data)) {
    throw new Error(`Gagal memuat pengaturan halaman: ${error?.message || 'respons tidak valid'}`);
  }
  const result: PageSettings = {};
  for (const row of data) {
    if (!row.value) continue;
    const value = row.value as AppItem;
    if (row.key === SETTING_KEYS.pageVisibility) {
      result.pageVisibility = { ...value, _updatedAt: row.updated_at };
    } else if (row.key === SETTING_KEYS.activeTenureId && value.id) {
      result.activeTenureId = value.id;
    } else if (row.key === SETTING_KEYS.announcementBar) {
      result.announcementBar = { ...value, _updatedAt: row.updated_at };
    } else if (row.key === SETTING_KEYS.roleQuotas) {
      result.roleQuotas = row.value;
    }
  }
  SETTING_STATE_KEYS.forEach((key) => {
    if (result[key] !== undefined) saveLocalCache(key, result[key]);
  });
  return result;
}

/** Aggregated registration counts for visitors, who cannot read submissions or RSVPs. */
export async function fetchRegistrationCounts(): Promise<RegistrationCounts> {
  const { data, error } = await supabase.rpc('get_registration_counts');
  if (error || !Array.isArray(data)) {
    throw new Error(`Gagal memuat jumlah pendaftar: ${error?.message || 'respons tidak valid'}`);
  }
  const counts: RegistrationCounts = { forms: {}, events: {} };
  data.forEach(({ kind, ref_id: refId, total }) => {
    if (kind === 'form') counts.forms[refId] = total;
    if (kind === 'event') counts.events[refId] = total;
  });
  return counts;
}

// ============================================================================
// ROW-LEVEL WRITES
// Every write targets explicit rows and throws when Supabase reports an error,
// so callers can roll back or inform the user instead of silently diverging.
// ============================================================================

const WRITE_CHUNK_SIZE = 200;
const DELETE_CHUNK_SIZE = 100;

function tableFor(key: TableKey): string {
  const table = TABLE_MAP[key];
  if (!table) throw new Error(`Tabel untuk "${key}" tidak dikenal`);
  return table;
}

function assertOk(response: { error: { message: string } | null }, action: string): void {
  if (response.error) {
    throw new Error(`${action}: ${response.error.message}`);
  }
}

function chunk<T>(list: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
}

type RowId = string | number;

/** Inserts a new row without overwriting an existing one (used for public submissions). */
export async function insertRow(key: TableKey, item: AppItem): Promise<void> {
  const table = tableFor(key);
  assertOk(await dynamicDb.from(table).insert(rowMappers[key].toDb(item)), `Gagal menambah data ${table}`);
}

export async function insertRows(key: TableKey, items: AppItem[]): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;
  const table = tableFor(key);
  for (const part of chunk(items, WRITE_CHUNK_SIZE)) {
    assertOk(await dynamicDb.from(table).insert(part.map(rowMappers[key].toDb)), `Gagal menambah data ${table}`);
  }
}

/** Creates or updates a single row identified by its id. */
export async function saveRow(key: TableKey, item: AppItem): Promise<void> {
  const table = tableFor(key);
  assertOk(
    await dynamicDb.from(table).upsert(rowMappers[key].toDb(item), { onConflict: 'id' }),
    `Gagal menyimpan data ${table}`
  );
}

/** Creates or updates several rows. Never deletes rows that are absent from the list. */
export async function saveRows(key: TableKey, items: AppItem[]): Promise<void> {
  if (!Array.isArray(items) || items.length === 0) return;
  const table = tableFor(key);
  for (const part of chunk(items, WRITE_CHUNK_SIZE)) {
    assertOk(
      await dynamicDb.from(table).upsert(part.map(rowMappers[key].toDb), { onConflict: 'id' }),
      `Gagal menyimpan data ${table}`
    );
  }
}

export async function deleteRow(key: TableKey, id: RowId): Promise<void> {
  const table = tableFor(key);
  assertOk(await dynamicDb.from(table).delete().eq('id', String(id)), `Gagal menghapus data ${table}`);
}

export async function deleteRows(key: TableKey, ids: RowId[]): Promise<void> {
  if (!Array.isArray(ids) || ids.length === 0) return;
  const table = tableFor(key);
  for (const part of chunk(ids.map(String), DELETE_CHUNK_SIZE)) {
    assertOk(await dynamicDb.from(table).delete().in('id', part), `Gagal menghapus data ${table}`);
  }
}

export async function deleteRowsWhere(key: TableKey, column: string, value: unknown): Promise<void> {
  const table = tableFor(key);
  assertOk(await dynamicDb.from(table).delete().eq(column, value), `Gagal menghapus data ${table}`);
}

export async function saveSetting(key: SettingKey, value: unknown): Promise<void> {
  const settingKey = SETTING_KEYS[key];
  if (!settingKey) throw new Error(`Pengaturan "${key}" tidak dikenal`);
  const storedValue = (key === 'activeTenureId' ? { id: value } : value) as Json;
  assertOk(
    await supabase.from('page_settings').upsert({ key: settingKey, value: storedValue, updated_at: new Date().toISOString() }),
    `Gagal menyimpan pengaturan ${settingKey}`
  );
  saveLocalCache(key, value);
}

// ============================================================================
// PUBLIC RPC (registrations go through database functions that enforce
// deadline, quota and uniqueness atomically and expose only what is needed)
// ============================================================================

const RPC_ERROR_MESSAGES: Record<string, string> = {
  FORM_NOT_FOUND: 'Formulir tidak ditemukan atau sudah dihapus.',
  FORM_CLOSED: 'Formulir ini sedang ditutup.',
  FORM_DEADLINE_PASSED: 'Batas waktu pendaftaran formulir ini telah berakhir.',
  FORM_QUOTA_FULL: 'Maaf, kuota pendaftaran formulir ini telah terpenuhi.',
  FORM_DUPLICATE: 'Data pada field unik sudah pernah didaftarkan sebelumnya.',
  EVENT_NOT_FOUND: 'Acara tidak ditemukan atau tidak dibuka untuk umum.',
  RSVP_QUOTA_FULL: 'Maaf, kuota kehadiran acara ini telah terpenuhi.',
  INVALID_PAYLOAD: 'Data yang dikirim tidak valid.',
  PAYLOAD_TOO_LARGE: 'Data yang dikirim terlalu besar.',
  NOT_AUTHORIZED: 'Anda tidak memiliki izin untuk tindakan ini.',
  USER_NOT_FOUND: 'Email belum terdaftar di Supabase Authentication. Buat akunnya terlebih dahulu.',
  CANNOT_DEMOTE_SELF: 'Anda tidak dapat menurunkan peran akun Anda sendiri.',
  CANNOT_REVOKE_SELF: 'Anda tidak dapat mencabut akses akun Anda sendiri.'
};

/** Error raised by an RPC, carrying the machine-readable code and a user-facing message. */
export class RpcError extends Error {
  code: string | null;
  detail: string | undefined;

  constructor(code: string, detail: string | undefined, rawMessage?: string) {
    const isKnown = Object.prototype.hasOwnProperty.call(RPC_ERROR_MESSAGES, code);
    super(isKnown ? RPC_ERROR_MESSAGES[code] : (rawMessage || 'Terjadi kesalahan pada server.'));
    // Only business-rule rejections carry a code; network or permission failures do not.
    this.code = isKnown ? code : null;
    this.detail = detail;
  }
}

async function callRpc<F extends keyof DbFunctions>(
  name: F,
  params: DbFunctions[F]['Args']
): Promise<DbFunctions[F]['Returns']> {
  // The generic overloads of `rpc` do not narrow on a union name, so call through the untyped view.
  const { data, error } = await dynamicDb.rpc(name as string, params as Record<string, unknown>);
  if (error) {
    const [code, detail] = String(error.message || '').split(':');
    throw new RpcError(code, detail, error.message);
  }
  return data as DbFunctions[F]['Returns'];
}

/** Submits a public form. Returns the registration id generated by the database. */
export function submitFormRegistration(formId: string, data: Json, files: Json = {}) {
  return callRpc('submit_form', { p_form_id: formId, p_data: data, p_files: files });
}

/** Submits a public RSVP. Returns the RSVP id generated by the database. */
export function submitEventRsvp(eventId: string, attendeeName: string, attendanceMode: string, notes = '') {
  return callRpc('submit_rsvp', {
    p_event_id: eventId,
    p_attendee_name: attendeeName,
    p_attendance_mode: attendanceMode,
    p_notes: notes
  });
}

export async function fetchEventAttendees(eventId: string) {
  const rows = await callRpc('get_event_attendees', { p_event_id: eventId });
  return (rows || []).map((row) => ({
    id: row.id,
    eventId,
    attendeeName: row.attendee_name,
    attendanceMode: row.attendance_mode,
    createdAt: row.created_at
  }));
}

export function isSubmissionValueTaken(formId: string, fieldId: string, value: string) {
  return callRpc('is_submission_value_taken', { p_form_id: formId, p_field_id: fieldId, p_value: value });
}

export async function trackSubmissions(query: string) {
  const rows = await callRpc('track_submissions', { p_query: query });
  return (rows || []).map((row) => ({
    id: row.id,
    formId: row.form_id,
    status: row.status,
    adminNotes: row.admin_notes || '',
    data: row.data || {},
    createdAt: row.created_at
  }));
}

export async function fetchAcceptedSubmissions(formId: string) {
  const rows = await callRpc('get_accepted_submissions', { p_form_id: formId });
  return (rows || []).map((row) => ({
    id: row.id,
    formId: row.form_id,
    createdAt: row.created_at,
    adminNotes: row.admin_notes || '',
    participantName: row.participant_name,
    participantDetail: row.participant_detail
  }));
}

// ============================================================================
// ADMIN AUTHENTICATION (Supabase Auth + admin_profiles roles)
// ============================================================================

export interface AdminProfile {
  userId: string;
  email: string;
  displayName: string;
  role: string;
  divisionId: string | null;
}

function mapAdminProfile(row: Tables<'admin_profiles'>): AdminProfile {
  return {
    userId: row.user_id,
    email: row.email,
    displayName: row.display_name || '',
    role: row.role,
    divisionId: row.division_id || null
  };
}

/** Returns the admin profile of the signed-in user, or null when the user is not an admin. */
export async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  const { data, error } = await supabase.from('admin_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(`Gagal memuat profil admin: ${error.message}`);
  return data ? mapAdminProfile(data) : null;
}

export async function signInAdmin(email: string, password: string): Promise<AdminProfile> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    throw new Error(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message);
  }
  const profile = await fetchAdminProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('Akun ini belum memiliki akses admin. Hubungi super admin.');
  }
  return profile;
}

/**
 * Changes the signed-in admin's password. The current password is verified first by signing in
 * again, which also gives the fresh session Supabase requires for a password change.
 */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Sesi admin tidak ditemukan. Silakan masuk kembali.');

  const verify = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (verify.error) {
    throw new Error(verify.error.message === 'Invalid login credentials' ? 'Password saat ini salah' : verify.error.message);
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    throw new Error(error.code === 'same_password'
      ? 'Password baru harus berbeda dari password saat ini'
      : `Gagal mengganti password: ${error.message}`);
  }
}

export async function signOutAdmin(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function listAdminProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase.from('admin_profiles').select('*').order('created_at', { ascending: true });
  if (error) throw new Error(`Gagal memuat daftar admin: ${error.message}`);
  return data.map(mapAdminProfile);
}

export function assignAdminRole(email: string, role: string, divisionId?: string | null, displayName = '') {
  return callRpc('assign_admin_role', {
    p_email: email,
    p_role: role,
    // The database accepts NULL for super admins; the generated type only models "omitted".
    p_division_id: (divisionId || null) as string | undefined,
    p_display_name: displayName
  });
}

export function revokeAdminRole(userId: string) {
  return callRpc('revoke_admin_role', { p_user_id: userId });
}

// ============================================================================
// EVENT CHECK-IN (admins of the event only)
// ============================================================================

export type CheckInStatus = 'checked_in' | 'already' | 'not_found';
export interface CheckInResult {
  status: CheckInStatus;
  kind: 'rsvp' | 'submission' | null;
  registrationId: string | null;
  checkedInAt: string | null;
}

/** Marks a registration (scanned ID or typed search-index value such as NIP) as present. */
export async function checkInRegistration(eventId: string, code: string): Promise<CheckInResult> {
  const rows = await callRpc('check_in_registration', { p_event_id: eventId, p_code: code });
  const row = rows?.[0];
  return {
    status: (row?.status as CheckInStatus) || 'not_found',
    kind: (row?.kind as CheckInResult['kind']) || null,
    registrationId: row?.registration_id || null,
    checkedInAt: row?.checked_in_at || null
  };
}

export function undoCheckIn(eventId: string, registrationId: string) {
  return callRpc('undo_check_in', { p_event_id: eventId, p_registration_id: registrationId });
}

// ============================================================================
// MEDIA STORAGE
// ============================================================================

const MEDIA_BUCKET = 'bapekkris-media';

function uniqueSuffix(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function uploadMediaToCloud(file: File, path: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${path}/${uniqueSuffix()}_${safeName}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

/** Best-effort removal of a stored file. Returns false when the file could not be removed. */
export async function deleteMediaFromCloud(fullUrl: string | null | undefined): Promise<boolean> {
  if (!fullUrl) return false;
  const urlParts = fullUrl.split('/storage/v1/object/public/');
  if (urlParts.length < 2) return false;
  const rest = urlParts[1];
  const slashIdx = rest.indexOf('/');
  if (slashIdx < 0) return false;
  const bucket = rest.slice(0, slashIdx);
  const filePath = decodeURIComponent(rest.slice(slashIdx + 1));
  const { error } = await supabase.storage.from(bucket).remove([filePath]);
  if (error) {
    console.error('Gagal menghapus berkas media:', error.message);
    return false;
  }
  return true;
}
