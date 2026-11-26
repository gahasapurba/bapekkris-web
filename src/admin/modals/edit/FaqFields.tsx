import { Field, Input, Select, Textarea } from '../../../ui';
import { FAQ_CATEGORIES } from '../../tabs/FaqsTab';
import { useEditBinding } from './useEditBinding';

/** Fields of the edit dialog for `faq` items. */
export default function FaqFields() {
  const { bind, item, set } = useEditBinding();
  return (
    <div className="flex flex-col gap-4">
      <Field label="Kategori" required>
        <Select value={item.category || 'Umum'} onChange={(e) => set({ category: e.target.value })}>
          {FAQ_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </Field>
      <Field label="Pertanyaan" required><Input {...bind('question')} /></Field>
      <Field label="Jawaban" required><Textarea rows={5} {...bind('answer')} /></Field>
    </div>
  );
}
