// Accessors for registration-form metadata stored on forms rows.
import type { AppItem } from '../lib/supabase';
import type { FormField } from '../types/content';

/** The form's field definitions (forms.fields). */
export function getFormFields(form: AppItem | null | undefined): FormField[] {
  return Array.isArray(form?.fields) ? form.fields : [];
}
