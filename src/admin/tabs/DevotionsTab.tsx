import { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Field, Input, Textarea, useFeedback } from '../../ui';
import { DEFAULT_DEVOTION_AUTHOR, DEFAULT_DEVOTION_THEME, DEVOTION_THEMES } from '../../data/contentOptions';
import { INDONESIAN_MONTHS, formatToIndonesianDate, toWibIsoDate } from '../../utils/dateUtils';
import { devotionSchema } from '../validation/schemas';
import { toDevotionItem, type DevotionValues } from '../contentItems';
import { useAdminDraftForm } from '../useAdminDraftForm';
import { AdminEmpty, AdminList, AdminListRow, AdminPanel, AdminSubsection, FilterSelect, IconButton, ListToolbar } from '../AdminUi';
import { useAdminPortal } from '../AdminPortalContext';
import type { AppItem } from '../../lib/supabase';

/** Theme suggestions: the standard list plus themes already used in the archive. */
export function devotionThemeOptions(devotions: AppItem[]): string[] {
  return Array.from(new Set([...DEVOTION_THEMES, ...devotions.map((d) => String(d.theme || '').trim()).filter(Boolean)]));
}

export default function DevotionsTab() {
  const { devotions, onAddDevotion, onDeleteDevotion, setEditingItem, showToast } = useAdminPortal();
  const { confirm } = useFeedback();
  const [monthFilter, setMonthFilter] = useState('all');
  const today = toWibIsoDate();
  const emptyDevotion: DevotionValues = {
    devotionDate: toWibIsoDate(), title: '', theme: DEFAULT_DEVOTION_THEME, scriptureRef: '', scriptureText: '', body: '', prayer: '', author: DEFAULT_DEVOTION_AUTHOR
  };
  const { handleSubmit, field, resetToDefaults, formState: { errors, isSubmitting } } = useAdminDraftForm<DevotionValues>('devotion', devotionSchema, emptyDevotion);

  const publish = handleSubmit(async (values) => {
    const item = toDevotionItem({ id: 'dev-' + Date.now() }, values);
    resetToDefaults();
    await onAddDevotion(item);
    showToast(`Renungan "${item.title}" berhasil diterbitkan.`);
  }, () => showToast('Lengkapi kolom wajib renungan terlebih dahulu', 'error'));

  const sorted = [...devotions].sort((a, b) => String(b.devotionDate || '').localeCompare(String(a.devotionDate || '')));
  const months = Array.from(new Set(sorted.map((d) => String(d.devotionDate || '').slice(0, 7)).filter((m) => /^\d{4}-\d{2}$/.test(m))));
  const archive = monthFilter === 'all' ? sorted : sorted.filter((d) => String(d.devotionDate || '').startsWith(monthFilter));

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
        <ListToolbar title={`Arsip renungan (${archive.length})`}>
          <FilterSelect value={monthFilter} onChange={setMonthFilter} label="Filter bulan">
            <option value="all">Semua bulan</option>
            {months.map((m) => <option key={m} value={m}>{INDONESIAN_MONTHS[Number(m.slice(5, 7)) - 1]} {m.slice(0, 4)}</option>)}
          </FilterSelect>
        </ListToolbar>
        <p className="text-[0.84rem] text-muted">Renungan bertanggal mendatang berstatus <strong>terjadwal</strong> dan otomatis tampil untuk jemaat pada tanggalnya.</p>
        {archive.length === 0 ? <AdminEmpty>{devotions.length === 0 ? 'Belum ada renungan.' : 'Tidak ada renungan pada bulan ini.'}</AdminEmpty> : (
          <AdminList label="Arsip renungan">
            {archive.map((dev) => (
              <AdminListRow key={dev.id}
                meta={<><Badge tone="gold">{formatToIndonesianDate(dev.devotionDate)}</Badge>{dev.devotionDate > today && <Badge tone="info">Terjadwal</Badge>}{dev.theme && <Badge tone="neutral">{dev.theme}</Badge>}{dev.scriptureRef && <span>{dev.scriptureRef}</span>}</>}
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
