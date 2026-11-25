import { Clock } from 'lucide-react';
import { useDynamicForm } from './useDynamicForm';
import { DynamicFormContext } from './DynamicFormContext';
import FormUnavailableNotice from './sections/FormUnavailableNotice';
import FormPicker from './sections/FormPicker';
import FormPanel from './sections/FormPanel';
import SubmitConfirmModal from './sections/SubmitConfirmModal';
import StatusTracker from './sections/StatusTracker';
import AcceptedAnnouncement from './sections/AcceptedAnnouncement';
import PosterPreviewModal from './sections/PosterPreviewModal';

/**
 * Values the hook exposes. Keys are checked; values stay `any` because the hook is still
 * JavaScript, where TypeScript would infer `useState(null)` as always-null.
 */
export type DynamicFormState = { [K in keyof ReturnType<typeof useDynamicForm>]: any };

export default function DynamicFormSection(props: any) {
  const state: DynamicFormState = useDynamicForm(props);
  const {
    activeForms,
    activeTenure,
    currentForm,
    forms,
    isConfirmOpen,
    isInitialFormDisabled,
    isInitialFormMissing,
    posterPreview,
    setTenureFilter,
    tenureFilter,
    trackingActiveForms
  } = state;



  return (
    <DynamicFormContext.Provider value={state}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingTop: '48px', paddingBottom: '80px' }}>

        {/* 1. Header Hub */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge-gold">
              Hub Registrasi & Formulir
            </span>
            <span className="badge-cyan">
              {activeForms.length} Formulir Dibuka
            </span>
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '14px', lineHeight: 1.2 }}>
            Pusat Registrasi & Formulir Terbuka
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Pilih dan lengkapi formulir pendaftaran kepengurusan, survei, atau pendaftaran kegiatan Bapekkris Bank Mandiri yang ingin Anda ikuti.
          </p>

          {/* Tenure Filter Buttons */}
          {activeTenure && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--input-bg)',
                padding: '3px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-card)'
              }}>
                <button
                  type="button"
                  onClick={() => setTenureFilter('active')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    background: tenureFilter === 'active' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                    color: tenureFilter === 'active' ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Periode {activeTenure?.code || activeTenure?.title || ''}
                </button>
                <button
                  type="button"
                  onClick={() => setTenureFilter('all')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    background: tenureFilter === 'all' ? 'rgba(255, 184, 0, 0.2)' : 'transparent',
                    color: tenureFilter === 'all' ? 'var(--mandiri-gold)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Lintas Tahun ({forms.filter((f: any) => f.isOpen !== false).length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CASE: Specific Form from URL Not Found or Deactivated */}
        {(isInitialFormMissing || isInitialFormDisabled) && <FormUnavailableNotice />}

        {/* CASE 1: No active forms available */}
        {activeForms.length === 0 && (
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '44px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 184, 0, 0.15)',
                color: 'var(--mandiri-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '4px'
              }}>
                <Clock size={32} />
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Belum Ada Registrasi / Formulir Yang Sedang Dibuka
              </h2>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Saat ini belum ada formulir pendaftaran atau kegiatan yang sedang dibuka untuk periode ini. Pantau terus kanal komunikasi kami untuk informasi kegiatan dan pembukaan formulir.
              </p>
            </div>
          </div>
        )}

        {/* 2. Form Switcher / Catalog Cards (Jika ada lebih dari 1 form aktif) */}
        {activeForms.length > 1 && <FormPicker />}

        {/* 3. The Active Dynamic Form View */}
        {currentForm && <FormPanel />}

        {/* CONFIRMATION PREVIEW MODAL SEBELUM SUBMIT */}
        {isConfirmOpen && currentForm && <SubmitConfirmModal />}

        {/* 4. SELF-SERVICE STATUS TRACKER ("CEK STATUS PENDAFTARAN SAYA") */}
        {/* Hanya muncul apabila ada formulir AKTIF yang MEMBUTUHKAN tracking progress */}
        {trackingActiveForms.length > 0 && <StatusTracker />}

        {/* 5. PENGUMUMAN PESERTA / CREW TERPILIH (HALL OF WELCOME & ONBOARDING BOARD) */}
        <AcceptedAnnouncement />

        {/* MODAL PREVIEW POSTER QR UNTUK MOBILE / IPHONE */}
        {posterPreview && <PosterPreviewModal />}

      </div>
    </DynamicFormContext.Provider>
  );
}
