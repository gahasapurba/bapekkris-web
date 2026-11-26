import { ArrowLeft, Lock } from 'lucide-react';
import { Button, Card } from '../ui';

/** Shown in place of admin-only pages (such as live registration stats) to visitors without an admin session. */
interface AdminOnlyNoticeProps {
  isLoading?: boolean;
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminOnlyNotice({ isLoading = false, onLogin, onBack }: AdminOnlyNoticeProps) {
  return (
    <section className="mx-auto my-14 w-full max-w-[480px] px-4">
      <Card padding="lg" className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-13 items-center justify-center rounded-full bg-navy-tint text-navy-ink"><Lock size={24} aria-hidden="true" /></span>
        <h2 className="font-display text-[1.35rem] font-semibold text-ink">{isLoading ? 'Memeriksa sesi admin…' : 'Halaman khusus admin'}</h2>
        {!isLoading && (
          <>
            <p className="text-[0.92rem] leading-relaxed text-muted">
              Statistik pendaftaran dan pengundian doorprize memuat data pribadi peserta, sehingga hanya dapat dibuka oleh pengurus yang sudah masuk ke Admin Portal.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={onLogin}>Masuk sebagai admin</Button>
              <Button variant="secondary" icon={<ArrowLeft size={16} aria-hidden="true" />} onClick={onBack}>Kembali ke acara</Button>
            </div>
          </>
        )}
      </Card>
    </section>
  );
}
