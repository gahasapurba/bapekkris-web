import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Trash2 } from 'lucide-react';
import { listAdminProfiles, assignAdminRole, revokeAdminRole, type AdminProfile, type AppItem } from '../lib/supabase';
import { adminAccountSchema, type AdminAccountValues } from './validation/schemas';
import { Badge, Button, Field, Input, Select, Skeleton, useFeedback } from '../ui';
import { AdminEmpty, AdminPanel, AdminSubsection } from './AdminUi';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  division_admin: 'Admin Divisi'
};

/**
 * Super admin panel to grant or revoke admin access. Accounts themselves are created in
 * Supabase Authentication; this panel attaches a role (and division for division admins).
 */
interface AdminAccountsPanelProps {
  divisions?: AppItem[];
  currentUserId?: string;
  showToast?: (message: string, type?: string) => void;
}

export default function AdminAccountsPanel({ divisions = [], currentUserId, showToast }: AdminAccountsPanelProps) {
  const { confirm } = useFeedback();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Server-side failure (validation messages come from the form below).
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    resetField,
    formState: { errors, isSubmitting: isSaving }
  } = useForm<AdminAccountValues>({
    resolver: zodResolver(adminAccountSchema),
    defaultValues: { email: '', displayName: '', role: 'division_admin', divisionId: '' },
    // Like before: a message stays until the form is submitted again.
    reValidateMode: 'onSubmit'
  });
  const role = watch('role');

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      setAdmins(await listAdminProfiles());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const divisionName = (id: string | null) => divisions.find(d => d.id === id)?.name || '-';

  const handleAssign = handleSubmit(
    async ({ email, displayName, role: selectedRole, divisionId }) => {
      setError('');
      try {
        await assignAdminRole(email.trim(), selectedRole, selectedRole === 'division_admin' ? divisionId : null, displayName.trim());
        showToast?.(`Akses ${ROLE_LABELS[selectedRole]} diberikan ke ${email.trim()}`);
        resetField('email');
        resetField('displayName');
        await loadAdmins();
      } catch (err) {
        setError((err as Error).message);
      }
    },
    () => setError('')
  );

  const handleRevoke = async (admin: AdminProfile) => {
    const ok = await confirm({
      title: `Cabut akses admin untuk ${admin.email}?`,
      message: 'Akun tetap ada di Supabase Authentication, tetapi tidak bisa lagi membuka Admin Portal.',
      confirmLabel: 'Cabut akses',
      danger: true
    });
    if (!ok) return;
    try {
      await revokeAdminRole(admin.userId);
      showToast?.(`Akses admin ${admin.email} dicabut`);
      await loadAdmins();
    } catch (err) {
      showToast?.((err as Error).message, 'error');
    }
  };

  return (
    <AdminPanel title={`Kelola admin (${admins.length})`} description="Beri atau cabut akses portal. Admin Divisi hanya bisa mengelola pengurus, acara, formulir, pendaftaran, dan galeri divisinya.">
      <AdminSubsection title="Beri akses admin">
        <p className="-mt-1 text-[0.86rem] text-muted">Buat akunnya dulu di Supabase → Authentication → Users, lalu masukkan email akun tersebut di sini.</p>
        <form onSubmit={handleAssign} noValidate className="grid gap-4 md:grid-cols-2">
          <Field label="Email akun" required error={errors.email?.message}><Input type="email" autoComplete="off" placeholder="nama@bankmandiri.co.id" {...register('email')} /></Field>
          <Field label="Nama tampilan" hint="Opsional"><Input {...register('displayName')} /></Field>
          <Field label="Peran">
            <Select {...register('role')}>
              <option value="division_admin">{ROLE_LABELS.division_admin}</option>
              <option value="super_admin">{ROLE_LABELS.super_admin}</option>
            </Select>
          </Field>
          {role === 'division_admin' && (
            <Field label="Divisi" required error={errors.divisionId?.message}>
              <Select {...register('divisionId')}>
                <option value="">Pilih divisi</option>
                {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
          )}
          {error && <p role="alert" className="rounded-md border border-danger-line bg-danger-tint px-3 py-2 text-[0.86rem] text-ink md:col-span-2">{error}</p>}
          <div className="flex justify-end md:col-span-2"><Button type="submit" loading={isSaving} icon={<ShieldCheck size={16} aria-hidden="true" />}>Simpan akses</Button></div>
        </form>
      </AdminSubsection>

      <div className="flex flex-col gap-3">
        <h3 className="text-[0.98rem] font-semibold text-ink">Daftar admin</h3>
        {isLoading ? (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label="Memuat daftar admin"><Skeleton className="h-14" /><Skeleton className="h-14" /></div>
        ) : admins.length === 0 ? <AdminEmpty>Belum ada admin terdaftar.</AdminEmpty> : (
          <ul className="flex list-none flex-col divide-y divide-line overflow-hidden rounded-md border border-line">
            {admins.map((admin) => (
              <li key={admin.userId} className="flex flex-wrap items-center justify-between gap-3 bg-surface px-4 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                    {admin.displayName || admin.email}
                    {admin.userId === currentUserId && <Badge>Anda</Badge>}
                    <Badge tone={admin.role === 'super_admin' ? 'gold' : 'navy'}>{ROLE_LABELS[admin.role]}</Badge>
                  </p>
                  <p className="mt-0.5 text-[0.84rem] text-muted">{admin.email}{admin.role === 'division_admin' && ` · ${divisionName(admin.divisionId)}`}</p>
                </div>
                {admin.userId !== currentUserId && (
                  <Button size="sm" variant="danger" icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => handleRevoke(admin)} aria-label={`Cabut akses ${admin.email}`}>Cabut akses</Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminPanel>
  );
}
