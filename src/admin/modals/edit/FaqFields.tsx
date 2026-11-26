import { useEditDialogContext } from '../../AdminPortalContext';
import { Input, Select, Textarea } from '../../../ui';

/** Fields of the edit dialog for `faq` items. */
export default function FaqFields() {
  const {
    editingItem,
    setEditingItem
  } = useEditDialogContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label htmlFor="ef-faq-1" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Kategori Topik</label>
        <Select id="ef-faq-1"
          value={editingItem.item.category || 'Umum'}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, category: e.target.value } })}
        >
          <option value="Tentang Bapekkris">Tentang Bapekkris</option>
          <option value="Kegiatan & Event">Kegiatan & Event</option>
          <option value="Pelayanan & Operasional">Pelayanan & Operasional</option>
          <option value="Doa & Pelayanan Kasih">Doa & Pelayanan Kasih</option>
          <option value="Pendaftaran & Oprec">Pendaftaran & Oprec</option>
          <option value="Umum">Umum</option>
        </Select>
      </div>
      <div>
        <label htmlFor="ef-faq-2" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Pertanyaan (Question)</label>
        <Input id="ef-faq-2"
          type="text"
          value={editingItem.item.question || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, question: e.target.value } })}
        />
      </div>
      <div>
        <label htmlFor="ef-faq-3" className="mb-1.5 block text-[0.86rem] font-semibold text-ink">Jawaban Lengkap (Answer)</label>
        <Textarea id="ef-faq-3"
          rows={4}
          value={editingItem.item.answer || ''}
          onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, answer: e.target.value } })}
        />
      </div>
    </div>
  );
}
