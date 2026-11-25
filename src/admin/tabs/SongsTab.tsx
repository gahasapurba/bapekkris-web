import { Plus, Search, Trash2 } from 'lucide-react';
import { Badge, Button, Field, Input, Select, Textarea, useFeedback } from '../../ui';
import { AdminEmpty, AdminList, AdminListRow, AdminPanel, AdminSubsection, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

export default function SongsTab() {
  const {
    onAddWorshipSong, onDeleteWorshipSong, setSongAuthor, setSongCategory, setSongKey, setSongLyrics, setSongNumber, setSongSearch,
    setSongTitle, setSongYoutube, showToast, songAuthor, songCategory, songKey, songLyrics, songNumber, songSearch, songTitle, songYoutube, worshipSongs
  } = useAdminPortal();
  const { confirm } = useFeedback();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !songLyrics.trim()) {
      showToast('Judul lagu dan lirik wajib diisi', 'error');
      return;
    }
    if (!onAddWorshipSong) return;
    onAddWorshipSong({
      id: 'song-' + Date.now(),
      title: songTitle.trim(),
      songNumber: songNumber.trim() || undefined,
      category: songCategory,
      keySignature: songKey.trim() || 'C',
      author: songAuthor.trim() || '',
      lyrics: songLyrics.trim(),
      youtubeUrl: songYoutube.trim() || undefined,
      sortOrder: worshipSongs.length
    });
    setSongTitle('');
    setSongNumber('');
    setSongAuthor('');
    setSongLyrics('');
    setSongYoutube('');
    showToast(`Lagu "${songTitle.trim()}" berhasil disimpan!`);
  };

  const q = songSearch.toLowerCase();
  const visible = worshipSongs.filter((s: any) => !q || (s.title || '').toLowerCase().includes(q) || (s.songNumber || '').toLowerCase().includes(q));

  return (
    <AdminPanel title={`Kidung & lagu (${worshipSongs.length})`} description="Songbook KJ, PKJ, NKB, dan lagu pujian yang juga dipakai di Multimedia Live.">
      <AdminSubsection title="Tambah lagu">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Judul" required><Input placeholder="Contoh: Suci, Suci, Suci" value={songTitle} onChange={(e) => setSongTitle(e.target.value)} /></Field>
            <Field label="Nomor lagu"><Input placeholder="Contoh: KJ 002" value={songNumber} onChange={(e) => setSongNumber(e.target.value)} /></Field>
            <Field label="Kategori" required>
              <Select value={songCategory} onChange={(e) => setSongCategory(e.target.value)}>
                <option value="KJ">Kidung Jemaat (KJ)</option>
                <option value="PKJ">Pelengkap Kidung Jemaat (PKJ)</option>
                <option value="NKB">Nyanyikanlah Kidung Baru (NKB)</option>
                <option value="Praise & Worship">Praise & Worship</option>
                <option value="Lainnya">Lagu rohani lainnya</option>
              </Select>
            </Field>
            <Field label="Nada dasar"><Input placeholder="Contoh: D" value={songKey} onChange={(e) => setSongKey(e.target.value)} /></Field>
            <Field label="Pencipta"><Input placeholder="Contoh: Reginald Heber" value={songAuthor} onChange={(e) => setSongAuthor(e.target.value)} /></Field>
            <Field label="Tautan YouTube"><Input type="url" placeholder="https://youtube.com/watch?v=…" value={songYoutube} onChange={(e) => setSongYoutube(e.target.value)} /></Field>
          </div>
          <Field label="Lirik" required hint="Pisahkan bait dengan satu baris kosong.">
            <Textarea rows={7} placeholder={'Bait 1:\nSuci, suci, suci…\n\nReff:\n…'} value={songLyrics} onChange={(e) => setSongLyrics(e.target.value)} />
          </Field>
          <div className="flex justify-end"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Simpan lagu</Button></div>
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
        {worshipSongs.length === 0 ? <AdminEmpty>Belum ada lagu di songbook.</AdminEmpty>
          : visible.length === 0 ? <AdminEmpty>Tidak ada lagu yang cocok.</AdminEmpty> : (
          <AdminList label="Daftar lagu">
            {visible.map((song: any) => (
              <AdminListRow key={song.id}
                meta={<><Badge tone="gold">{song.category}</Badge>{song.songNumber && <span className="font-semibold text-gold-ink">{song.songNumber}</span>}{song.keySignature && <span>Nada {song.keySignature}</span>}</>}
                title={song.title} subtitle={song.author || undefined}
                actions={
                  <IconButton label={`Hapus lagu ${song.title}`} tone="danger" onClick={async () => {
                    if (await confirm({ title: `Hapus lagu "${song.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                      onDeleteWorshipSong?.(song.id);
                      showToast('Lagu berhasil dihapus.');
                    }
                  }}><Trash2 size={16} aria-hidden="true" /></IconButton>
                } />
            ))}
          </AdminList>
        )}
      </div>
    </AdminPanel>
  );
}
