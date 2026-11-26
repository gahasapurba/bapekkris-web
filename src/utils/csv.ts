import { downloadBlob } from './download';

/** Downloads rows as a UTF-8 CSV (with BOM so Excel reads Indonesian characters). */
export function downloadCsv(fileName: string, header: string[], rows: unknown[][]): void {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '﻿' + [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), fileName);
}
