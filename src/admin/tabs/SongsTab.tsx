import { Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { Badge, Button, Field, Input, Select, Textarea, useFeedback } from '../../ui';
import { DEFAULT_SONG_CATEGORY, DEFAULT_SONG_KEY, SONG_CATEGORIES } from '../../data/contentOptions';
import { songSchema } from '../validation/schemas';
import { toSongItem, type SongValues } from '../contentItems';
import { useAdminDraftForm } from '../useAdminDraftForm';
import { AdminEmpty, AdminList, AdminListRow, AdminPanel, AdminSubsection, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

const EMPTY_SONG: SongValues = { title: '', songNumber: '', category: DEFAULT_SONG_CATEGORY, keySignature: DEFAULT_SONG_KEY, author: '', youtubeUrl: '', lyrics: '' };

export default function SongsTab() {
  const { onAddWorshipSong, onDeleteWorshipSong, setEditingItem, setSongSearch, showToast, songSearch, worshipSongs } = useAdminPortal();
  const { confirm } = useFeedback();
  const { handleSubmit, field, resetToDefaults, formState: { errors, isSubmitting } } = useAdminDraftForm<SongValues>('song', songSchema, EMPTY_SONG);

  const save = handleSubmit(async (values) => {
    const item = toSongItem({ id: 'song-' + Date.now(), sortOrder: worshipSongs.length }, values);
    resetToDefaults();
    await onAddWorshipSong(item);
    showToast(`Lagu "${item.title}" berhasil disimpan!`);
  }, () => showToast('Lengkapi kolom wajib lagu terlebih dahulu', 'error'));

  const q = songSearch.trim().toLowerCase();
  const visible = worshipSongs.filter((s) => !q || (s.title || '').toLowerCase().includes(q) || (s.songNumber || '').toLowerCase().includes(q));
  const categoryLabel = (value: string) => SONG_CATEGORIES.find((c) => c.value === value)?.short || value;

  return (
    <AdminPanel title={`Kidung & lagu (${worshipSongs.length})`} description="Lagu tambahan untuk songbook (KJ, PKJ, NKB, pujian) yang juga dipakai di Multimedia Live. Nomor yang sama dengan lagu bawaan menggantikan lirik bawaannya.">
      <AdminSubsection title="Tambah lagu">
        <form onSubmit={save} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Judul" required error={errors.title?.message}><Input placeholder="Contoh: Suci, Suci, Suci" {...field('title')} /></Field>
            <Field label="Nomor lagu" hint="Format bawaan: KJ 002, PKJ 015, NKB 120."><Input placeholder="Contoh: KJ 002" {...field('songNumber')} /></Field>
            <Field label="Kategori" required error={errors.category?.message}>
              <Select {...field('category')}>
                {SONG_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Nada dasar"><Input placeholder="Contoh: D" {...field('keySignature')} /></Field>
            <Field label="Pencipta"><Input placeholder="Contoh: Reginald Heber" {...field('author')} /></Field>
            <Field label="Tautan YouTube" error={errors.youtubeUrl?.message}><Input type="url" placeholder="https://youtube.com/watch?v=…" {...field('youtubeUrl')} /></Field>
          </div>
          <Field label="Lirik" required error={errors.lyrics?.message} hint="Pisahkan bait dengan satu baris kosong.">
            <Textarea rows={7} placeholder={'Bait 1:\nSuci, suci, suci…\n\nReff:\n…'} {...field('lyrics')} />
          </Field>
          <div className="flex justify-end"><Button type="submit" loading={isSubmitting} icon={<Plus size={16} aria-hidden="true" />}>Simpan lagu</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[0.98rem] font-semibold text-ink">Daftar lagu</h3>
          <div className="relative w-full sm:w-64">
            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
            <Input type="search" aria-label="Cari lagu" placeholder="Cari judul atau nomor" value={songSearch} onChange={(e) => setSongSearch(e.target.value)} className="w-full rounded-full pl-10" />
          </div>
        </div>
        {worshipSongs.length === 0 ? <AdminEmpty>Belum ada lagu tambahan.</AdminEmpty>
          : visible.length === 0 ? <AdminEmpty>Tidak ada lagu yang cocok.</AdminEmpty> : (
          <AdminList label="Daftar lagu">
            {visible.map((song) => (
              <AdminListRow key={song.id}
                meta={<><Badge tone="gold">{categoryLabel(song.category)}</Badge>{song.songNumber && <span className="font-semibold text-gold-ink">{song.songNumber}</span>}{song.keySignature && <span>Nada {song.keySignature}</span>}</>}
                title={song.title} subtitle={song.author || undefined}
                actions={<>
                  <IconButton label={`Edit lagu ${song.title}`} onClick={() => setEditingItem({ type: 'song', item: { ...song } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                  <IconButton label={`Hapus lagu ${song.title}`} tone="danger" onClick={async () => {
                    if (await confirm({ title: `Hapus lagu "${song.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                      onDeleteWorshipSong(song.id);
                      showToast('Lagu berhasil dihapus.');
                    }
                  }}><Trash2 size={16} aria-hidden="true" /></IconButton>
                </>} />
            ))}
          </AdminList>
        )}
      </div>
    </AdminPanel>
  );
}
