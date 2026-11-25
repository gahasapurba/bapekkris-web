import { useState } from 'react';
import { Clock, Download, FileText, FolderOpen, Search } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { formatLastUpdatedWib } from '../../utils/dateUtils';
import { Badge, Button, ButtonLink, EmptyState, Input, PageHeader, cn } from '../../ui';

const IMAGE_RE = /\.(png|jpe?g|svg|webp|gif|avif)($|\?)/i;
const FALLBACK_IMG = '/assets/mandiri-club-bapekkris-original.png';

/** Same-origin download URL: Supabase Storage files go through the Netlify / dev reverse proxy. */
function downloadUrl(item: AppItem): string {
  const raw = String(item.fileUrl || item.previewUrl || '').trim();
  if (!raw) return '';
  return raw.includes('supabase.co/storage/v1/') ? raw.replace(/https:\/\/[^/]+\.supabase\.co\/storage\/v1\//, '/storage-proxy/') : raw;
}

function downloadName(item: AppItem): string {
  const raw = String(item.fileUrl || item.previewUrl || '').trim();
  const filePart = raw.split('/').pop()?.split('?')[0] || '';
  if (filePart.includes('.')) {
    try { return decodeURIComponent(filePart); } catch { return filePart; }
  }
  const base = String(item.title || 'asset').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_');
  const ext = String(item.fileType || 'file').toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${base}.${ext || 'png'}`;
}

const isImageUrl = (url: unknown): url is string =>
  typeof url === 'string' && url !== '' && (IMAGE_RE.test(url) || url.startsWith('data:image/') || (!url.startsWith('http') && url.includes('/assets/')));

function previewSrc(item: AppItem): string {
  if (item.previewUrl) return isImageUrl(item.previewUrl) ? item.previewUrl : '';
  return isImageUrl(item.fileUrl) ? item.fileUrl : '';
}

function AssetCard({ item }: { item: AppItem }) {
  const src = previewSrc(item);
  const darkBackdrop = String(item.title || '').toLowerCase().includes('white') || String(item.badge || '').toLowerCase().includes('dark');
  const href = downloadUrl(item);
  const meta = [item.fileType, item.fileSize].filter(Boolean).join(' · ');

  return (
    <li className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card">
      <div className={cn('flex h-40 items-center justify-center border-b border-line p-6', darkBackdrop ? 'bg-[#0b1424]' : 'bg-[#f4efe4]')}>
        {src ? (
          <img src={src} alt="" loading="lazy" className="max-h-24 max-w-[80%] object-contain" onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }} />
        ) : (
          <span className={cn("flex flex-col items-center gap-1.5", darkBackdrop ? "text-[#e3b341]" : "text-[#8a6508]")}>
            <FileText size={34} aria-hidden="true" />
            {item.fileType && <span className="text-[0.74rem] font-bold tracking-wide">{item.fileType}</span>}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {(item.badge || item.category) ? <Badge tone="gold">{item.badge || item.category}</Badge> : <span />}
          {meta && <span className="font-mono text-[0.74rem] text-dim">{meta}</span>}
        </div>
        <div className="flex-1">
          <h3 className="font-display text-[1.12rem] font-semibold leading-snug text-ink">{item.title}</h3>
          {item.description && <p className="mt-1.5 text-[0.88rem] leading-relaxed text-muted">{item.description}</p>}
        </div>
        {item.updatedAt && (
          <p className="inline-flex items-center gap-1.5 text-[0.76rem] text-dim"><Clock size={12} aria-hidden="true" />{formatLastUpdatedWib(item.updatedAt)}</p>
        )}
        {href ? (
          <ButtonLink href={href} download={downloadName(item)} target="_blank" rel="noopener noreferrer" variant="gold" icon={<Download size={15} aria-hidden="true" />} aria-label={`Unduh ${item.title}`} className="w-full">
            Unduh / buka
          </ButtonLink>
        ) : (
          <Button variant="secondary" disabled className="w-full">Berkas belum tersedia</Button>
        )}
      </div>
    </li>
  );
}

export default function AssetKitSection({ brandAssets = [] }: { theme?: string; brandAssets?: AppItem[] }) {
  const [category, setCategory] = useState('Semua');
  const [query, setQuery] = useState('');

  const categoryOf = (a: AppItem) => a.category || 'Logo & Brand';
  const categories = ['Semua', ...Array.from(new Set(brandAssets.map(categoryOf)))];
  const q = query.trim().toLowerCase();
  const filtered = brandAssets.filter((a) =>
    (category === 'Semua' || categoryOf(a) === category) &&
    (!q || [a.title, a.description, a.badge, a.fileType].some((v) => String(v || '').toLowerCase().includes(q)))
  );

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-24 md:px-6">
      <PageHeader eyebrow="Aset & Logo" title="Identitas visual Bapekkris"
        description="Logo resmi, template presentasi ibadah, virtual background kebaktian, dan panduan identitas visual Bapekkris Bank Mandiri — siap diunduh." />

      {brandAssets.length === 0 ? (
        <EmptyState icon={<FolderOpen size={22} />} title="Belum ada aset resmi"
          description="Logo, virtual background, atau template dokumen belum diunggah. Pengurus dapat menambahkannya melalui Admin Portal." />
      ) : (
        <section aria-label="Katalog aset">
          <div className="mb-5 flex flex-col gap-4 border-y border-line py-4 md:flex-row md:items-center md:justify-between">
            <div role="group" aria-label="Kategori" className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button key={cat} type="button" aria-pressed={category === cat} onClick={() => setCategory(cat)}
                  className={cn('inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border px-4 text-[0.84rem] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy-ink',
                    category === cat ? 'border-action bg-action text-on-action' : 'border-line bg-surface text-muted hover:border-line-strong hover:text-ink')}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative md:w-72">
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
              <Input type="search" aria-label="Cari aset" placeholder="Cari aset" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-full pl-10" />
            </div>
          </div>
          <p className="mb-4 text-[0.86rem] text-muted" aria-live="polite">{filtered.length} aset</p>
          {filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-6 py-10 text-center text-muted">Tidak ada aset yang cocok dengan pencarian.</p>
          ) : (
            <ul className="grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => <AssetCard key={item.id} item={item} />)}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
