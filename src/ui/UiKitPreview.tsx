import { useState } from 'react';
import { CalendarDays, Plus, Inbox } from 'lucide-react';
import { Badge, Button, Card, CardTitle, Dialog, EmptyState, Field, Input, PageHeader, Select, Skeleton, Tabs, Textarea, useFeedback } from '.';

/** Development-only showcase of the base components (open /#ui-kit with `npm run dev`). */
export default function UiKitPreview() {
  const { toast, confirm } = useFeedback();
  const [tab, setTab] = useState<'list' | 'calendar'>('list');
  const [open, setOpen] = useState(false);
  const toggleTheme = () => {
    const root = document.documentElement;
    root.setAttribute('data-theme', root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  };
  return (
    <main className="min-h-screen bg-page px-6 pb-24 font-sans text-ink">
      <div className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Komponen Dasar"
          title="Sanctuary Editorial"
          description="Ivory hangat, navy Mandiri pekat, emas secukupnya. Halaman ini hanya ada di mode development."
          actions={<Button variant="secondary" onClick={toggleTheme}>Ganti tema</Button>}
        />
        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardTitle>Tombol</CardTitle>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button icon={<Plus size={16} />}>Primary</Button>
              <Button variant="gold">Daftar Sekarang</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Hapus</Button>
              <Button loading>Menyimpan</Button>
              <Button size="sm" variant="secondary">Kecil</Button>
            </div>
          </Card>
          <Card>
            <CardTitle>Badge & Tabs</CardTitle>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>Netral</Badge><Badge tone="navy">Ibadah</Badge><Badge tone="gold">Pilihan</Badge>
              <Badge tone="info">Info</Badge><Badge tone="success">Diterima</Badge><Badge tone="danger">Ditutup</Badge>
            </div>
            <Tabs className="mt-5" label="Tampilan acara" value={tab} onChange={setTab}
              items={[{ id: 'list', label: 'Daftar' }, { id: 'calendar', label: 'Kalender', icon: <CalendarDays size={15} /> }]} />
          </Card>
          <Card>
            <CardTitle>Formulir</CardTitle>
            <div className="mt-4 flex flex-col gap-4">
              <Field label="Nama lengkap" required hint="Sesuai data kepegawaian"><Input placeholder="Nama Anda" /></Field>
              <Field label="Email" required error="Email wajib diisi dengan format yang valid"><Input defaultValue="salah" /></Field>
              <Field label="Divisi"><Select defaultValue=""><option value="">Pilih divisi</option><option>Pujian</option></Select></Field>
              <Field label="Pokok doa"><Textarea placeholder="Tuliskan pokok doa" /></Field>
            </div>
          </Card>
          <Card>
            <CardTitle>Umpan balik</CardTitle>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => toast('Perubahan tersimpan.', 'success')}>Toast sukses</Button>
              <Button variant="secondary" onClick={() => toast('Gagal menyimpan.', 'error')}>Toast error</Button>
              <Button variant="secondary" onClick={() => setOpen(true)}>Dialog</Button>
              <Button variant="danger" onClick={async () => toast((await confirm({ title: 'Hapus renungan?', message: 'Tidak dapat dibatalkan.', danger: true, confirmLabel: 'Hapus' })) ? 'Dihapus' : 'Dibatalkan')}>Konfirmasi</Button>
            </div>
            <div className="mt-6 flex flex-col gap-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
          </Card>
          <EmptyState className="md:col-span-2" icon={<Inbox size={22} />} title="Belum ada acara" description="Acara yang dipublikasikan akan tampil di sini." action={<Button variant="secondary">Lihat arsip</Button>} />
        </section>
      </div>
      <Dialog open={open} onClose={() => setOpen(false)} title="Konfirmasi kehadiran" description="Ibadah Natal • 20 Desember 2026"
        footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Batal</Button><Button onClick={() => setOpen(false)}>Kirim</Button></>}>
        <Field label="Nama" required><Input data-autofocus /></Field>
      </Dialog>
    </main>
  );
}
