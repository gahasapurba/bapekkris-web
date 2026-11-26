import { Field, Input, Select, Textarea } from '../../../ui';
import { SONG_CATEGORIES } from '../../../data/contentOptions';
import { useEditBinding } from './useEditBinding';

/** Fields of the edit dialog for `song` items (same fields as the create form). */
export default function SongFields() {
  const { bind, item } = useEditBinding();
  const knownCategory = SONG_CATEGORIES.some((c) => c.value === item.category);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Judul" required><Input {...bind('title')} /></Field>
        <Field label="Nomor lagu"><Input placeholder="Contoh: KJ 002" {...bind('songNumber')} /></Field>
        <Field label="Kategori" required>
          <Select {...bind('category')}>
            {!knownCategory && item.category && <option value={item.category}>{item.category}</option>}
            {SONG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Nada dasar"><Input {...bind('keySignature')} /></Field>
        <Field label="Pencipta"><Input {...bind('author')} /></Field>
        <Field label="Tautan YouTube"><Input type="url" {...bind('youtubeUrl')} /></Field>
      </div>
      <Field label="Lirik" required hint="Pisahkan bait dengan satu baris kosong."><Textarea rows={10} {...bind('lyrics')} /></Field>
    </div>
  );
}
