import { Field, Input, Textarea } from '../../../ui';
import { useEditBinding } from './useEditBinding';

/** Fields of the edit dialog for `tenure` items. */
export default function TenureFields() {
  const { bind, item, set } = useEditBinding();
  const misiText = item.rawMisi !== undefined ? item.rawMisi : Array.isArray(item.misi) ? item.misi.join('\n') : (item.misi || '');
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama kepengurusan" required><Input {...bind('title')} /></Field>
        <Field label="Tagline tema"><Input {...bind('themeTagline')} /></Field>
        <Field label="Judul hero beranda"><Input {...bind('heroHeadline')} /></Field>
        <Field label="Sorotan judul hero"><Input {...bind('heroHighlight')} /></Field>
      </div>
      <Field label="Visi"><Textarea rows={3} {...bind('visi')} /></Field>
      <Field label="Misi" hint="Satu baris untuk setiap poin misi.">
        <Textarea rows={4} placeholder="Tulis poin misi, satu per baris" value={misiText}
          onChange={(e) => set({ rawMisi: e.target.value, misi: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })} />
      </Field>
    </div>
  );
}
