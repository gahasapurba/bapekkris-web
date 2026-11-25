import type { BadgeTone } from '../../ui';

/** Registration status as shown to the applicant (English and Indonesian values are both stored). */
export function submissionStatus(status: string | undefined): { label: string; tone: BadgeTone } {
  switch (status) {
    case 'Accepted': case 'Diterima': case 'Diterima ✓': return { label: 'Diterima', tone: 'success' };
    case 'Interview': case 'Wawancara': return { label: 'Wawancara', tone: 'navy' };
    case 'Reviewed': case 'Direview': return { label: 'Sedang direview', tone: 'gold' };
    case 'Rejected': case 'Ditolak': return { label: 'Belum lolos', tone: 'danger' };
    default: return { label: 'Baru masuk', tone: 'info' };
  }
}
