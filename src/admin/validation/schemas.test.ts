import { describe, expect, it } from 'vitest';
import {
  adminAccountSchema,
  brandAssetCreateSchema,
  collectFieldErrors,
  editItemError,
  eventCreateSchema,
  faqCreateSchema,
  firstError,
  formCreateSchema,
  galleryCreateSchema,
  loginSchema,
  memberCreateSchema,
  passwordChangeSchema,
  roleCreateSchema,
  ROLE_NAME_DUPLICATE,
  ROLE_NAME_REQUIRED
} from './schemas';

const validEvent = {
  eventTitle: 'Ibadah Natal',
  eventCategory: 'Ibadah',
  eventStartDate: '2026-12-20T09:00',
  eventEndDate: '2026-12-20T12:00',
  eventDesc: 'Ibadah bersama',
  eventRab: '0',
  eventIsLimited: false,
  eventMaxQuota: '',
  eventDivId: 'd1'
};

describe('collectFieldErrors', () => {
  it('reports every failing field at once', () => {
    expect(collectFieldErrors(faqCreateSchema, { faqCategory: ' ', faqQuestion: '', faqAnswer: 'ok' })).toEqual({
      faqCategory: 'Kategori Topik FAQ wajib dipilih / diisi',
      faqQuestion: 'Pertanyaan FAQ wajib diisi'
    });
  });

  it('returns no errors for valid input', () => {
    expect(collectFieldErrors(eventCreateSchema({ divisionIds: ['d1'] }), validEvent)).toEqual({});
  });
});

describe('login', () => {
  it('requires a well-formed email and any non-empty password', () => {
    expect(collectFieldErrors(loginSchema, { loginEmail: 'abc', loginPassword: '' })).toEqual({
      loginEmail: 'Email admin wajib diisi dengan format yang valid',
      loginPassword: 'Password wajib diisi'
    });
    // whitespace is a valid password, like before
    expect(collectFieldErrors(loginSchema, { loginEmail: ' a@b.co ', loginPassword: ' ' })).toEqual({});
  });
});

describe('password change', () => {
  const base = { currentPassword: 'lama-password-1', newPassword: 'BaruSekali2026', confirmPassword: 'BaruSekali2026' };

  it('accepts a strong, confirmed, different password', () => {
    expect(collectFieldErrors(passwordChangeSchema, base)).toEqual({});
  });

  it('enforces length, letters + digits, difference and confirmation', () => {
    expect(collectFieldErrors(passwordChangeSchema, { ...base, newPassword: 'Pendek1', confirmPassword: 'Pendek1' }).newPassword)
      .toBe('Password baru minimal 12 karakter');
    expect(collectFieldErrors(passwordChangeSchema, { ...base, newPassword: 'hanyahurufsaja', confirmPassword: 'hanyahurufsaja' }).newPassword)
      .toBe('Password baru harus mengandung huruf dan angka');
    expect(collectFieldErrors(passwordChangeSchema, { ...base, newPassword: base.currentPassword, confirmPassword: base.currentPassword }).newPassword)
      .toBe('Password baru harus berbeda dari password saat ini');
    expect(collectFieldErrors(passwordChangeSchema, { ...base, confirmPassword: 'BaruSekali2027' }).confirmPassword)
      .toBe('Konfirmasi password tidak sama');
    expect(collectFieldErrors(passwordChangeSchema, { ...base, currentPassword: '' }).currentPassword)
      .toBe('Password saat ini wajib diisi');
  });
});

describe('event', () => {
  const schema = eventCreateSchema({ divisionIds: ['d1'] });

  it('flags a start after the end on both date fields', () => {
    const errors = collectFieldErrors(schema, { ...validEvent, eventStartDate: '2026-12-21T09:00' });
    expect(errors.eventStartDate).toBe('Tanggal & Jam Mulai tidak boleh melebihi Tanggal & Jam Berakhir');
    expect(errors.eventEndDate).toBe('Tanggal & Jam Berakhir tidak boleh kurang dari Tanggal & Jam Mulai');
  });

  it('still checks cross-field rules when other fields are missing', () => {
    const errors = collectFieldErrors(schema, { ...validEvent, eventTitle: '', eventRab: '-5' });
    expect(Object.keys(errors).sort()).toEqual(['eventRab', 'eventTitle']);
  });

  it('requires a quota only when the event is limited', () => {
    expect(collectFieldErrors(schema, { ...validEvent, eventIsLimited: true, eventMaxQuota: '0' }).eventMaxQuota).toBe(
      'Batas maksimal kuota wajib diisi angka lebih dari 0'
    );
    expect(collectFieldErrors(schema, { ...validEvent, eventIsLimited: false, eventMaxQuota: '0' })).toEqual({});
  });

  it('explains when the tenure has no divisions yet', () => {
    const errors = collectFieldErrors(eventCreateSchema({ divisionIds: [] }), validEvent);
    expect(errors.eventDivId).toMatch(/^Divisi masih kosong/);
  });
});

