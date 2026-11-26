import { Clock } from 'lucide-react';
import { EmptyState, PageHeader, cn } from '../../ui';
import { useDynamicForm, type UseDynamicFormProps } from './useDynamicForm';
import { DynamicFormContext } from './DynamicFormContext';
import FormUnavailableNotice from './sections/FormUnavailableNotice';
import FormPicker from './sections/FormPicker';
import FormPanel from './sections/FormPanel';
import SubmitConfirmModal from './sections/SubmitConfirmModal';
import StatusTracker from './sections/StatusTracker';
import AcceptedAnnouncement from './sections/AcceptedAnnouncement';
import PosterPreviewModal from './sections/PosterPreviewModal';

export default function DynamicFormSection(props: UseDynamicFormProps) {
  const state = useDynamicForm(props);
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



  const openFormsCount = forms.filter((f) => f.isOpen !== false).length;
  const pill = (active: boolean) => cn(
    'inline-flex h-9 cursor-pointer items-center rounded-full border-0 px-4 text-[0.86rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
    active ? 'bg-action text-on-action' : 'bg-transparent text-muted hover:bg-subtle hover:text-ink'
  );

  return (
    <DynamicFormContext.Provider value={state}>
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-12 px-4 pb-24 md:px-6">
        <PageHeader
          className="pb-2"
          eyebrow="Registrasi & Formulir"
          title="Pendaftaran yang sedang dibuka"
          description="Pilih dan lengkapi formulir pendaftaran kepengurusan, survei, atau kegiatan Bapekkris Bank Mandiri yang ingin Anda ikuti."
          actions={activeTenure ? (
            <div role="group" aria-label="Periode" className="inline-flex gap-1 rounded-full border border-line bg-surface p-1">
              <button type="button" aria-pressed={tenureFilter === 'active'} onClick={() => setTenureFilter('active')} className={pill(tenureFilter === 'active')}>Periode {activeTenure?.code || activeTenure?.title || ''}</button>
              <button type="button" aria-pressed={tenureFilter === 'all'} onClick={() => setTenureFilter('all')} className={pill(tenureFilter === 'all')}>Semua periode ({openFormsCount})</button>
            </div>
          ) : undefined}
        />

        {(isInitialFormMissing || isInitialFormDisabled) && <FormUnavailableNotice />}

        {activeForms.length === 0 && (
          <EmptyState icon={<Clock size={22} />} title="Belum ada pendaftaran yang dibuka"
            description="Saat ini belum ada formulir pendaftaran atau kegiatan yang dibuka untuk periode ini. Pantau terus kanal komunikasi kami." />
        )}

        {activeForms.length > 1 && <FormPicker />}
        {currentForm && <FormPanel />}
        {isConfirmOpen && currentForm && <SubmitConfirmModal />}
        {trackingActiveForms.length > 0 && <StatusTracker />}
        <AcceptedAnnouncement />
        {posterPreview && <PosterPreviewModal />}
      </div>
    </DynamicFormContext.Provider>
  );
}
