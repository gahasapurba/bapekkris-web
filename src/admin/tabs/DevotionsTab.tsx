import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Field, Input, Textarea, useFeedback } from '../../ui';
import { DEFAULT_DEVOTION_AUTHOR, DEFAULT_DEVOTION_THEME, DEVOTION_THEMES } from '../../data/contentOptions';
import { formatToIndonesianDate, toWibIsoDate } from '../../utils/dateUtils';
import { devotionSchema } from '../validation/schemas';
import { toDevotionItem, type DevotionValues } from '../contentItems';
import { useAdminDraftForm } from '../useAdminDraftForm';
import { AdminEmpty, AdminList, AdminListRow, AdminPanel, AdminSubsection, IconButton } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';
import type { AppItem } from '../../lib/supabase';

/** Theme suggestions: the standard list plus themes already used in the archive. */
export function devotionThemeOptions(devotions: AppItem[]): string[] {
  return Array.from(new Set([...DEVOTION_THEMES, ...devotions.map((d) => String(d.theme || '').trim()).filter(Boolean)]));
}

export default function DevotionsTab() {
  const { devotions, onAddDevotion, onDeleteDevotion, setEditingItem, showToast } = useAdminPortal();
  const { confirm } = useFeedback();
  const emptyDevotion: DevotionValues = {
    devotionDate: toWibIsoDate(), title: '', theme: DEFAULT_DEVOTION_THEME, scriptureRef: '', scriptureText: '', body: '', prayer: '', author: DEFAULT_DEVOTION_AUTHOR
  };
  const { handleSubmit, field, resetToDefaults, formState: { errors, isSubmitting } } = useAdminDraftForm<DevotionValues>('devotion', devotionSchema, emptyDevotion);

  const publish = handleSubmit(async (values) => {
    const item = toDevotionItem({ id: 'dev-' + Date.now() }, values);
    await onAddDevotion(item);
    resetToDefaults();
    showToast(`Renungan "${item.title}" berhasil diterbitkan.`);
  }, () => showToast('Lengkapi kolom wajib renungan terlebih dahulu', 'error'));

  return (
    <AdminPanel title={`Renungan harian (${devotions.length})`} description="Renungan yang terbit tampil di beranda dan halaman Renungan.">
      <AdminSubsection title="Tulis renungan baru">
        <form onSubmit={publish} className="flex flex-col gap-4" noValidate>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Tanggal" required error={errors.devotionDate?.message}><Input type="date" {...field('devotionDate')} /></Field>
            <Field label="Judul" required error={errors.title?.message}><Input placeholder="Contoh: Setia dalam perkara kecil" {...field('title')} /></Field>
            <Field label="Tema" required error={errors.theme?.message} hint="Pilih dari daftar atau ketik tema baru. Dipakai untuk filter di halaman Renungan.">
              <Input list="devotion-theme-options" placeholder="Contoh: Iman & Pengharapan" {...field('theme')} />
            </Field>
            <Field label="Nats Alkitab"><Input placeholder="Contoh: Matius 25:21" {...field('scriptureRef')} /></Field>
            <Field label="Penulis" className="md:col-span-2"><Input placeholder="Contoh: Tim Kerohanian Bapekkris" {...field('author')} /></Field>
          </div>
          <datalist id="devotion-theme-options">
            {devotionThemeOptions(devotions).map((t) => <option key={t} value={t} />)}
          </datalist>
          <Field label="Isi ayat"><Textarea rows={2} placeholder="Kutipan ayat lengkap" {...field('scriptureText')} /></Field>
          <Field label="Isi renungan" required error={errors.body?.message}><Textarea rows={6} placeholder="Tuliskan renungan di sini" {...field('body')} /></Field>
          <Field label="Doa penutup"><Textarea rows={2} {...field('prayer')} /></Field>
          <div className="flex justify-end"><Button type="submit" loading={isSubmitting} icon={<Plus size={16} aria-hidden="true" />}>Terbitkan renungan</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <h3 className="text-[0.98rem] font-semibold text-ink">Arsip renungan</h3>
        {devotions.length === 0 ? <AdminEmpty>Belum ada renungan.</AdminEmpty> : (
          <AdminList label="Arsip renungan">
            {devotions.map((dev) => (
              <AdminListRow key={dev.id}
                meta={<><Badge tone="gold">{formatToIndonesianDate(dev.devotionDate)}</Badge>{dev.theme && <Badge tone="neutral">{dev.theme}</Badge>}{dev.scriptureRef && <span>{dev.scriptureRef}</span>}</>}
                title={dev.title} subtitle={dev.author ? `oleh ${dev.author}` : undefined}
                actions={<>
                  <IconButton label={`Edit renungan ${dev.title}`} onClick={() => setEditingItem({ type: 'devotion', item: { ...dev } })}><Edit2 size={15} aria-hidden="true" /></IconButton>
                  <IconButton label={`Hapus renungan ${dev.title}`} tone="danger" onClick={async () => {
                    if (await confirm({ title: `Hapus renungan "${dev.title}"?`, message: 'Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus', danger: true })) {
                      onDeleteDevotion(dev.id);
                      showToast('Renungan berhasil dihapus.');
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
