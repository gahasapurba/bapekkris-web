import { Field, Input, Textarea } from '../../../ui';
import { useEditBinding } from './useEditBinding';

/** Fields of the edit dialog for `sub_division` items. */
export default function SubDivisionFields() {
  const { bind } = useEditBinding();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama sub-divisi" required><Input placeholder="Contoh: Sie Multimedia" {...bind('name')} /></Field>
        <Field label="Kode singkat"><Input placeholder="Contoh: MULTI" {...bind('code', (v) => v.toUpperCase())} /></Field>
      </div>
      <Field label="Deskripsi tugas (opsional)"><Textarea rows={3} placeholder="Tugas atau tanggung jawab sub-divisi ini" {...bind('description')} /></Field>
    </div>
  );
}
