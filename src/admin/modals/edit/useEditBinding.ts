import type { ChangeEvent } from 'react';
import type { AppRecord } from '../../../lib/supabase';
import { useEditDialogContext } from '../../AdminPortalContext';

type ControlEvent = ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;

/**
 * Edit-dialog context plus helpers for the item being edited: `set` merges fields into it and
 * `bind` wires a text control to one field (optionally transforming the typed value).
 */
export function useEditBinding() {
  const context = useEditDialogContext();
  const { editingItem, setEditingItem } = context;
  const item = editingItem.item;
  const set = (patch: AppRecord) => setEditingItem({ ...editingItem, item: { ...item, ...patch } });
  const bind = (key: string, transform: (value: string) => unknown = (v) => v) => ({
    value: String(item[key] ?? ''),
    onChange: (e: ControlEvent) => set({ [key]: transform(e.target.value) })
  });
  return { ...context, item, set, bind };
}
