import { ArrowRight, Compass } from 'lucide-react';
import type { AppItem } from '../../lib/supabase';
import { Button, cn } from '../../ui';
import { Container } from './shared';

interface HomeHeroProps {
  activeTenure?: AppItem | null;
  activeForms: AppItem[];
  stats: { label: string; value: string; caption: string; tab: string }[];
  showEvents: boolean;
  showOrganisation: boolean;
  go: (tab: string, formId?: string | null) => void;
}

export function HomeHero({ activeTenure, activeForms, stats, showEvents, showOrganisation, go }: HomeHeroProps) {
  const headline = activeTenure?.heroHeadline || 'Badan Pembinaan Kerohanian Kristen';
  const highlight = activeTenure?.heroHeadline ? activeTenure?.heroHighlight : 'Bank Mandiri';
  const tagline = activeTenure?.themeTagline || 'Menjadi Terang dan Garam bagi Negeri, Melayani dengan Kasih dan Integritas Kristus.';
  const description = activeTenure?.description || 'Wadah persekutuan, ibadah, pembinaan iman, dan pelayanan kasih bagi seluruh insan Kristen PT Bank Mandiri (Persero) Tbk.';

  const primaryCta = activeForms.length > 1
    ? { label: `Lihat ${activeForms.length} Pendaftaran yang Dibuka`, onClick: () => go('form') }
    : activeForms.length === 1
      ? { label: `Daftar: ${activeForms[0].title}`, onClick: () => go('form', activeForms[0].id) }
      : showEvents ? { label: 'Lihat Ibadah & Acara', onClick: () => go('event') } : null;

  return (
    <section aria-labelledby="home-title" className="pb-16 pt-14 md:pb-24 md:pt-20">
      <Container className="flex flex-col items-center text-center">
        <p className="text-[0.76rem] font-semibold uppercase tracking-[0.2em] text-gold-ink">
          Portal Resmi Bapekkris Bank Mandiri{activeTenure?.code ? ` · Periode ${activeTenure.code}` : ''}
        </p>
        <h1 id="home-title" className="mt-6 max-w-[18ch] font-display text-[clamp(2.4rem,6.2vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.025em] text-ink">
          {headline}
          {highlight && <> <em className="font-medium text-gold-ink">{highlight}</em></>}
        </h1>
        <div className="mt-8 h-px w-16 bg-gold" aria-hidden="true" />
        <p className="mt-8 max-w-[46ch] font-display text-[clamp(1.1rem,2vw,1.35rem)] italic leading-relaxed text-ink">“{tagline}”</p>
        <p className="mt-5 max-w-[60ch] text-[1.02rem] leading-relaxed text-muted">{description}</p>

        {(primaryCta || showOrganisation) && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {primaryCta && (
              <Button variant={activeForms.length > 0 ? 'gold' : 'primary'} size="lg" onClick={primaryCta.onClick} iconRight={<ArrowRight size={18} aria-hidden="true" />} className="max-w-full whitespace-normal">
                {primaryCta.label}
              </Button>
            )}
            {showOrganisation && (
              <Button variant="secondary" size="lg" onClick={() => go('organisasi')} icon={<Compass size={18} aria-hidden="true" />}>
                Struktur Organisasi
              </Button>
            )}
          </div>
        )}

        {stats.length > 0 && (
          <ul className="mt-16 grid w-full max-w-4xl list-none grid-cols-2 border-y border-line md:grid-cols-4">
            {stats.map((s, i) => (
              <li key={s.label} className={cn('border-line', i % 2 === 1 && 'border-l', i === 2 && 'md:border-l', i >= 2 && 'border-t md:border-t-0')}>
                <button type="button" onClick={() => go(s.tab)} className="flex h-full w-full cursor-pointer flex-col items-center gap-1 border-0 bg-transparent px-4 py-7 transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-navy-ink">
                  <span className="order-2 text-[0.82rem] font-semibold text-ink">{s.label}</span>
                  <span className="order-1 font-display text-[2.4rem] font-semibold leading-none text-ink">{s.value}</span>
                  <span className="order-3 text-[0.78rem] text-dim">{s.caption}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
