// Per-page <head> metadata: title, description, canonical URL, Open Graph, robots and JSON-LD.
// buildPageMeta is pure (unit-tested); useDocumentMeta applies the result to document.head.

import { useEffect } from 'react';
import type { AppItem } from './supabase';

export const SITE_NAME = 'Bapekkris Bank Mandiri';
export const SITE_URL = 'https://bapekkris-mandiri.netlify.app';
const DEFAULT_DESCRIPTION =
  'Website resmi Bapekkris (Badan Pembinaan Kerohanian Kristen) PT Bank Mandiri (Persero) Tbk: persekutuan, ibadah, renungan harian, Alkitab, kidung pujian, dan pelayanan kasih insan Mandiri.';
const DEFAULT_IMAGE = `${SITE_URL}/assets/mandiri-club-bapekkris-original.png`;

type Item = AppItem;

export interface PageMeta {
  title: string;
  description: string;
  /** Path + query relative to the site root, e.g. "/?event=E1". */
  path: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | null;
}

export interface PageMetaContext {
  event?: Item | null;
  form?: Item | null;
  gallery?: Item | null;
  /** Public events, used for the event list's structured data. */
  events?: Item[];
}

const TAB_META: Record<string, { title: string; description: string }> = {
  home: { title: `${SITE_NAME} — Badan Pembinaan Kerohanian Kristen`, description: DEFAULT_DESCRIPTION },
  organisasi: { title: 'Struktur Organisasi', description: 'Susunan pengurus, divisi, dan pelayan Bapekkris Bank Mandiri per periode kepengurusan.' },
  event: { title: 'Ibadah & Acara', description: 'Jadwal ibadah, persekutuan, retreat, dan kegiatan pelayanan Bapekkris Bank Mandiri. Konfirmasi kehadiran dan tambahkan ke kalender.' },
  renungan: { title: 'Renungan Harian', description: 'Renungan harian dengan bacaan Alkitab, refleksi, dan doa dari Bapekkris Bank Mandiri.' },
  alkitab: { title: 'Alkitab Online', description: 'Baca Alkitab Terjemahan Baru (TB), KJV, dan WEB per kitab dan pasal, lalu bagikan atau tayangkan ayat.' },
  lagu: { title: 'Kidung Jemaat & Lagu Rohani', description: 'Lirik Kidung Jemaat, Pelengkap Kidung Jemaat, Nyanyikanlah Kidung Baru, dan lagu pujian penyembahan.' },
  doa: { title: 'Pokok Doa', description: 'Kirim permohonan doa dan turut mendoakan pokok doa jemaat Bapekkris Bank Mandiri.' },
  easyworship: { title: 'Multimedia Live', description: 'Konsol presentasi ibadah untuk menayangkan lirik, ayat, dan pengumuman ke proyektor.' },
  galeri: { title: 'Galeri Kegiatan', description: 'Dokumentasi foto kegiatan persekutuan dan pelayanan Bapekkris Bank Mandiri.' },
  assets: { title: 'Aset & Logo Resmi', description: 'Logo, templat, dan materi resmi Bapekkris Bank Mandiri untuk diunduh.' },
  form: { title: 'Registrasi & Formulir', description: 'Formulir pendaftaran kegiatan, kepengurusan, dan survei Bapekkris Bank Mandiri.' },
  admin: { title: 'Portal Pengurus', description: 'Portal pengelolaan konten Bapekkris Bank Mandiri.' },
  'event-stats': { title: 'Statistik Acara', description: 'Statistik pendaftaran dan check-in acara.' },
  projector: { title: 'Layar Proyektor', description: 'Tampilan proyektor ibadah.' }
};
const PRIVATE_TABS = new Set(['admin', 'event-stats', 'projector']);

function withSiteName(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
}

function snippet(text: unknown, fallback: string): string {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  return clean.length > 160 ? `${clean.slice(0, 157).trimEnd()}…` : clean;
}

