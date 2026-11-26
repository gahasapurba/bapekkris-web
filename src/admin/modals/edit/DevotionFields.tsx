import { Field, Input, Textarea } from '../../../ui';
import { devotionThemeOptions } from '../../tabs/DevotionsTab';
import { useEditBinding } from './useEditBinding';

/** Fields of the edit dialog for `devotion` items (same fields as the create form). */
export default function DevotionFields() {
  const { bind, devotions } = useEditBinding();
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tanggal" required><Input type="date" {...bind('devotionDate')} /></Field>
        <Field label="Judul" required><Input {...bind('title')} /></Field>
        <Field label="Tema" required hint="Pilih dari daftar atau ketik tema baru."><Input list="edit-devotion-theme-options" {...bind('theme')} /></Field>
        <Field label="Nats Alkitab"><Input {...bind('scriptureRef')} /></Field>
        <Field label="Penulis" className="md:col-span-2"><Input {...bind('author')} /></Field>
      </div>
      <datalist id="edit-devotion-theme-options">
        {devotionThemeOptions(devotions).map((t) => <option key={t} value={t} />)}
      </datalist>
      <Field label="Isi ayat"><Textarea rows={2} {...bind('scriptureText')} /></Field>
      <Field label="Isi renungan" required><Textarea rows={7} {...bind('body')} /></Field>
      <Field label="Doa penutup"><Textarea rows={2} {...bind('prayer')} /></Field>
    </div>
  );
}
