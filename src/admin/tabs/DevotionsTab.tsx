import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Field, Input, Textarea, useFeedback } from '../../ui';
import { AdminEmpty, AdminList, AdminListRow, AdminPanel, AdminSubsection, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';

export default function DevotionsTab() {
  const {
    devotionAuthor, devotionBody, devotionDate, devotionPrayer, devotionScriptureRef, devotionScriptureText, devotionTheme, devotionTitle,
    devotions, onAddDevotion, onDeleteDevotion, setDevotionAuthor, setDevotionBody, setDevotionDate, setDevotionPrayer,
    setDevotionScriptureRef, setDevotionScriptureText, setDevotionTitle, showToast
  } = useAdminPortal();
  const { confirm } = useFeedback();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!devotionTitle.trim() || !devotionBody.trim()) {
      showToast('Judul dan isi renungan wajib diisi', 'error');
      return;
    }
    if (!onAddDevotion) return;
    onAddDevotion({
      id: 'dev-' + Date.now(),
      devotionDate: devotionDate || new Date().toISOString().split('T')[0],
      title: devotionTitle.trim(),
      scriptureRef: devotionScriptureRef.trim(),
      scriptureText: devotionScriptureText.trim(),
      body: devotionBody.trim(),
      prayer: devotionPrayer.trim(),
      author: devotionAuthor.trim() || 'Bapekkris Bank Mandiri',
      theme: devotionTheme.trim() || 'Integritas & Karakter Kristiani'
    });
    setDevotionTitle('');
    setDevotionScriptureRef('');
    setDevotionScriptureText('');
    setDevotionBody('');
    setDevotionPrayer('');
    showToast('Renungan harian berhasil disimpan!');
  };

  return (
    <AdminPanel title={`Renungan harian (${devotions.length})`} description="Renungan yang terbit tampil di beranda dan halaman Renungan.">
      <AdminSubsection title="Tulis renungan baru">
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tanggal" required><Input type="date" value={devotionDate} onChange={(e) => setDevotionDate(e.target.value)} /></Field>
            <Field label="Judul" required><Input placeholder="Contoh: Setia dalam perkara kecil" value={devotionTitle} onChange={(e) => setDevotionTitle(e.target.value)} /></Field>
            <Field label="Nats Alkitab"><Input placeholder="Contoh: Matius 25:21" value={devotionScriptureRef} onChange={(e) => setDevotionScriptureRef(e.target.value)} /></Field>
            <Field label="Penulis"><Input placeholder="Contoh: Tim Kerohanian Bapekkris" value={devotionAuthor} onChange={(e) => setDevotionAuthor(e.target.value)} /></Field>
          </div>
          <Field label="Isi ayat"><Textarea rows={2} placeholder="Kutipan ayat lengkap" value={devotionScriptureText} onChange={(e) => setDevotionScriptureText(e.target.value)} /></Field>
          <Field label="Isi renungan" required><Textarea rows={6} placeholder="Tuliskan renungan di sini" value={devotionBody} onChange={(e) => setDevotionBody(e.target.value)} /></Field>
          <Field label="Doa penutup"><Textarea rows={2} value={devotionPrayer} onChange={(e) => setDevotionPrayer(e.target.value)} /></Field>
          <div className="flex justify-end"><Button type="submit" icon={<Plus size={16} aria-hidden="true" />}>Terbitkan renungan</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <h3 className="text-[0.98rem] font-semibold text-ink">Arsip renungan</h3>
        {devotions.length === 0 ? <AdminEmpty>Belum ada renungan.</AdminEmpty> : (
          <AdminList label="Arsip renungan">
            {devotions.map((dev: any) => (
              <AdminListRow key={dev.id}
                meta={<><Badge tone="gold">{dev.devotionDate}</Badge>{dev.scriptureRef && <span>{dev.scriptureRef}</span>}</>}
                title={dev.title} subtitle={dev.author ? `oleh ${dev.author}` : undefined}
                actions={
                  <IconButton label={`Hapus renungan ${dev.title}`} tone="danger" onClick={async () => {
                    if (await confirm({ title: `Hapus renungan "${dev.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                      onDeleteDevotion?.(dev.id);
                      showToast('Renungan berhasil dihapus.');
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