/** Event dates are WIB wall-clock strings; schema.org wants ISO 8601 with an offset. */
export function toSchemaDate(value: unknown): string | undefined {
  const match = String(value || '').trim().match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::(\d{2}))?)?/);
  if (!match) return undefined;
  const [, date, time, seconds] = match;
  return time ? `${date}T${time}:${seconds || '00'}+07:00` : date;
}

function absolute(url: unknown): string | undefined {
  const value = String(url || '');
  if (!value) return undefined;
  return value.startsWith('/') ? `${SITE_URL}${value}` : value;
}

export function eventJsonLd(event: Item): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: snippet(event.description, `Kegiatan ${SITE_NAME}`),
    startDate: toSchemaDate(event.startDate || event.date),
    endDate: toSchemaDate(event.endDate || event.startDate || event.date),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: event.location || 'Menyesuaikan', address: event.location || 'Indonesia' },
    organizer: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    url: `${SITE_URL}/?event=${encodeURIComponent(event.id)}`,
    image: absolute(event.image || event.bannerImage) || DEFAULT_IMAGE
  };
}

export function buildPageMeta(tab: string, ctx: PageMetaContext = {}): PageMeta {
  const base = TAB_META[tab] || TAB_META.home;
  const noindex = PRIVATE_TABS.has(tab);

  if (tab === 'event' && ctx.event) {
    const e = ctx.event;
    return {
      title: withSiteName(e.title),
      description: snippet(e.description, base.description),
      path: `/?event=${encodeURIComponent(e.id)}`,
      image: absolute(e.image || e.bannerImage),
      jsonLd: eventJsonLd(e)
    };
  }
  if (tab === 'form' && ctx.form) {
    const f = ctx.form;
    return {
      title: withSiteName(f.title),
      description: snippet(f.subtitle || f.description, base.description),
      path: `/?form=${encodeURIComponent(f.id)}`
    };
  }
  if (tab === 'galeri' && ctx.gallery) {
    const g = ctx.gallery;
    return {
      title: withSiteName(g.title),
      description: snippet(g.description, base.description),
      path: `/?gallery=${encodeURIComponent(g.id)}`,
      image: absolute(Array.isArray(g.photos) ? g.photos[0] : undefined)
    };
  }

  let jsonLd: Record<string, unknown> | null = null;
  if (tab === 'event' && ctx.events && ctx.events.length > 0) {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: ctx.events.slice(0, 20).map((event, i) => ({ '@type': 'ListItem', position: i + 1, item: eventJsonLd(event) }))
    };
  }

  return {
    title: withSiteName(base.title),
    description: base.description,
    path: tab === 'home' || noindex ? '/' : `/#${tab}`,
    noindex,
    jsonLd
  };
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/** Applies page metadata to <head>; runs whenever the meta values change. */
export function useDocumentMeta(meta: PageMeta) {
  const jsonLdText = meta.jsonLd ? JSON.stringify(meta.jsonLd) : '';
  useEffect(() => {
    const url = `${SITE_URL}${meta.path}`;
    const image = meta.image || DEFAULT_IMAGE;
    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:title', meta.title);
    setMeta('name', 'twitter:description', meta.description);
    setMeta('name', 'twitter:image', image);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    // Fragments are not separate pages for search engines, so hash tabs canonicalize to "/".
    canonical.href = `${SITE_URL}${meta.path.split('#')[0] || '/'}`;

    const existing = document.getElementById('page-jsonld');
    if (jsonLdText) {
      const script = existing || Object.assign(document.createElement('script'), { id: 'page-jsonld', type: 'application/ld+json' });
      script.textContent = jsonLdText;
      if (!existing) document.head.appendChild(script);
    } else if (existing) {
      existing.remove();
    }
  }, [meta.title, meta.description, meta.path, meta.image, meta.noindex, jsonLdText]);
}