describe('member', () => {
  const role = { name: 'Koordinator', requiresDivision: true, requiresSubDivision: true };
  const base = { roleCount: 1, selectedRole: role, divisionIds: ['d1'], subDivisionIdsOf: (id: string) => (id === 'd1' ? ['s1'] : []) };

  it('asks for the division and sub-division the role needs', () => {
    expect(collectFieldErrors(memberCreateSchema(base), { memName: 'Ana', memDivisionId: '', memSubDivisionId: '' })).toEqual({
      memDivisionId: 'Divisi wajib dipilih untuk jabatan "Koordinator"',
      memSubDivisionId: 'Divisi yang dipilih belum memiliki sub-divisi. Silakan buat sub-divisi terlebih dahulu di tab Kelola Divisi.'
    });
    expect(collectFieldErrors(memberCreateSchema(base), { memName: 'Ana', memDivisionId: 'd1', memSubDivisionId: 's1' })).toEqual({});
  });

  it('requires a role when the tenure has roles', () => {
    const errors = collectFieldErrors(memberCreateSchema({ ...base, selectedRole: null }), { memName: 'Ana', memDivisionId: '', memSubDivisionId: '' });
    expect(errors).toEqual({ memRole: 'Jabatan / Role wajib dipilih' });
  });
});

describe('role', () => {
  it('rejects blank and duplicate names (case- and space-insensitive)', () => {
    const schema = roleCreateSchema({ takenNames: ['ketua'] });
    expect(collectFieldErrors(schema, { newRoleName: '  ' })).toEqual({ newRoleName: ROLE_NAME_REQUIRED });
    expect(collectFieldErrors(schema, { newRoleName: ' KETUA ' })).toEqual({ newRoleName: ROLE_NAME_DUPLICATE });
    expect(collectFieldErrors(schema, { newRoleName: 'Sekretaris' })).toEqual({});
  });
});

describe('brand asset', () => {
  const base = { assetTitle: 'Logo', assetCategory: 'Logo & Brand', assetFileType: 'PDF', assetFileUrl: '', assetPreviewUrl: '', hasPendingAssetFile: false, hasPendingPreviewFile: false };

  it('needs a file or a link, and links must be web URLs', () => {
    expect(collectFieldErrors(brandAssetCreateSchema, base)).toEqual({ assetFileUrl: 'File atau URL Download wajib dipilih / diisi' });
    expect(collectFieldErrors(brandAssetCreateSchema, { ...base, assetFileUrl: 'www.x.com' }).assetFileUrl).toMatch(/^URL file harus/);
    expect(collectFieldErrors(brandAssetCreateSchema, { ...base, assetFileUrl: '/assets/logo.pdf' })).toEqual({});
    expect(collectFieldErrors(brandAssetCreateSchema, { ...base, hasPendingAssetFile: true })).toEqual({});
  });
});

describe('gallery and form', () => {
  it('requires photos and a division for a gallery', () => {
    const errors = collectFieldErrors(galleryCreateSchema({ divisionCount: 2, hasSelectedDivision: false }), {
      galTitle: 'Retreat', galDesc: 'Dokumentasi', photoUrlCount: 0, pendingFileCount: 0
    });
    expect(Object.keys(errors).sort()).toEqual(['galDivisionId', 'galPhotos']);
  });

  it('checks quota and event link of a new form', () => {
    const errors = collectFieldErrors(formCreateSchema, {
      newFormTitle: 'Oprec', newFormCategory: 'Kegiatan', newFormDeadline: '2026-12-01',
      newFormIsLimited: true, newFormMaxQuota: '0', newFormIsEventConnected: true, newFormEventId: ''
    });
    expect(Object.keys(errors).sort()).toEqual(['newFormEventId', 'newFormMaxQuota']);
  });
});

describe('edit dialog', () => {
  it('reports the first problem only, in the dialog order', () => {
    expect(editItemError('tenure', { title: '', code: '' })).toBe('Judul wajib diisi sebelum menyimpan perubahan');
    expect(editItemError('tenure', { title: 'Periode', code: ' ' })).toBe('Kode tahun periode wajib diisi');
    expect(editItemError('form', { title: 'F', category: 'K', deadline: 'x', isLimited: true, maxQuota: 0, isEventConnected: true }))
      .toBe('Maksimal kuota responden harus lebih dari 0 jika kuota dibatasi');
    expect(editItemError('faq', { category: 'Umum', question: 'Q', answer: '' })).toBe('Pertanyaan dan jawaban FAQ wajib diisi');
  });

  it('has no field rules for devotions and songs', () => {
    expect(editItemError('devotion', {})).toBeNull();
    expect(editItemError('song', {})).toBeNull();
  });
});

describe('admin account', () => {
  it('checks the email before the division', () => {
    expect(firstError(adminAccountSchema, { email: 'x', displayName: '', role: 'division_admin', divisionId: '' })).toBe('Masukkan email akun yang valid.');
    expect(firstError(adminAccountSchema, { email: 'a@b.co', displayName: '', role: 'division_admin', divisionId: '' })).toBe('Pilih divisi untuk Admin Divisi.');
    expect(firstError(adminAccountSchema, { email: 'a@b.co', displayName: '', role: 'super_admin', divisionId: '' })).toBeNull();
  });
});
