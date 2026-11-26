// Choices and defaults shared by the admin forms, the data mappers and the public pages.

export const DEFAULT_DEVOTION_AUTHOR = 'Bapekkris Bank Mandiri';
export const DEFAULT_DEVOTION_THEME = 'Iman & Pengharapan';

/** Suggested devotion themes; admins may also type a new one. */
export const DEVOTION_THEMES = [
  'Iman & Pengharapan',
  'Integritas & Karakter Kristiani',
  'Kasih & Pelayanan',
  'Doa & Penyembahan',
  'Ucapan Syukur',
  'Hikmat dalam Pekerjaan',
  'Keluarga & Persekutuan',
  'Penghiburan & Kekuatan',
  'Adven & Natal',
  'Paskah & Kebangkitan'
];

/** Song categories; the first four are the built-in hymnal's categories. */
export const SONG_CATEGORIES = [
  { value: 'Kidung Jemaat', label: 'Kidung Jemaat (KJ)', short: 'Kidung Jemaat' },
  { value: 'Pelengkap Kidung Jemaat', label: 'Pelengkap Kidung Jemaat (PKJ)', short: 'PKJ' },
  { value: 'Nyanyikanlah Kidung Baru', label: 'Nyanyikanlah Kidung Baru (NKB)', short: 'NKB' },
  { value: 'Praise & Worship', label: 'Praise & Worship', short: 'Praise & Worship' },
  { value: 'Lagu Rohani Lainnya', label: 'Lagu rohani lainnya', short: 'Lainnya' }
] as const;
export const DEFAULT_SONG_CATEGORY = SONG_CATEGORIES[0].value;
export const DEFAULT_SONG_KEY = 'C';
