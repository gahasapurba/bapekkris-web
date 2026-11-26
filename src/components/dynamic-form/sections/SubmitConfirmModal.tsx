import { Paperclip, Send } from 'lucide-react';
import { Button, Dialog } from '../../../ui';
import { useDynamicFormContext } from '../DynamicFormContext';

export default function SubmitConfirmModal() {
  const { currentFields, currentForm, fileData, formData, handleConfirmSubmit, isSubmitting, setIsConfirmOpen } = useDynamicFormContext();
  const close = () => setIsConfirmOpen(false);
  return (
    <Dialog open onClose={close} title="Periksa kembali isian Anda" description={currentForm.title}
      footer={<><Button variant="secondary" onClick={close}>Cek ulang</Button><Button variant="gold" onClick={handleConfirmSubmit} loading={isSubmitting} icon={<Send size={15} aria-hidden="true" />} data-autofocus>{isSubmitting ? 'Mengirim…' : 'Ya, kirim sekarang'}</Button></>}>
      <dl className="flex flex-col gap-4">
        {currentFields.map((field) => {
          const value = formData[field.id];
          const file = fileData[field.id];
          if (!value && !file) return null;
          return (
            <div key={field.id} className="border-b border-line pb-3 last:border-0 last:pb-0">
              <dt className="text-[0.8rem] font-semibold text-dim">{field.label}</dt>
              {field.type === 'file' && file
                ? <dd className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-ink"><Paperclip size={14} aria-hidden="true" />{file.name} ({file.size})</dd>
                : <dd className="mt-0.5 whitespace-pre-line break-words text-ink">{String(value)}</dd>}
            </div>
          );
        })}
      </dl>
      <p className="mt-5 text-[0.86rem] text-muted">Data akan diteruskan ke panitia dan disimpan di sistem resmi Bapekkris Bank Mandiri.</p>
    </Dialog>
  );
}
