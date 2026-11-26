import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button, Dialog, Field, Input } from '../ui';
import { changeAdminPassword } from '../lib/supabase';
import { PASSWORD_MIN_LENGTH, passwordChangeSchema, type PasswordChangeValues } from './validation/schemas';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  showToast: (message: string, type?: string) => void;
}

const EMPTY: PasswordChangeValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

/** Lets a signed-in admin change their own password after confirming the current one. */
export default function ChangePasswordDialog({ open, onClose, showToast }: ChangePasswordDialogProps) {
  const formId = useId();
  const [showPasswords, setShowPasswords] = useState(false);
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, reset, clearErrors, formState: { errors, isSubmitting } } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: EMPTY,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit'
  });

  const close = () => {
    if (isSubmitting) return;
    reset(EMPTY);
    setServerError('');
    setShowPasswords(false);
    onClose();
  };

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setServerError('');
    try {
      await changeAdminPassword(currentPassword, newPassword);
      showToast('Password berhasil diganti. Gunakan password baru saat masuk berikutnya.', 'success');
      reset(EMPTY);
      setShowPasswords(false);
      onClose();
    } catch (err) {
      setServerError((err as Error)?.message || 'Gagal mengganti password');
    }
  });

  const inputType = showPasswords ? 'text' : 'password';
  const field = (name: keyof PasswordChangeValues) => register(name, { onChange: () => clearErrors(name) });

  return (
    <Dialog
      open={open}
      onClose={close}
      dismissible={!isSubmitting}
      size="sm"
      title="Ganti password"
      description={`Minimal ${PASSWORD_MIN_LENGTH} karakter, berisi huruf dan angka.`}
      footer={(
        <>
          <Button variant="secondary" onClick={close} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" form={formId} loading={isSubmitting} icon={<KeyRound size={16} aria-hidden="true" />}>
            {isSubmitting ? 'Menyimpan…' : 'Simpan password'}
          </Button>
        </>
      )}
    >
      <form id={formId} onSubmit={submit} noValidate className="flex flex-col gap-4">
        {serverError && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-danger-line bg-danger-tint px-3 py-2.5 text-[0.88rem] text-ink">
            <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />{serverError}
          </p>
        )}
        <Field label="Password saat ini" required error={errors.currentPassword?.message}>
          <Input type={inputType} autoComplete="current-password" disabled={isSubmitting} {...field('currentPassword')} />
        </Field>
        <Field label="Password baru" required error={errors.newPassword?.message}>
          <Input type={inputType} autoComplete="new-password" disabled={isSubmitting} {...field('newPassword')} />
        </Field>
        <Field label="Ulangi password baru" required error={errors.confirmPassword?.message}>
          <Input type={inputType} autoComplete="new-password" disabled={isSubmitting} {...field('confirmPassword')} />
        </Field>
        <button
          type="button"
          onClick={() => setShowPasswords(v => !v)}
          aria-pressed={showPasswords}
          className="inline-flex w-fit cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-[0.86rem] font-medium text-navy-ink [font:inherit] hover:underline"
        >
          {showPasswords ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          {showPasswords ? 'Sembunyikan password' : 'Tampilkan password'}
        </button>
      </form>
    </Dialog>
  );
}
