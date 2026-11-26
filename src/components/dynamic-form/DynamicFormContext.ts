import { createContext, useContext } from 'react';
import type { DynamicFormState } from './useDynamicForm';

export const DynamicFormContext = createContext<DynamicFormState | null>(null);

export function useDynamicFormContext(): DynamicFormState {
  const value = useContext(DynamicFormContext);
  if (!value) throw new Error('useDynamicFormContext must be used inside DynamicFormSection');
  return value;
}
