import { AlertCircle } from 'lucide-react';
import { Button, EmptyState } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

/** A shared form link that points at a missing or disabled form. */
export default function FormUnavailableNotice() {
  const { activeForms, isInitialFormDisabled, navigateTo, onSelectFormUrl, requestedForm, setSelectedFormId } = useDynamicFormContext();
  return (
    <div className="mx-auto w-full max-w-[680px]">
      <EmptyState
        className="border-danger-line bg-danger-tint"
        icon={<AlertCircle size={22} />}
        title={isInitialFormDisabled ? 'Formulir sedang dinonaktifkan' : 'Formulir tidak ditemukan'}
        description={isInitialFormDisabled
          ? `Formulir “${requestedForm?.title || 'ini'}” sedang dinonaktifkan atau ditutup oleh pengelola.`
          : 'Tautan formulir yang Anda tuju tidak ditemukan atau sudah dihapus pengelola.'}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="secondary" onClick={() => { onSelectFormUrl?.(null); navigateTo('/#home'); }}>Kembali ke Beranda</Button>
            {activeForms.length > 0 && (
              <Button onClick={() => { onSelectFormUrl?.(activeForms[0].id); setSelectedFormId(activeForms[0].id); }}>Lihat formulir yang dibuka ({activeForms.length})</Button>
            )}
          </div>
        }
      />
    </div>
  );
}
