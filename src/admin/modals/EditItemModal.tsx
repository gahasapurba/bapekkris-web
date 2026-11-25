import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '../../ui';
import { useModalBehavior } from '../../ui/useModalBehavior';
import { getCategoryFromLevel, getTenureRoles, validateMemberQuota } from '../../utils/memberQuotaUtils';
import { formatWibEventRange, toDatetimeLocalSecondsValue, toDatetimeLocalValue } from '../../utils/dateUtils';
import { uploadMediaToCloud } from '../../lib/supabase';
import MemberFields from './edit/MemberFields';
import DivisionFields from './edit/DivisionFields';
import SubDivisionFields from './edit/SubDivisionFields';
import GalleryFields from './edit/GalleryFields';
import TenureFields from './edit/TenureFields';
import DevotionFields from './edit/DevotionFields';
import FormFields from './edit/FormFields';
import EventFields from './edit/EventFields';
import BrandAssetFields from './edit/BrandAssetFields';
import FaqFields from './edit/FaqFields';
import RoleFields from './edit/RoleFields';
import { useAdminPortal } from '../AdminPortalContext';
import { editItemError } from '../validation/schemas';

export default function EditItemModal() {
  const {
    activeTenure,
    divisions,
    editModalError,
    editingItem,
    isDark,
    isUploadingMedia,
    members,
    onUpdateBrandAsset,
    onUpdateDevotion,
    onUpdateDivision,
    onUpdateEvent,
    onUpdateFaq,
    onUpdateForm,
    onUpdateGallery,
    onUpdateMember,
    onUpdateSubDivision,
    onUpdateTenure,
    onUpdateTenureRole,
    roleQuotas,
    setEditModalError,
    setEditingItem,
    setIsUploadingMedia,
    showToast,
    subDivisions,
    submissions,
    tenureRoles,
    verifyImageUrl
  } = useAdminPortal();
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => { setEditingItem(null); setEditModalError(''); };
  useModalBehavior(panelRef, true, close);
  const TITLES: Record<string, string> = {
    member: 'Edit personel', role: 'Edit role & jabatan', division: 'Edit divisi', sub_division: 'Edit sub-divisi', gallery: 'Edit album galeri',
    devotion: 'Edit renungan', song: 'Edit lagu', form: 'Edit formulir', event: 'Edit acara', brand_asset: 'Edit aset', faq: 'Edit pertanyaan FAQ'
  };
  const title = TITLES[editingItem.type] || 'Edit periode kepengurusan';
  const save = async () => {
              setEditModalError('');
              const it = editingItem.item || {};
              const fieldError = editItemError(editingItem.type, it);
              if (fieldError) {
                setEditModalError(fieldError);
                showToast(fieldError, 'error');
                return;
              }
              if (editingItem.type === 'form') {
                // Validasi Integritas Unik: Periksa apakah ada field isUnique yang memiliki data duplikat di riwayat pengisian responden
                const formFields = it.fields || [];
                const uniqueFields = formFields.filter((f: any) => f.isUnique);
                if (uniqueFields.length > 0) {
                  const formSubs = submissions.filter(s => s.formId === it.id);
                  for (const uf of uniqueFields) {
                    const valCounts: Record<string, number> = {};
                    formSubs.forEach(s => {
                      const rawVal = s.data?.[uf.id] ?? s[uf.id] ?? s.answers?.[uf.id];
                      if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
                        const normVal = String(rawVal).trim().toLowerCase();
                        valCounts[normVal] = (valCounts[normVal] || 0) + 1;
                      }
                    });
                    const duplicates = Object.entries(valCounts).filter(([_, count]) => count > 1);
                    if (duplicates.length > 0) {
                      const dupDetails = duplicates.map(([val, count]) => `"${val}" (${count}x)`).join(', ');
                      const errMsg = `Field "${uf.label}" tidak dapat dijadikan Unik karena memiliki ${duplicates.length} data duplikat pada respon responden: ${dupDetails}. Hapus data duplikat di tab Responden terlebih dahulu.`;
                      setEditModalError(errMsg);
                      showToast(errMsg, 'error');
                      return;
                    }
                  }
                }
              }


              if (editingItem.type === 'member' && onUpdateMember) {
                const targetTenureId = editingItem.item.tenureId || activeTenure?.id || '';
                const availableRoles = getTenureRoles(targetTenureId, roleQuotas, tenureRoles);
                if (availableRoles.length === 0) {
                  setEditModalError('Role kepengurusan masih kosong pada periode ini. Silakan buat role baru terlebih dahulu di menu Kelola Role & Jabatan.');
                  showToast('Role kepengurusan masih kosong pada periode ini.', 'error');
                  return;
                }
                const selectedRole = availableRoles.find(r => r.id === editingItem.item.roleId) ||
                  availableRoles.find(r => String(r?.name || '').toLowerCase() === String(editingItem.item.role || '').toLowerCase()) ||
                  null;

                if (!selectedRole) {
                  setEditModalError('Jabatan / Role wajib dipilih');
                  showToast('Jabatan / Role wajib dipilih', 'error');
                  return;
                }

                if (selectedRole?.requiresDivision && !editingItem.item.divisionId) {
                  setEditModalError(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`);
                  showToast(`Divisi wajib dipilih untuk jabatan "${selectedRole.name}"`, 'error');
                  return;
                }

                if (selectedRole?.requiresDivision && selectedRole?.requiresSubDivision) {
                  const divSubs = subDivisions.filter(sd => sd.divisionId === editingItem.item.divisionId);
                  if (divSubs.length === 0) {
                    setEditModalError('Divisi yang dipilih belum memiliki sub-divisi. Silakan tambahkan sub-divisi di Kelola Divisi terlebih dahulu.');
                    showToast('Divisi belum memiliki sub-divisi.', 'error');
                    return;
                  }
                  if (!editingItem.item.subDivisionId || !divSubs.some(sd => sd.id === editingItem.item.subDivisionId)) {
                    setEditModalError(`Sub-divisi wajib dipilih untuk jabatan "${selectedRole.name}"`);
                    showToast(`Sub-divisi wajib dipilih untuk jabatan "${selectedRole.name}"`, 'error');
                    return;
                  }
                }

                // Validasi Ketat Kuota Kepengurusan saat edit
                const quotaCheck = validateMemberQuota(
                  {
                    tenureId: targetTenureId,
                    roleId: selectedRole?.id,
                    role: selectedRole?.name || editingItem.item.role,
                    divisionId: selectedRole?.requiresDivision ? editingItem.item.divisionId : undefined,
                    subDivisionId: (selectedRole?.requiresDivision && selectedRole?.requiresSubDivision) ? editingItem.item.subDivisionId : undefined,
                    excludeMemberId: editingItem.item.id
                  },
                  members,
                  divisions,
                  roleQuotas,
                  tenureRoles,
                  subDivisions
                );

                if (!quotaCheck.isValid) {
                  setEditModalError(quotaCheck.error);
                  showToast(quotaCheck.error, 'error');
                  return;
                }
                let finalImage = (editingItem.item.image || '').trim();

                // Validasi URL foto jika diinput dalam bentuk tautan web
                if (finalImage && !editingItem.pendingPhoto && !finalImage.startsWith('blob:')) {
                  setIsUploadingMedia(true);
                  showToast('Memverifikasi tautan foto profil...');
                  const check = await verifyImageUrl(finalImage, { requireHttps: true, allowRelative: false });
                  if (!check.valid) {
                    setIsUploadingMedia(false);
                    setEditModalError(`Tautan foto tidak valid: ${check.error}`);
                    showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                    return;
                  }
                  setIsUploadingMedia(false);
                }

                if (editingItem.pendingPhoto) {
                  setIsUploadingMedia(true);
                  showToast(`Mengunggah foto "${editingItem.pendingPhoto.name}" ke Cloud Storage...`);
                  try {
                    const cloudUrl = await uploadMediaToCloud(editingItem.pendingPhoto, 'members');
                    if (cloudUrl) finalImage = cloudUrl;
                  } catch (err) {
                    setIsUploadingMedia(false);
                    showToast('Gagal mengunggah foto: ' + ((err as Error).message || 'Error jaringan'), 'error');
                    return;
                  }
                  setIsUploadingMedia(false);
                }
                const finalResp = editingItem.item.rawResponsibilities !== undefined
                  ? editingItem.item.rawResponsibilities.split('\n').map((s: any) => s.trim()).filter(Boolean)
                  : (Array.isArray(editingItem.item.responsibilities) ? editingItem.item.responsibilities : []);
                const { rawResponsibilities, ...cleanItem } = editingItem.item;
                const finalCat = getCategoryFromLevel(selectedRole?.level ?? 5);
                const divObj = selectedRole?.requiresDivision ? divisions.find(d => d.id === cleanItem.divisionId) : null;
                const finalRoleName = selectedRole?.requiresDivision && String(selectedRole?.name || '').toLowerCase() === 'pimpro' && divObj
                  ? `Pimpro ${divObj.name}`
                  : (selectedRole?.name || cleanItem.role || '');

                onUpdateMember({
                  ...cleanItem,
                  roleId: selectedRole?.id,
                  role: finalRoleName,
                  title: divObj?.name || '',
                  category: finalCat,
                  divisionId: selectedRole?.requiresDivision ? cleanItem.divisionId : undefined,
                  subDivisionId: (selectedRole?.requiresDivision && selectedRole?.requiresSubDivision) ? cleanItem.subDivisionId : undefined,
                  image: finalImage,
                  responsibilities: finalResp
                });
              }
              if (editingItem.type === 'sub_division') {
                const cleanName = (editingItem.item.name || '').trim();
                const targetDivId = editingItem.item.divisionId;
                const isDup = subDivisions.some(s => s.divisionId === targetDivId && s.id !== editingItem.item.id && s.name.toLowerCase().trim() === cleanName.toLowerCase());
                if (isDup) {
                  setEditModalError('Nama sub-divisi "' + cleanName + '" sudah terdaftar pada divisi ini.');
                  showToast('Nama sub-divisi "' + cleanName + '" sudah terdaftar pada divisi ini.', 'error');
                  return;
                }
                if (onUpdateSubDivision) {
                  onUpdateSubDivision({
                    ...editingItem.item,
                    name: cleanName,
                    code: (editingItem.item.code || '').trim().toUpperCase() || undefined,
                    description: (editingItem.item.description || '').trim()
                  });
                }
              }
              if (editingItem.type === 'division' && onUpdateDivision) {
                const finalFocus = editingItem.item.rawFocusAreas !== undefined
                  ? editingItem.item.rawFocusAreas.split(',').map((s: any) => s.trim()).filter(Boolean)
                  : (Array.isArray(editingItem.item.focusAreas) ? editingItem.item.focusAreas : []);
                const { rawFocusAreas, ...cleanItem } = editingItem.item;
                const selMem = members.find(m => m.id === cleanItem.memberId);
                const finalLeadName = selMem ? selMem.name : (cleanItem.leadName || '');
                onUpdateDivision({ ...cleanItem, leadName: finalLeadName, focusAreas: finalFocus });
              }
              if (editingItem.type === 'gallery' && onUpdateGallery) {
                if (!editingItem.item.divisionId && !editingItem.item.division) {
                  setEditModalError('Divisi penyelenggara wajib dipilih untuk galeri');
                  showToast('Divisi penyelenggara wajib dipilih untuk galeri', 'error');
                  return;
                }
                if (!(editingItem.item.description || '').trim()) {
                  setEditModalError('Deskripsi kegiatan wajib diisi untuk galeri');
                  showToast('Deskripsi kegiatan wajib diisi untuk galeri', 'error');
                  return;
                }
                let finalPhotos = Array.isArray(editingItem.item.photos) ? [...editingItem.item.photos] : [];
                if (editingItem.pendingPhotos && editingItem.pendingPhotos.length > 0) {
                  setIsUploadingMedia(true);
                  showToast(`Mengunggah ${editingItem.pendingPhotos.length} foto ke Cloud Storage...`);
                  try {
                    for (const pFile of editingItem.pendingPhotos) {
                      const cloudUrl = await uploadMediaToCloud(pFile, 'gallery');
                      if (cloudUrl) {
                        const blobIdx = finalPhotos.findIndex(u => typeof u === 'string' && u.startsWith('blob:'));
                        if (blobIdx !== -1) {
                          finalPhotos[blobIdx] = cloudUrl;
                        } else {
                          finalPhotos.push(cloudUrl);
                        }
                      }
                    }
                  } catch (err) {
                    setIsUploadingMedia(false);
                    showToast('Gagal mengunggah foto galeri: ' + ((err as Error).message || 'Error'), 'error');
                    return;
                  }
                  setIsUploadingMedia(false);
                }
                finalPhotos = finalPhotos.filter(u => typeof u === 'string' && !u.startsWith('blob:'));

                // Auto-include any pending photo links entered in the textarea
                const pendingRawUrls = (editingItem.photoUrlInput || '').trim();
                if (pendingRawUrls) {
                  const urls = pendingRawUrls.split(/[\n,]+/).map((s: any) => s.trim()).filter(Boolean);
                  for (const u of urls) {
                    const check = await verifyImageUrl(u);
                    if (!check.valid) {
                      setEditModalError(`Tautan foto "${u}" tidak valid: ${check.error}`);
                      showToast(`Tautan foto tidak valid: ${check.error}`, 'error');
                      return;
                    }
                    if (!finalPhotos.includes(u)) {
                      finalPhotos.push(u);
                    }
                  }
                }

                if (finalPhotos.length === 0) {
                  setEditModalError('Dokumentasi kegiatan wajib memiliki minimal 1 foto!');
                  showToast('Dokumentasi kegiatan wajib memiliki minimal 1 foto!', 'error');
                  return;
                }
                const {
                  _dateMode,
                  _dateVal,
                  _startDate,
                  _endDate,
                  _month,
                  _year,
                  ...cleanGalItem
                } = editingItem.item;
                onUpdateGallery({ ...cleanGalItem, photos: finalPhotos });
              }
              if (editingItem.type === 'tenure' && onUpdateTenure) {
                const finalMisi = editingItem.item.rawMisi !== undefined
                  ? editingItem.item.rawMisi.split('\n').map((s: any) => s.trim()).filter(Boolean)
                  : (Array.isArray(editingItem.item.misi) ? editingItem.item.misi : []);
                const { rawMisi, ...cleanItem } = editingItem.item;
                onUpdateTenure({ ...cleanItem, misi: finalMisi });
              }
              if (editingItem.type === 'devotion' && onUpdateDevotion) onUpdateDevotion(editingItem.item);
              if (editingItem.type === 'form') {
                const fields = editingItem.item.fields || [];
                if (onUpdateForm) {
                  const cleanFields = fields.map(({ rawOptions, ...rest }: any) => rest);
                  const cleanDeadline = editingItem.item.deadline ? toDatetimeLocalSecondsValue(editingItem.item.deadline) : '';
                  const isLimitedVal = editingItem.item.isLimited === true;
                  const maxQuotaVal = isLimitedVal ? (parseInt(editingItem.item.maxQuota, 10) || 0) : 0;
                  const isEventConnectedVal = editingItem.item.isEventConnected === true;
                  const eventIdVal = isEventConnectedVal ? (editingItem.item.eventId || '') : '';
                  const isLuckyDrawVal = isEventConnectedVal && editingItem.item.isLuckyDraw === true;
                  onUpdateForm({
                    ...editingItem.item,
                    deadline: cleanDeadline,
                    fields: cleanFields,
                    isLimited: isLimitedVal,
                    maxQuota: maxQuotaVal,
                    isEventConnected: isEventConnectedVal,
                    eventId: eventIdVal,
                    isLuckyDraw: isLuckyDrawVal
                  });
                }
              }
              if (editingItem.type === 'event' && onUpdateEvent) {
                const catVal = (editingItem.item.kategori || editingItem.item.category || editingItem.item.badge || '').trim();
                if (!catVal) {
                  setEditModalError('Kategori program/kegiatan wajib dipilih');
                  showToast('Kategori program/kegiatan wajib dipilih', 'error');
                  return;
                }
                if (!editingItem.item.divisionId) {
                  setEditModalError('Divisi penyelenggara wajib dipilih untuk Event');
                  showToast('Divisi penyelenggara wajib dipilih untuk Event', 'error');
                  return;
                }
                if (!editingItem.item.startDate) {
                  setEditModalError('Tanggal & Jam Mulai event wajib diisi');
                  showToast('Tanggal & Jam Mulai event wajib diisi', 'error');
                  return;
                }
                if (!editingItem.item.endDate) {
                  setEditModalError('Tanggal & Jam Berakhir event wajib diisi');
                  showToast('Tanggal & Jam Berakhir event wajib diisi', 'error');
                  return;
                }
                if (toDatetimeLocalValue(editingItem.item.startDate) > toDatetimeLocalValue(editingItem.item.endDate)) {
                  setEditModalError('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir');
                  showToast('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir', 'error');
                  return;
                }
                if (!(editingItem.item.description || '').trim()) {
                  setEditModalError('Deskripsi kegiatan event wajib diisi');
                  showToast('Deskripsi kegiatan event wajib diisi', 'error');
                  return;
                }
                if (editingItem.item.isLimited) {
                  const mq = Number(editingItem.item.maxQuota || 0);
                  if (!mq || mq <= 0) {
                    setEditModalError('Batas maksimal kuota wajib diisi angka lebih dari 0');
                    showToast('Batas maksimal kuota wajib diisi angka lebih dari 0', 'error');
                    return;
                  }
                }
                if (editingItem.item.totalRab === '' || editingItem.item.totalRab === undefined || editingItem.item.totalRab === null || isNaN(Number(editingItem.item.totalRab)) || Number(editingItem.item.totalRab) < 0) {
                  setEditModalError('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)');
                  showToast('Estimasi Total RAB wajib diisi dengan nominal angka yang valid (>= 0)', 'error');
                  return;
                }
                const pesertaVal = (editingItem.item.peserta || editingItem.item.kpi || '').trim();
                const calculatedDate = formatWibEventRange(editingItem.item.startDate, editingItem.item.endDate);
                onUpdateEvent({
                  ...editingItem.item,
                  kategori: catVal,
                  category: catVal,
                  badge: catVal,
                  peserta: pesertaVal,
                  kpi: pesertaVal,
                  totalRab: Number(editingItem.item.totalRab),
                  isPublic: Boolean(editingItem.item.isPublic),
                  isLimited: Boolean(editingItem.item.isLimited),
                  maxQuota: editingItem.item.isLimited ? Number(editingItem.item.maxQuota || 0) : 0,
                  date: calculatedDate || (editingItem.item.date || '').trim() || ''
                });
              }
              if (editingItem.type === 'brand_asset' && onUpdateBrandAsset) {
                const assetCat = (editingItem.item.category || '').trim();
                if (!assetCat) {
                  setEditModalError('Kategori katalog asset wajib dipilih');
                  showToast('Kategori katalog asset wajib dipilih', 'error');
                  return;
                }
                const assetFType = (editingItem.item.fileType || '').trim();
                if (!assetFType) {
                  setEditModalError('Format file asset wajib diisi');
                  showToast('Format file asset wajib diisi', 'error');
                  return;
                }
                let finalFileUrl = editingItem.item.fileUrl || '';
                let finalPreviewUrl = editingItem.item.previewUrl || '';
                if (editingItem.pendingFile) {
                  setIsUploadingMedia(true);
                  showToast(`Mengunggah file "${editingItem.pendingFile.name}" ke Cloud Storage...`);
                  try {
                    const cloudUrl = await uploadMediaToCloud(editingItem.pendingFile, 'assets');
                    if (cloudUrl) finalFileUrl = cloudUrl;
                  } catch (err) {
                    setIsUploadingMedia(false);
                    showToast('Gagal mengunggah file asset: ' + ((err as Error).message || 'Error'), 'error');
                    return;
                  }
                  setIsUploadingMedia(false);
                }
                if (editingItem.pendingPreviewFile) {
                  setIsUploadingMedia(true);
                  showToast(`Mengunggah preview "${editingItem.pendingPreviewFile.name}"...`);
                  try {
                    if (editingItem.pendingPreviewFile === editingItem.pendingFile) {
                      finalPreviewUrl = finalFileUrl;
                    } else {
                      const previewCloudUrl = await uploadMediaToCloud(editingItem.pendingPreviewFile, 'assets');
                      if (previewCloudUrl) finalPreviewUrl = previewCloudUrl;
                    }
                  } catch (err) {
                    setIsUploadingMedia(false);
                    showToast('Gagal mengunggah gambar preview: ' + ((err as Error).message || 'Error'), 'error');
                    return;
                  }
                  setIsUploadingMedia(false);
                }
                const isValidUrl = (url: any) => /^https?:\/\/.+/i.test(url.trim()) || url.trim().startsWith('/');
                if (finalFileUrl && !editingItem.pendingFile && !isValidUrl(finalFileUrl)) {
                  setEditModalError('URL file harus berupa tautan web yang valid (diawali http:// atau https://)');
                  showToast('URL file harus berupa tautan web yang valid', 'error');
                  return;
                }
                if (finalPreviewUrl && !editingItem.pendingPreviewFile && !isValidUrl(finalPreviewUrl)) {
                  setEditModalError('URL preview harus berupa tautan web yang valid (diawali http:// atau https://)');
                  showToast('URL preview harus berupa tautan web yang valid', 'error');
                  return;
                }
                const isImageFile = (url: any) => /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i.test(url) || (url || '').startsWith('data:image/');
                const effectiveFileUrl = finalFileUrl || (isImageFile(finalPreviewUrl) ? finalPreviewUrl : '');
                const effectivePreviewUrl = finalPreviewUrl || (isImageFile(finalFileUrl) ? finalFileUrl : '');
                if (!effectiveFileUrl) {
                  setEditModalError('File asset wajib diunggah atau memiliki tautan file aktif');
                  showToast('File asset wajib diunggah', 'error');
                  return;
                }
                onUpdateBrandAsset({
                  ...editingItem.item,
                  fileUrl: effectiveFileUrl,
                  previewUrl: effectivePreviewUrl
                });
              }
              if (editingItem.type === 'role' && onUpdateTenureRole) onUpdateTenureRole(editingItem.item);
              if (editingItem.type === 'faq' && onUpdateFaq) onUpdateFaq(editingItem.item);
              setEditingItem(null);
              setEditModalError('');
              showToast('Perubahan data berhasil disimpan & disinkronkan ke Cloud!');
};

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-overlay p-0 sm:items-center sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="edit-item-title" tabIndex={-1}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl border border-line bg-surface shadow-card outline-none sm:rounded-xl">
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
          <h2 id="edit-item-title" className="font-display text-[1.3rem] font-semibold text-ink">{title}</h2>
          <button type="button" onClick={close} aria-label="Tutup" className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:bg-subtle hover:text-ink"><X size={18} aria-hidden="true" /></button>
        </header>
        {editModalError && (
          <p role="alert" className="mx-5 mt-4 flex items-start gap-2 rounded-md border border-danger-line bg-danger-tint px-3 py-2.5 text-[0.88rem] text-ink md:mx-6">
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />{editModalError}
          </p>
        )}
        <div className="admin-edit-body flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {editingItem.type === 'member' && <MemberFields />}
          {editingItem.type === 'division' && <DivisionFields />}
          {editingItem.type === 'sub_division' && <SubDivisionFields />}
          {editingItem.type === 'gallery' && <GalleryFields />}
          {editingItem.type === 'tenure' && <TenureFields />}
          {editingItem.type === 'devotion' && <DevotionFields />}
          {editingItem.type === 'form' && <FormFields />}
          {editingItem.type === 'event' && <EventFields />}
          {editingItem.type === 'brand_asset' && <BrandAssetFields />}
          {editingItem.type === 'faq' && <FaqFields />}
          {editingItem.type === 'role' && <RoleFields />}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-line bg-subtle px-5 py-3 md:px-6">
          <Button variant="secondary" onClick={close}>Batal</Button>
          <Button loading={isUploadingMedia} onClick={save}>{isUploadingMedia ? 'Mengunggah & menyimpan…' : 'Simpan perubahan'}</Button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
