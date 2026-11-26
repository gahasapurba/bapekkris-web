import { createContext, useContext } from 'react';
import type { useAdminPortalState } from './useAdminPortalState';

/**
 * State and handlers of the Admin Portal (src/admin/useAdminPortalState.ts), shared with the tabs
 * and modals in src/admin. Each tab's create form lives in the tab itself (react-hook-form via
 * useAdminDraftForm); half-filled values are kept in `formDrafts` while the tab is closed.
 */
export type AdminPortalContextValue = ReturnType<typeof useAdminPortalState>;

export const AdminPortalContext = createContext<AdminPortalContextValue | null>(null);

export function useAdminPortal(): AdminPortalContextValue {
  const value = useContext(AdminPortalContext);
  if (!value) throw new Error('useAdminPortal must be used inside AdminPortal');
  return value;
}

/** Context for the edit dialog and its field components, which only render while an item is open. */
export function useEditDialogContext() {
  const context = useAdminPortal();
  const { editingItem } = context;
  if (!editingItem) throw new Error('The edit dialog rendered without an item');
  return { ...context, editingItem };
}

/** Context for the delete confirmation, which only renders while a delete is pending. */
export function useDeleteDialogContext() {
  const context = useAdminPortal();
  const { deleteConfirm } = context;
  if (!deleteConfirm) throw new Error('The delete dialog rendered without a pending delete');
  return { ...context, deleteConfirm };
}
