import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button, Field, Input } from '../ui';
import { loginSchema, type LoginValues } from './validation/schemas';

interface AdminLoginFormProps {
  /** Signs in with Supabase Auth; rejects with a user-facing message. */
  onLogin: (email: string, password: string) => Promise<unknown>;
  showToast: (message: string, type?: string) => void;
}

/**
 * Admin sign-in form (react-hook-form + zod). Errors appear on submit and a field's error clears
 * as soon as it is edited.
 */
export default function AdminLoginForm({ onLogin, showToast }: AdminLoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { register, handleSubmit, clearErrors, resetField, formState: { errors, isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { loginEmail: '', loginPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit'
  });

  const submit = handleSubmit(async ({ loginEmail, loginPassword }) => {
    setLoginError('');
    try {
      await onLogin(loginEmail, loginPassword);
      resetField('loginPassword');
      showToast('Berhasil masuk! Selamat datang di Admin Portal', 'success');
    } catch (err) {
      const message = (err as Error)?.message || 'Gagal memverifikasi kredensial';
      setLoginError(message);
      showToast(message, 'error');
    }
  });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {loginError && (
        <p role="alert" className="flex items-start gap-2 rounded-md border border-danger-line bg-danger-tint px-3 py-2.5 text-[0.88rem] text-ink">
          <AlertCircle size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-danger" />{loginError}
        </p>
      )}
      <Field label="Email" required error={errors.loginEmail?.message}>
        <Input type="email" autoComplete="username" placeholder="nama@bankmandiri.co.id" disabled={isSubmitting}
          {...register('loginEmail', { onChange: () => clearErrors('loginEmail') })} />
      </Field>
      <div className="relative">
        <Field label="Password" required error={errors.loginPassword?.message}>
          <Input type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Masukkan password" disabled={isSubmitting} className="pr-12"
            {...register('loginPassword', { onChange: () => clearErrors('loginPassword') })} />
        </Field>
        <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} aria-pressed={showPassword}
          className="absolute right-1.5 top-[30px] inline-flex size-9 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-muted hover:text-ink">
          {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      <Button type="submit" size="lg" loading={isSubmitting} icon={<KeyRound size={17} aria-hidden="true" />} className="mt-1 w-full">
        {isSubmitting ? 'Memverifikasi…' : 'Masuk'}
      </Button>
    </form>
  );
}
