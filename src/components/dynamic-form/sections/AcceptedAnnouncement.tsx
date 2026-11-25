import type { AppItem } from '../../../lib/supabase';
import { formatWibTimestamp } from '../../../utils/dateUtils';
import { Badge, Card, Pagination } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

const PER_PAGE = 8;

/** Public list of accepted applicants (when the form enables the announcement). */
export default function AcceptedAnnouncement() {
  const { acceptedList, acceptedPage, currentForm, forms, setAcceptedPage } = useDynamicFormContext();
  if (!currentForm?.showAnnouncement || acceptedList.length === 0) return null;
  const pageCount = Math.ceil(acceptedList.length / PER_PAGE) || 1;
  const page = Math.min(Math.max(1, acceptedPage), pageCount);
  const visible: AppItem[] = acceptedList.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  return (
    <section aria-labelledby="accepted-title" className="mx-auto w-full max-w-[820px]">
      <Card padding="lg" className="flex flex-col gap-6 border-success-line">
        <div>
          <p className="text-[0.76rem] font-semibold uppercase tracking-[0.14em] text-success">Pengumuman resmi</p>
          <h2 id="accepted-title" className="mt-2 font-display text-[1.6rem] font-semibold text-ink">Selamat bergabung ({acceptedList.length})</h2>
          <p className="mt-2 text-muted">Rekan-rekan yang dinyatakan lolos seleksi atau terdaftar pada program Bapekkris Bank Mandiri.</p>
        </div>
        <ul className="grid list-none gap-3 sm:grid-cols-2">
          {visible.map((sub) => (
            <li key={sub.id} className="flex flex-col gap-1.5 rounded-lg border border-line bg-page p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge tone="success">Diterima</Badge>
                <span className="text-[0.74rem] text-dim">{formatWibTimestamp(sub.createdAt || sub.submittedAt).exact || sub.submittedAt || sub.createdAt}</span>
              </div>
              <p className="font-display text-[1.08rem] font-semibold text-ink">{sub.participantName}</p>
              {sub.participantDetail && <p className="text-[0.86rem] font-semibold text-gold-ink">{sub.participantDetail}</p>}
              <p className="text-[0.82rem] text-dim">{forms.find((f: AppItem) => f.id === sub.formId)?.title || sub.formTitle || 'Formulir'}</p>
              {sub.adminNotes && <p className="mt-1 rounded-md bg-success-tint px-3 py-2 text-[0.84rem] text-ink"><strong className="block text-[0.72rem] uppercase tracking-[0.1em] text-success">Info onboarding</strong>{sub.adminNotes}</p>}
            </li>
          ))}
        </ul>
        <Pagination page={page} pageCount={pageCount} onChange={setAcceptedPage} itemLabel="peserta" total={acceptedList.length} pageSize={PER_PAGE} />
      </Card>
    </section>
  );
}
