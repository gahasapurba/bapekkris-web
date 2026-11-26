// Reading participant details out of a submission's free-form data (keyed by field id, or by
// label in older submissions). Shared by the welcome alert, check-in list, lucky draw and winners.
import type { FormField } from '../../types/content';

export type SubmissionData = Record<string, unknown>;

const NAME_KEYS = ['f-fullName', 'f-name', 'fullName', 'namaLengkap', 'nama', 'name'];
const looksLikeName = (text: string) => /nama|name/i.test(text);
const text = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '');

/** A field's answer; older submissions stored answers under the field label. */
export function fieldValue(data: SubmissionData | null | undefined, field: Pick<FormField, 'id' | 'label'> | null | undefined): unknown {
  if (!data || !field) return undefined;
  return data[field.label] ?? data[field.id];
}

/**
 * The participant's name: a standard name key, then a form field labelled as a name, then any
 * data key that looks like a name. Empty string when the form has no name field.
 */
export function participantName(data: SubmissionData | null | undefined, fields: FormField[] = []): string {
  if (!data) return '';
  for (const key of NAME_KEYS) {
    const value = text(data[key]);
    if (value) return value;
  }
  for (const field of fields) {
    if (!looksLikeName(field.label || '') && !looksLikeName(field.id || '')) continue;
    const value = text(data[field.id] ?? data[field.label]);
    if (value) return value;
  }
  for (const [key, raw] of Object.entries(data)) {
    const value = text(raw);
    if (value && looksLikeName(key)) return value;
  }
  return '';
}

/** Name to show for a lucky-draw winner: the name, else the first field's answer, else any answer. */
export function winnerNameFrom(data: SubmissionData | null | undefined, fields: FormField[] = []): string {
  const name = participantName(data, fields);
  if (name || !data) return name;
  const first = text(fieldValue(data, fields[0]));
  if (first) return first;
  return Object.values(data).map(text).find(Boolean) || '';
}

const firstMatching = (data: SubmissionData, pattern: RegExp) => {
  const entry = Object.entries(data).find(([key, value]) => pattern.test(key) && text(value));
  return entry ? text(entry[1]) : '';
};

export interface ParticipantInfo {
  id: string;
  name: string;
  department: string;
  identifier: string;
}

/** Name, unit and a contact/identity value used to tell lucky-draw candidates apart. */
export function participantInfo(submission: { id: string; data?: SubmissionData | null }, fields: FormField[] = []): ParticipantInfo {
  const data = submission.data || {};
  return {
    id: submission.id,
    name: participantName(data, fields) || `Pendaftar #${submission.id.slice(-4)}`,
    department: firstMatching(data, /departemen|divisi|unit|dept/i) || 'Bank Mandiri',
    identifier: firstMatching(data, /email|whatsapp|hp|telepon|nip/i) || '-'
  };
}
