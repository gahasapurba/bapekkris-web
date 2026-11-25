import { createContext, useContext } from 'react';
import type { ProgramSectionState } from './ProgramSection';

export const ProgramSectionContext = createContext<ProgramSectionState | null>(null);

export function useProgramSectionContext(): ProgramSectionState {
  const value = useContext(ProgramSectionContext);
  if (!value) throw new Error('useProgramSectionContext must be used inside ProgramSection');
  return value;
}
