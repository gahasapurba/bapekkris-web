import { BrandMark } from './BrandMark';
import { NAV_ITEMS, isPageShown, type PageVisibility } from './navItems';
import { DANANTARA_LOGO, MANDIRI_LOGO, logoFor } from '../../lib/brandLogos';

interface SiteFooterProps {
  theme: 'light' | 'dark';
  pageVisibility?: PageVisibility;
  setCurrentTab?: (tab: string) => void;
}

export default function SiteFooter({ theme, pageVisibility = {}, setCurrentTab }: SiteFooterProps) {
  const isDark = theme === 'dark';
  const year = new Date().getFullYear();
  const links = NAV_ITEMS.filter((item) => isPageShown(item.id, pageVisibility));
  return (
    <footer className="mt-auto border-t border-line bg-subtle">
      <div className="mx-auto grid max-w-[1260px] gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-6">
        <div className="flex flex-col gap-4">
          <BrandMark isDark={isDark} />
          <p className="max-w-sm text-[0.92rem] leading-relaxed text-muted">
            Badan Pembinaan Kerohanian Kristen PT Bank Mandiri (Persero) Tbk. — wadah persekutuan, ibadah, dan pelayanan kasih insan Mandiri.
          </p>
        </div>
        {setCurrentTab && links.length > 0 && (
          <nav aria-label="Tautan footer">
            <p className="mb-3 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-dim">Jelajahi</p>
            <ul className="grid list-none grid-cols-2 gap-x-6 gap-y-2 md:grid-cols-1">
              {links.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setCurrentTab(item.id)} className="cursor-pointer border-0 bg-transparent p-0 text-left text-[0.92rem] text-ink hover:text-navy-ink hover:underline">
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div>
          <p className="mb-4 text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-dim">Bagian dari</p>
          <div className="flex flex-wrap items-center gap-6">
            <img {...logoFor(MANDIRI_LOGO, isDark)} alt="Bank Mandiri" loading="lazy" className="h-6 w-auto object-contain" />
            <img {...logoFor(DANANTARA_LOGO, isDark)} alt="Danantara Indonesia" loading="lazy" className="h-[22px] w-auto object-contain" />
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1260px] flex-col gap-2 px-4 py-5 text-[0.82rem] text-dim md:flex-row md:items-center md:justify-between md:px-6">
          <p>© {year} Bapekkris Bank Mandiri</p>
          <p className="font-display italic">“Kamu adalah garam dunia … Kamu adalah terang dunia.” — Matius 5:13–14</p>
        </div>
      </div>
    </footer>
  );
}
