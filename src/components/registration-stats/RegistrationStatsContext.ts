import { createContext, useContext } from 'react';
import type { RegistrationStatsState } from './EventRegistrationStats';

export const RegistrationStatsContext = createContext<RegistrationStatsState | null>(null);

export function useRegistrationStats(): RegistrationStatsState {
  const value = useContext(RegistrationStatsContext);
  if (!value) throw new Error('useRegistrationStats must be used inside EventRegistrationStats');
  return value;
}
