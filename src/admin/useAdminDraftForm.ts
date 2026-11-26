import { useEffect, useRef } from 'react';
import { useForm, type DefaultValues, type FieldValues, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAdminPortal } from './AdminPortalContext';

/**
 * react-hook-form for an admin tab's create form whose half-filled values survive switching
 * tabs: on unmount the values are parked in AdminPortal's draft store and restored on return.
 * Validation runs on submit (as before) and a field's error clears when it is edited.
 */
export function useAdminDraftForm<T extends FieldValues>(
  draftKey: string,
  /** The schema, or a function building it from the current values (rules that depend on data). */
  schema: z.ZodType | ((values: T) => z.ZodType),
  defaultValues: DefaultValues<T>
) {
  const { formDrafts } = useAdminPortal();
  const saved = formDrafts.current.get(draftKey) as DefaultValues<T> | undefined;
  // Read at validation time, so data-dependent rules always see the latest data.
  const schemaRef = useRef(schema);
  schemaRef.current = schema;
  // The admin schemas preprocess missing values to '' (input type unknown); form values are always
  // strings/booleans, so the resolver is typed to the form's own shape.
  const resolver: Resolver<T> = (values, context, options) => {
    const current = schemaRef.current;
    const built = typeof current === 'function' ? current(values) : current;
    // raw: hand the submit handler the form values as typed; the schema only validates (a parsed
    // result would drop fields the schema does not mention, such as optional inputs).
    return (zodResolver(built as never, undefined, { raw: true }) as unknown as Resolver<T>)(values, context, options);
  };
  const form = useForm<T>({ mode: 'onSubmit', reValidateMode: 'onSubmit', resolver, defaultValues: saved ?? defaultValues });
  const getValuesRef = useRef(form.getValues);
  getValuesRef.current = form.getValues;

  useEffect(() => () => { formDrafts.current.set(draftKey, getValuesRef.current()); }, [draftKey, formDrafts]);

  /** Empties the form after a successful save. */
  const resetToDefaults = () => {
    form.reset(defaultValues);
    formDrafts.current.delete(draftKey);
  };

  /** register() that also clears the field's error as soon as it is edited. */
  const field = (name: Parameters<typeof form.register>[0], rules?: Parameters<typeof form.register>[1]) =>
    form.register(name, { ...rules, onChange: (e: unknown) => { form.clearErrors(name); rules?.onChange?.(e); } });

  return { ...form, resetToDefaults, field };
}
