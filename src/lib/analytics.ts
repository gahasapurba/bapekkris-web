// Lightweight, privacy-friendly page counts: one increment per page per browser session, stored
// as daily totals in Supabase. No cookies, IPs or visitor identifiers are collected.

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

const TRACKED_PAGES = ['home', 'organisasi', 'event', 'renungan', 'alkitab', 'lagu', 'doa', 'easyworship', 'galeri', 'assets', 'form'] as const;
const SESSION_KEY = 'bapekkris_viewed_pages';

function alreadyCounted(page: string): boolean {
  try {
    const seen: string[] = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
    if (seen.includes(page)) return true;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify([...seen, page]));
    return false;
  } catch {
    return false;
  }
}

/**
 * Counts a visit to a public page once per session. Skipped for signed-in admins, automated
 * browsers and offline visits so the numbers reflect real visitors.
 */
export function useTrackPageView(page: string, { enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || !(TRACKED_PAGES as readonly string[]).includes(page)) return;
    if (typeof navigator === 'undefined' || navigator.webdriver || navigator.onLine === false) return;
    if (alreadyCounted(page)) return;
    supabase.rpc('track_page_view', { p_page: page }).then(({ error }) => {
      if (error) console.warn('Page view not recorded:', error.message);
    });
  }, [page, enabled]);
}

export interface PageViewRow { day: string; page: string; views: number }

async function fetchPageViewStats(days: number): Promise<PageViewRow[]> {
  const { data, error } = await supabase.rpc('get_page_view_stats', { p_days: days });
  if (error) throw new Error(`Gagal memuat statistik pengunjung: ${error.message}`);
  return (data || []).map((r) => ({ day: r.day, page: r.page, views: r.views }));
}

export function usePageViewStats(days: number) {
  return useQuery({ queryKey: ['analytics', days], queryFn: () => fetchPageViewStats(days), staleTime: 60_000 });
}
