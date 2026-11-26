/** Normalizes an Indonesian phone number for wa.me links (0812… → 62812…). */
export function formatWaPhone(raw: string | number | null = ''): string {
  const digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  return digits;
}

export const SYNC_BADGE = {
  syncing: { label: 'Menyinkronkan Cloud...', color: 'var(--mandiri-gold)', background: 'rgba(255, 184, 0, 0.15)' },
  synced: { label: 'Cloud Sync Aktif (Multi-Device)', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)' },
  error: { label: 'Sebagian data gagal dimuat dari Cloud', color: '#dc2626', background: 'rgba(220, 38, 38, 0.12)' }
} as const;

/** Ministry categories offered for events (older events may carry other, free-text categories). */
export const EVENT_CATEGORIES = [
  'Ibadah',
  'Persekutuan Doa',
  'Pembinaan & Retreat',
  'Perayaan Hari Raya',
  'Pelayanan Kasih & Bakti Sosial',
  'Workshop & Sharing',
  'Kebersamaan & Olahraga'
];

/** Tabs a division admin may open; super admins see every tab plus account management. */
export const DIVISION_ADMIN_TABS = ['members', 'events', 'forms', 'submissions', 'gallery'];
