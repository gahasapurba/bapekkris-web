import { createContext, useContext } from 'react';
import type { AppItem } from '../../lib/supabase';
import type { RegistrationStatsState } from './useEventRegistrationStats';

/** Hook state as seen by the sections, which only render once the event has been found. */
export type RegistrationStatsContextValue = Omit<RegistrationStatsState, 'event'> & { event: AppItem };

export const RegistrationStatsContext = createContext<RegistrationStatsContextValue | null>(null);

export function useRegistrationStats(): RegistrationStatsContextValue {
  const value = useContext(RegistrationStatsContext);
  if (!value) throw new Error('useRegistrationStats must be used inside EventRegistrationStats');
  return value;
}
